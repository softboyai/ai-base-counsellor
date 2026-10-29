import { Router } from "express";
import { z } from "zod";
import { collections } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { recommend } from "../utils/recommender.js";
import { ObjectId } from "../db.js";

const router = Router();

const intakeSchema = z.object({
  concerns: z.array(z.string()).min(1),
  preferredLanguage: z.string().optional(),
  preferredGender: z.string().optional().default("no preference"),
  sessionMode: z.string().optional(),
  urgency: z.enum(["routine", "soon", "urgent"]).default("routine"),
  budgetMax: z.number().optional(),
  preferredDays: z.array(z.string()).optional(),
  previousCounselling: z.boolean().optional(),
  consentGiven: z.boolean(),
});

// POST /api/recommendations
router.post("/", requireAuth, requireRole("client"), async (req, res, next) => {
  try {
    const parsed = intakeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    if (!parsed.data.consentGiven) {
      return res.status(400).json({ error: "Consent is required before submitting an intake." });
    }

    const intake = { ...parsed.data, clientId: new ObjectId(req.user.id) };

    // Save intake first (without concern content in logs)
    const { intakes } = collections();
    const intakeResult = await intakes.insertOne({ ...intake, createdAt: new Date() });

    // Get recommendations
    const ranked = await recommend(intake);

    // Save snapshot back to intake
    const snapshot = ranked.map((r) => ({
      counsellorId: r.counsellor._id,
      matchPercent: r.matchPercent,
      reason: r.reason,
      breakdown: r.breakdown,
    }));
    await intakes.updateOne({ _id: intakeResult.insertedId }, { $set: { recommendationSnapshot: snapshot } });

    res.json({
      intakeId: intakeResult.insertedId,
      results: ranked.map((r) => ({
        counsellor: r.counsellor,
        matchPercent: r.matchPercent,
        reason: r.reason,
        breakdown: r.breakdown,
        earliestSlot: r.earliestSlot,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/recommendations/:intakeId - retrieve saved intake and snapshot
router.get("/:intakeId", requireAuth, async (req, res, next) => {
  try {
    const { intakes, counsellors } = collections();
    const intake = await intakes.findOne({ _id: new ObjectId(req.params.intakeId) });
    if (!intake) return res.status(404).json({ error: "Intake not found." });

    // Access control: client who owns it, their booked counsellor, or admin
    const isOwner = intake.clientId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin && req.user.role !== "counsellor") {
      return res.status(403).json({ error: "Forbidden." });
    }

    // Rebuild counsellor profiles from snapshot
    const results = [];
    for (const snap of intake.recommendationSnapshot || []) {
      const c = await counsellors.findOne({ _id: snap.counsellorId });
      if (c) {
        results.push({ counsellor: c, matchPercent: snap.matchPercent, reason: snap.reason, breakdown: snap.breakdown });
      }
    }

    res.json({ intake, results });
  } catch (err) {
    next(err);
  }
});

export default router;
