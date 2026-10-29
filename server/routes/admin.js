import { Router } from "express";
import { collections } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/stats", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { appointments, counsellors, users, reviews } = collections();

    const totalAppointments = await appointments.countDocuments();
    const totalCounsellors = await counsellors.countDocuments();
    const totalClients = await users.countDocuments({ role: "client" });
    const totalReviews = await reviews.countDocuments();

    // Status breakdown
    const statusAgg = await appointments
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray();
    const statusBreakdown = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));

    // Appointments over time (last 12 months, grouped by month)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const timelineRaw = await appointments
      .aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ])
      .toArray();

    const timeline = timelineRaw.map((t) => ({
      label: `${t._id.year}-${String(t._id.month).padStart(2, "0")}`,
      count: t.count,
    }));

    // Top counsellors by session count
    const topCounsellors = await counsellors
      .find({})
      .sort({ sessionsCount: -1 })
      .limit(5)
      .toArray();

    // Demand by specialization
    const specAgg = await appointments
      .aggregate([
        {
          $lookup: {
            from: "counsellors",
            localField: "counsellorId",
            foreignField: "_id",
            as: "counsellorData",
          },
        },
        { $unwind: "$counsellorData" },
        { $unwind: "$counsellorData.specializations" },
        { $group: { _id: "$counsellorData.specializations", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const demandBySpecialization = specAgg.map((s) => ({ name: s._id, count: s.count }));

    res.json({
      totalAppointments,
      totalCounsellors,
      totalClients,
      totalReviews,
      statusBreakdown,
      timeline,
      topCounsellors,
      demandBySpecialization,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
