import { Router } from "express";
import { z } from "zod";
import { collections, ObjectId } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const reviewSchema = z.object({
  counsellorId: z.string(),
  appointmentId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// POST leave review (client, after completed appointment)
router.post("/", requireAuth, requireRole("client"), async (req, res, next) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { appointments, reviews, counsellors } = collections();

    // Verify completed appointment
    const appt = await appointments.findOne({
      _id: new ObjectId(parsed.data.appointmentId),
      clientId: new ObjectId(req.user.id),
      counsellorId: new ObjectId(parsed.data.counsellorId),
      status: "completed",
    });
    if (!appt) return res.status(403).json({ error: "You can only review after a completed appointment." });

    // Prevent duplicate review per appointment
    const existing = await reviews.findOne({ appointmentId: new ObjectId(parsed.data.appointmentId) });
    if (existing) return res.status(409).json({ error: "You have already reviewed this appointment." });

    await reviews.insertOne({
      clientId: new ObjectId(req.user.id),
      counsellorId: new ObjectId(parsed.data.counsellorId),
      appointmentId: new ObjectId(parsed.data.appointmentId),
      rating: parsed.data.rating,
      comment: parsed.data.comment || "",
      createdAt: new Date(),
    });

    // Recalculate average rating
    const allReviews = await reviews.find({ counsellorId: new ObjectId(parsed.data.counsellorId) }).toArray();
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await counsellors.updateOne(
      { _id: new ObjectId(parsed.data.counsellorId) },
      { $set: { avgRating: parseFloat(avgRating.toFixed(2)) } }
    );

    res.status(201).json({ message: "Review submitted. Thank you." });
  } catch (err) {
    next(err);
  }
});

// GET reviews for a counsellor
router.get("/:counsellorId", async (req, res, next) => {
  try {
    const { reviews, users } = collections();
    const list = await reviews
      .find({ counsellorId: new ObjectId(req.params.counsellorId) })
      .sort({ createdAt: -1 })
      .toArray();

    const enriched = await Promise.all(
      list.map(async (r) => {
        const client = await users.findOne({ _id: r.clientId });
        return { ...r, clientName: client?.name || "Anonymous" };
      })
    );
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

export default router;
