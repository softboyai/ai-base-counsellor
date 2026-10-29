import { Router } from "express";
import { z } from "zod";
import { collections, ObjectId } from "../db.js";
import { requireAuth, requireRole, loadCounsellor } from "../middleware/auth.js";

const router = Router();

const appointmentSchema = z.object({
  counsellorId: z.string(),
  date: z.string(),
  timeSlot: z.string(),
  mode: z.string(),
  notes: z.string().optional(),
});

// POST book appointment (client)
router.post("/", requireAuth, requireRole("client"), async (req, res, next) => {
  try {
    const parsed = appointmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { appointments, counsellors } = collections();

    const counsellor = await counsellors.findOne({ _id: new ObjectId(parsed.data.counsellorId) });
    if (!counsellor) return res.status(404).json({ error: "Counsellor not found." });

    const result = await appointments.insertOne({
      clientId: new ObjectId(req.user.id),
      counsellorId: new ObjectId(parsed.data.counsellorId),
      date: parsed.data.date,
      timeSlot: parsed.data.timeSlot,
      mode: parsed.data.mode,
      notes: parsed.data.notes || "",
      status: "pending",
      createdAt: new Date(),
    });
    const created = await appointments.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET my appointments (client)
router.get("/my", requireAuth, async (req, res, next) => {
  try {
    const { appointments, counsellors, users } = collections();
    let appts;
    if (req.user.role === "client") {
      appts = await appointments.find({ clientId: new ObjectId(req.user.id) }).sort({ date: -1 }).toArray();
    } else if (req.user.role === "counsellor") {
      // Find counsellor profile
      const c = await counsellors.findOne({ userId: new ObjectId(req.user.id) });
      if (!c) return res.json([]);
      appts = await appointments.find({ counsellorId: c._id }).sort({ date: -1 }).toArray();
    } else {
      appts = await appointments.find({}).sort({ date: -1 }).toArray();
    }

    // Enrich with names
    const enriched = await Promise.all(
      appts.map(async (a) => {
        const client = await users.findOne({ _id: a.clientId });
        const counsellor = await counsellors.findOne({ _id: a.counsellorId });
        return {
          ...a,
          clientName: client?.name || "Unknown",
          counsellorName: counsellor?.fullName || "Unknown",
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// PUT update status (counsellor or admin)
router.put("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { appointments, counsellors } = collections();
    const appt = await appointments.findOne({ _id: new ObjectId(req.params.id) });
    if (!appt) return res.status(404).json({ error: "Appointment not found." });

    const isAdmin = req.user.role === "admin";
    let isCounsellor = false;
    if (req.user.role === "counsellor") {
      const c = await counsellors.findOne({ userId: new ObjectId(req.user.id) });
      isCounsellor = c && c._id.toString() === appt.counsellorId.toString();
    }
    const isClient = req.user.role === "client" && appt.clientId.toString() === req.user.id;

    if (!isAdmin && !isCounsellor && !isClient) return res.status(403).json({ error: "Forbidden." });

    const allowed = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid status." });

    await appointments.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: req.body.status } });

    // Update counsellor session count when completed
    if (req.body.status === "completed") {
      await counsellors.updateOne({ _id: appt.counsellorId }, { $inc: { sessionsCount: 1 } });
    }

    const updated = await appointments.findOne({ _id: new ObjectId(req.params.id) });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET all appointments (admin)
router.get("/all", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { appointments, users, counsellors } = collections();
    const appts = await appointments.find({}).sort({ createdAt: -1 }).toArray();
    const enriched = await Promise.all(
      appts.map(async (a) => {
        const client = await users.findOne({ _id: a.clientId });
        const counsellor = await counsellors.findOne({ _id: a.counsellorId });
        return {
          ...a,
          clientName: client?.name || "Unknown",
          counsellorName: counsellor?.fullName || "Unknown",
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

export default router;
