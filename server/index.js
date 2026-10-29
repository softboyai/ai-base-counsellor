import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import counsellorRoutes from "./routes/counsellors.js";
import recommendationRoutes from "./routes/recommendations.js";
import appointmentRoutes from "./routes/appointments.js";
import reviewRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";
import reportRoutes from "./routes/reports.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_PORT = process.env.CLIENT_PORT || 5173;

app.use(cors({ origin: [`http://localhost:${CLIENT_PORT}`, "http://127.0.0.1:" + CLIENT_PORT], credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/counsellors", counsellorRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    console.log("[DB] Connected to MongoDB");
    app.listen(PORT, () => console.log(`[API] Baho Counselling API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("[DB] Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();
