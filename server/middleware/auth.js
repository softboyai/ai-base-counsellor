import jwt from "jsonwebtoken";
import { collections, ObjectId } from "../db.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorised. Please log in." });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token expired or invalid." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorised." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden. Insufficient role." });
    }
    next();
  };
}

export async function loadCounsellor(req, res, next) {
  try {
    const { counsellors } = collections();
    const c = await counsellors.findOne({ userId: new ObjectId(req.user.id) });
    if (!c) return res.status(404).json({ error: "Counsellor profile not found." });
    req.counsellor = c;
    next();
  } catch (err) {
    next(err);
  }
}
