import { Router } from "express";
import PDFDocument from "pdfkit";
import { collections, ObjectId } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const PINE = "#1E5B47";
const INK = "#16211D";
const MUTED = "#667068";
const PAPER = "#F3EEE4";
const LINE = "#DDD5C6";

function drawHeader(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 80).fill(PINE);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20).text("Baho Counselling", 40, 22);
  doc.font("Helvetica").fontSize(10).text("Baho Hospital, Kigali, Rwanda", 40, 46);
  doc.fillColor("#FFFFFF").fontSize(12).font("Helvetica-Bold").text(title, 300, 22, { align: "right", width: 260 });
  doc.font("Helvetica").fontSize(9).text(subtitle, 300, 42, { align: "right", width: 260 });
  doc.moveDown(5);
}

function drawFooter(doc) {
  const y = doc.page.height - 40;
  doc.moveTo(40, y - 10).lineTo(doc.page.width - 40, y - 10).strokeColor(LINE).lineWidth(0.5).stroke();
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text(
      "This report suggests counsellors only and is not medical advice.",
      40,
      y,
      { width: doc.page.width - 80, align: "center" }
    );
}

function statCard(doc, x, y, label, value) {
  doc.rect(x, y, 115, 60).fillAndStroke("#F0F7F4", LINE);
  doc.fillColor(PINE).font("Helvetica-Bold").fontSize(22).text(String(value), x + 10, y + 10, { width: 95 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(label, x + 10, y + 40, { width: 95 });
}

// Draw a simple bar chart using PDFKit shapes
function drawBarChart(doc, x, y, width, height, data, title) {
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(title, x, y - 20);
  if (!data.length) return;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const barWidth = Math.floor((width - 10) / data.length) - 4;

  data.forEach((d, i) => {
    const barH = Math.round((d.count / maxVal) * height);
    const bx = x + i * (barWidth + 4);
    const by = y + height - barH;
    doc.rect(bx, by, barWidth, barH).fill(PINE);
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(7)
      .text(d.name || d.label || "", bx, y + height + 4, { width: barWidth + 4, align: "center" });
    doc
      .fillColor(INK)
      .fontSize(7)
      .text(String(d.count), bx, by - 12, { width: barWidth + 4, align: "center" });
  });
}

// Draw area/line chart for timeline
function drawTimelineChart(doc, x, y, width, height, data, title) {
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(title, x, y - 20);
  if (!data.length) return;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const step = width / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    px: x + i * step,
    py: y + height - (d.count / maxVal) * height,
  }));

  // Fill area
  doc.save();
  doc.moveTo(points[0].px, y + height);
  points.forEach((p) => doc.lineTo(p.px, p.py));
  doc.lineTo(points[points.length - 1].px, y + height);
  doc.closePath().fillColor("#DCE9E1").fill();

  // Draw line
  doc.moveTo(points[0].px, points[0].py);
  points.slice(1).forEach((p) => doc.lineTo(p.px, p.py));
  doc.strokeColor(PINE).lineWidth(1.5).stroke();
  doc.restore();

  // X labels
  data.forEach((d, i) => {
    if (i % Math.ceil(data.length / 6) === 0) {
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(7)
        .text(d.label, x + i * step - 15, y + height + 4, { width: 30, align: "center" });
    }
  });
}

// ---- ADMIN REPORT ----
router.get("/admin", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { from, to, format } = req.query;
    const { appointments, counsellors, users } = collections();

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const matchFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const appts = await appointments.find(matchFilter).sort({ createdAt: -1 }).toArray();
    const enriched = await Promise.all(
      appts.map(async (a) => {
        const client = await users.findOne({ _id: a.clientId });
        const counsellor = await counsellors.findOne({ _id: a.counsellorId });
        return { ...a, clientName: client?.name || "Unknown", counsellorName: counsellor?.fullName || "Unknown" };
      })
    );

    if (format === "csv") {
      const rows = [
        "Date,Client,Counsellor,Mode,Status,Notes",
        ...enriched.map(
          (a) =>
            `"${a.date}","${a.clientName}","${a.counsellorName}","${a.mode}","${a.status}","${(a.notes || "").replace(/"/g, "'")}"`
        ),
      ];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="baho-admin-report.csv"`);
      return res.send(rows.join("\n"));
    }

    // PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="baho-admin-report.pdf"`);
    doc.pipe(res);

    const range = from && to ? `${from} to ${to}` : "All time";
    const generated = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    drawHeader(doc, "Admin Report", `Generated ${generated} | Range: ${range}`);

    // Stats
    const totalClients = await users.countDocuments({ role: "client" });
    const totalCounsellors = await counsellors.countDocuments();
    const completed = enriched.filter((a) => a.status === "completed").length;
    const pending = enriched.filter((a) => a.status === "pending").length;

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text("Overview", 40, 100);
    statCard(doc, 40, 118, "Total Appointments", enriched.length);
    statCard(doc, 165, 118, "Completed", completed);
    statCard(doc, 290, 118, "Counsellors", totalCounsellors);
    statCard(doc, 415, 118, "Clients", totalClients);

    doc.moveDown(7);

    // Timeline chart (appointments over time)
    const timelineMap = {};
    enriched.forEach((a) => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      timelineMap[key] = (timelineMap[key] || 0) + 1;
    });
    const timelineData = Object.entries(timelineMap)
      .sort()
      .map(([label, count]) => ({ label, count }));

    if (timelineData.length >= 2) {
      drawTimelineChart(doc, 40, 230, 520, 80, timelineData, "Appointments Over Time");
      doc.moveDown(10);
    }

    // Demand by specialization
    const specMap = {};
    for (const a of enriched) {
      const c = await counsellors.findOne({ _id: a.counsellorId });
      if (c) {
        (c.specializations || []).forEach((s) => { specMap[s] = (specMap[s] || 0) + 1; });
      }
    }
    const specData = Object.entries(specMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 12) + "." : name, count }));

    if (specData.length) {
      drawBarChart(doc, 40, 360, 520, 70, specData, "Demand by Specialization");
    }

    // Top counsellors table
    const topC = await counsellors.find({}).sort({ sessionsCount: -1 }).limit(5).toArray();
    doc.addPage();
    drawHeader(doc, "Top Counsellors", "");

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text("Top Counsellors by Sessions", 40, 100);
    const headers = ["Name", "Specializations", "Sessions", "Rating"];
    const colW = [180, 200, 70, 70];
    let ty = 118;
    doc.rect(40, ty, 520, 18).fill("#DCE9E1");
    let tx = 40;
    headers.forEach((h, i) => {
      doc.fillColor(PINE).font("Helvetica-Bold").fontSize(9).text(h, tx + 4, ty + 4, { width: colW[i] });
      tx += colW[i];
    });
    ty += 18;
    topC.forEach((c, idx) => {
      if (idx % 2 === 0) doc.rect(40, ty, 520, 18).fill("#F9F6F0").stroke(LINE);
      tx = 40;
      const row = [
        c.fullName,
        (c.specializations || []).slice(0, 2).join(", "),
        String(c.sessionsCount),
        `${(c.avgRating || 0).toFixed(1)} / 5`,
      ];
      row.forEach((cell, i) => {
        doc.fillColor(INK).font("Helvetica").fontSize(9).text(cell, tx + 4, ty + 4, { width: colW[i] - 6 });
        tx += colW[i];
      });
      ty += 18;
    });

    // Appointments table
    doc.moveDown(3);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text("Appointments", 40, ty + 20);
    const aHeaders = ["Date", "Client", "Counsellor", "Mode", "Status"];
    const aColW = [80, 140, 140, 80, 80];
    let ay = ty + 38;
    doc.rect(40, ay, 520, 18).fill("#DCE9E1");
    let ax = 40;
    aHeaders.forEach((h, i) => {
      doc.fillColor(PINE).font("Helvetica-Bold").fontSize(9).text(h, ax + 4, ay + 4, { width: aColW[i] });
      ax += aColW[i];
    });
    ay += 18;
    enriched.slice(0, 40).forEach((a, idx) => {
      if (ay > doc.page.height - 80) { doc.addPage(); ay = 60; }
      if (idx % 2 === 0) doc.rect(40, ay, 520, 18).fill("#F9F6F0").stroke(LINE);
      ax = 40;
      const row = [a.date, a.clientName, a.counsellorName, a.mode, a.status];
      row.forEach((cell, i) => {
        doc.fillColor(INK).font("Helvetica").fontSize(9).text(cell || "", ax + 4, ay + 4, { width: aColW[i] - 6 });
        ax += aColW[i];
      });
      ay += 18;
    });

    drawFooter(doc);
    doc.end();
  } catch (err) {
    next(err);
  }
});

// ---- CLIENT RECOMMENDATION REPORT ----
router.get("/recommendation/:intakeId", requireAuth, async (req, res, next) => {
  try {
    const { intakes, counsellors, appointments } = collections();
    const intake = await intakes.findOne({ _id: new ObjectId(req.params.intakeId) });
    if (!intake) return res.status(404).json({ error: "Intake not found." });

    if (intake.clientId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="baho-my-results-${req.params.intakeId}.pdf"`
    );
    doc.pipe(res);

    const generated = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    drawHeader(doc, "My Counsellor Results", `Generated ${generated}`);

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text("Your Recommended Counsellors", 40, 100);
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(
        "These suggestions are based on your intake responses. This is not a diagnosis or clinical advice.",
        40,
        118,
        { width: 520 }
      );

    let ry = 148;
    for (const snap of intake.recommendationSnapshot || []) {
      const c = await counsellors.findOne({ _id: snap.counsellorId });
      if (!c) continue;
      if (ry > doc.page.height - 140) { doc.addPage(); ry = 60; }
      doc.rect(40, ry, 520, 90).fillAndStroke("#F0F7F4", LINE);
      doc.fillColor(PINE).font("Helvetica-Bold").fontSize(13).text(c.fullName, 56, ry + 10);
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(c.title, 56, ry + 26);
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(28)
        .text(`${snap.matchPercent}%`, 460, ry + 18, { width: 80, align: "right" });
      doc.fillColor(MUTED).fontSize(8).font("Helvetica").text("match", 460, ry + 50, { width: 80, align: "right" });
      doc
        .fillColor(INK)
        .font("Helvetica")
        .fontSize(9)
        .text(snap.reason, 56, ry + 44, { width: 380 });
      doc
        .fillColor(MUTED)
        .fontSize(8)
        .text(
          `Content: ${snap.breakdown?.content || 0}%  Collaborative: ${snap.breakdown?.collaborative || 0}%  Quality: ${snap.breakdown?.quality || 0}%`,
          56,
          ry + 68
        );
      ry += 100;
    }

    // Client appointments
    doc.moveDown(2);
    const appts = await appointments.find({ clientId: intake.clientId }).sort({ date: -1 }).toArray();
    if (appts.length) {
      if (ry > doc.page.height - 120) { doc.addPage(); ry = 60; }
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text("Your Appointments", 40, ry + 10);
      ry += 30;
      for (const a of appts) {
        const c2 = await counsellors.findOne({ _id: a.counsellorId });
        if (ry > doc.page.height - 80) { doc.addPage(); ry = 60; }
        doc
          .fillColor(INK)
          .font("Helvetica")
          .fontSize(9)
          .text(`${a.date} ${a.timeSlot} with ${c2?.fullName || "Counsellor"} (${a.status})`, 40, ry);
        ry += 16;
      }
    }

    drawFooter(doc);
    doc.end();
  } catch (err) {
    next(err);
  }
});

// ---- COUNSELLOR SCHEDULE REPORT ----
router.get("/my-appointments", requireAuth, async (req, res, next) => {
  try {
    const { appointments, counsellors, users } = collections();
    let appts;
    let ownerName = req.user.name;

    if (req.user.role === "counsellor") {
      const c = await counsellors.findOne({ userId: new ObjectId(req.user.id) });
      if (!c) return res.status(404).json({ error: "Counsellor profile not found." });
      ownerName = c.fullName;
      appts = await appointments.find({ counsellorId: c._id }).sort({ date: -1 }).toArray();
    } else if (req.user.role === "client") {
      appts = await appointments.find({ clientId: new ObjectId(req.user.id) }).sort({ date: -1 }).toArray();
    } else {
      appts = await appointments.find({}).sort({ date: -1 }).toArray();
    }

    const { format } = req.query;
    const enriched = await Promise.all(
      appts.map(async (a) => {
        const client = await users.findOne({ _id: a.clientId });
        const counsellor = await counsellors.findOne({ _id: a.counsellorId });
        return { ...a, clientName: client?.name || "Client", counsellorName: counsellor?.fullName || "" };
      })
    );

    if (format === "csv") {
      const rows = [
        "Date,Time,Client,Counsellor,Mode,Status",
        ...enriched.map(
          (a) =>
            `"${a.date}","${a.timeSlot}","${a.clientName}","${a.counsellorName}","${a.mode}","${a.status}"`
        ),
      ];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="baho-schedule.csv"`);
      return res.send(rows.join("\n"));
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="baho-schedule.pdf"`);
    doc.pipe(res);

    const generated = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    drawHeader(doc, "Session Schedule", `${ownerName} | Generated ${generated}`);

    doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text("Session Schedule", 40, 100);

    const headers = ["Date", "Time", "Client", "Mode", "Status"];
    const colW = [90, 80, 180, 90, 80];
    let ty = 122;
    doc.rect(40, ty, 520, 18).fill("#DCE9E1");
    let tx = 40;
    headers.forEach((h, i) => {
      doc.fillColor(PINE).font("Helvetica-Bold").fontSize(9).text(h, tx + 4, ty + 4, { width: colW[i] });
      tx += colW[i];
    });
    ty += 18;

    enriched.forEach((a, idx) => {
      if (ty > doc.page.height - 80) { doc.addPage(); ty = 60; }
      if (idx % 2 === 0) doc.rect(40, ty, 520, 18).fill("#F9F6F0").stroke(LINE);
      tx = 40;
      const row = [a.date, a.timeSlot, a.clientName, a.mode, a.status];
      row.forEach((cell, i) => {
        doc.fillColor(INK).font("Helvetica").fontSize(9).text(cell || "", tx + 4, ty + 4, { width: colW[i] - 6 });
        tx += colW[i];
      });
      ty += 18;
    });

    drawFooter(doc);
    doc.end();
  } catch (err) {
    next(err);
  }
});

export default router;
