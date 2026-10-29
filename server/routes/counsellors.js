import { Router } from "express";
import { z } from "zod";
import { collections, ObjectId } from "../db.js";
import { requireAuth, requireRole, loadCounsellor } from "../middleware/auth.js";

const router = Router();

const availabilitySlotSchema = z.object({
  day: z.string(),
  timeSlots: z.array(z.string()),
});

const counsellorSchema = z.object({
  fullName: z.string().min(2),
  title: z.string(),
  bio: z.string(),
  specializations: z.array(z.string()),
  approaches: z.array(z.string()),
  languages: z.array(z.string()),
  gender: z.string(),
  yearsExperience: z.number().int().min(0),
  sessionModes: z.array(z.string()),
  sessionFeeRWF: z.number().int().min(0),
  availability: z.array(availabilitySlotSchema),
  acceptingNewClients: z.boolean().default(true),
});

// GET all counsellors (public with filters)
router.get("/", async (req, res, next) => {
  try {
    const { counsellors } = collections();
    const filter = {};
    if (req.query.specialization) {
      filter.specializations = { $elemMatch: { $regex: req.query.specialization, $options: "i" } };
    }
    if (req.query.language) {
      filter.languages = { $elemMatch: { $regex: req.query.language, $options: "i" } };
    }
    if (req.query.mode) {
      filter.sessionModes = { $elemMatch: { $regex: req.query.mode, $options: "i" } };
    }
    if (req.query.gender) {
      filter.gender = { $regex: req.query.gender, $options: "i" };
    }
    if (req.query.accepting === "true") {
      filter.acceptingNewClients = true;
    }
    const list = await counsellors.find(filter).toArray();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET single counsellor
router.get("/:id", async (req, res, next) => {
  try {
    const { counsellors } = collections();
    const c = await counsellors.findOne({ _id: new ObjectId(req.params.id) });
    if (!c) return res.status(404).json({ error: "Counsellor not found." });
    res.json(c);
  } catch (err) {
    next(err);
  }
});

// POST create counsellor (admin only)
router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const parsed = counsellorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { users, counsellors } = collections();
    // Optionally link to a user account by email
    let userId = null;
    if (req.body.email) {
      const user = await users.findOne({ email: req.body.email });
      if (user) userId = user._id;
    }

    const result = await counsellors.insertOne({
      ...parsed.data,
      userId,
      avgRating: 0,
      sessionsCount: 0,
      createdAt: new Date(),
    });
    const created = await counsellors.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT update counsellor (admin or the counsellor themselves)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { counsellors } = collections();
    const c = await counsellors.findOne({ _id: new ObjectId(req.params.id) });
    if (!c) return res.status(404).json({ error: "Counsellor not found." });

    const isOwner = c.userId && c.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden." });

    const updates = req.body;
    delete updates._id;
    delete updates.userId;
    delete updates.avgRating;
    delete updates.sessionsCount;

    await counsellors.updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    const updated = await counsellors.findOne({ _id: new ObjectId(req.params.id) });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE counsellor (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { counsellors } = collections();
    const result = await counsellors.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Counsellor not found." });
    res.json({ message: "Counsellor removed." });
  } catch (err) {
    next(err);
  }
});

// GET counsellor's own profile (for counsellor dashboard)
router.get("/me/profile", requireAuth, requireRole("counsellor"), loadCounsellor, async (req, res) => {
  res.json(req.counsellor);
});

export default router;
