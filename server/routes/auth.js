import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { randomBytes } from "crypto";
import { collections, ObjectId } from "../db.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["client", "counsellor", "admin"]).default("client"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const data = parsed.data;
    const { users } = collections();

    const existing = await users.findOne({ email: data.email });
    if (existing) return res.status(409).json({ error: "Email already registered." });

    const passwordHash = await bcrypt.hash(data.password, 12);
    const result = await users.insertOne({
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      passwordHash,
      role: data.role,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { id: result.insertedId.toString(), email: data.email, role: data.role, name: data.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: result.insertedId, name: data.name, email: data.email, role: data.role },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Email already registered." });
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;
    const { users } = collections();

    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password." });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorised." });
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { users } = collections();
    const user = await users.findOne({ _id: new ObjectId(payload.id) });
    if (!user) return res.status(404).json({ error: "User not found." });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

// ---- Forgot password ----
// Generates a reset token (valid 1 hour), stores it hashed in the user doc.
// In this demo the token is returned in the API response so the frontend
// can display it without needing an email service.
// In production: send the token by email and do NOT return it in the response.
router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required." });

    const { users } = collections();
    const user = await users.findOne({ email });

    // Always respond the same way to avoid leaking which emails are registered.
    if (!user) {
      return res.json({ message: "If that email is registered you will receive a reset link." });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 8);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await users.updateOne(
      { _id: user._id },
      { $set: { resetTokenHash: tokenHash, resetTokenExpiry: expiresAt } }
    );

    // In a real deployment: send an email with the link instead of returning the token.
    // For this demo the token is returned so the developer can test the flow immediately.
    res.json({
      message: "Reset token generated. In production this would be sent by email.",
      // DEMO ONLY: remove this field and send by email in production.
      resetToken: rawToken,
      resetUrl: `/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`,
    });
  } catch (err) {
    next(err);
  }
});

// ---- Reset password ----
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ error: "Email, token and new password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const { users } = collections();
    const user = await users.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.resetTokenHash || !user.resetTokenExpiry) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(400).json({ error: "Reset token has expired. Please request a new one." });
    }

    const valid = await bcrypt.compare(token, user.resetTokenHash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await users.updateOne(
      { _id: user._id },
      {
        $set:   { passwordHash },
        $unset: { resetTokenHash: "", resetTokenExpiry: "" },
      }
    );

    res.json({ message: "Password updated. You can now log in with your new password." });
  } catch (err) {
    next(err);
  }
});

export default router;
