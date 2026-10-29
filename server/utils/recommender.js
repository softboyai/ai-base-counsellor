/**
 * Baho Counselling: Hybrid Recommendation Engine
 *
 * Combines content-based filtering, item-based collaborative filtering,
 * and a quality score into a weighted hybrid model.
 *
 * Final score: 0.6 * content + 0.25 * collaborative + 0.15 * quality
 * Cold start (no history): 0.75 * content + 0.25 * quality
 */

import { collections } from "../db.js";

// ---- helpers ----

function overlap(arrA, arrB) {
  if (!arrA?.length || !arrB?.length) return 0;
  const setB = new Set(arrB.map((x) => x.toLowerCase()));
  const matched = arrA.filter((x) => setB.has(x.toLowerCase())).length;
  return matched / Math.max(arrA.length, arrB.length);
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, normA = 0, normB = 0;
  for (const k of keys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// ---- content score ----

function computeContentScore(intake, counsellor) {
  let score = 0;
  const weights = {
    concerns: 0.30,
    language: 0.20,
    gender: 0.10,
    mode: 0.15,
    budget: 0.10,
    availability: 0.10,
    accepting: 0.05,
  };

  // Concern vs specialization
  score += weights.concerns * overlap(intake.concerns, counsellor.specializations);

  // Language
  const langMatch = intake.preferredLanguage &&
    counsellor.languages?.map((l) => l.toLowerCase()).includes(intake.preferredLanguage.toLowerCase());
  score += weights.language * (langMatch ? 1 : 0);

  // Gender preference
  if (!intake.preferredGender || intake.preferredGender === "no preference") {
    score += weights.gender;
  } else {
    score += weights.gender * (counsellor.gender?.toLowerCase() === intake.preferredGender.toLowerCase() ? 1 : 0);
  }

  // Session mode
  const modeMatch = intake.sessionMode &&
    counsellor.sessionModes?.map((m) => m.toLowerCase()).includes(intake.sessionMode.toLowerCase());
  score += weights.mode * (modeMatch ? 1 : 0);

  // Budget
  if (!intake.budgetMax || intake.budgetMax <= 0) {
    score += weights.budget;
  } else {
    score += weights.budget * (counsellor.sessionFeeRWF <= intake.budgetMax ? 1 : 0);
  }

  // Preferred days vs availability
  if (intake.preferredDays?.length && counsellor.availability?.length) {
    const availDays = counsellor.availability.map((a) => a.day?.toLowerCase());
    const preferred = intake.preferredDays.map((d) => d.toLowerCase());
    const matched = preferred.filter((d) => availDays.includes(d)).length;
    score += weights.availability * (matched / preferred.length);
  } else {
    score += weights.availability * 0.5;
  }

  // Urgency boost: if urgent, bump score if counsellor has availability
  if (intake.urgency === "urgent" && counsellor.availability?.length) {
    score = Math.min(1, score + 0.05);
  }

  // Accepting new clients
  score += weights.accepting * (counsellor.acceptingNewClients ? 1 : 0);

  return Math.min(1, score);
}

// ---- quality score ----

function computeQualityScore(counsellor, allCounsellors) {
  const ratings = allCounsellors.map((c) => (c.avgRating || 0) * Math.log((c.sessionsCount || 0) + 1));
  const raw = (counsellor.avgRating || 0) * Math.log((counsellor.sessionsCount || 0) + 1);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const normalised = normalize(raw, min, max);

  // Small experience bonus (capped at 0.1)
  const expBonus = Math.min(0.1, (counsellor.yearsExperience || 0) / 100);
  return Math.min(1, normalised + expBonus);
}

// ---- collaborative score (item-based) ----

async function computeCollaborativeScores(intake, counsellorIds) {
  const { appointments, reviews } = collections();

  // Build a ratings matrix: clientId -> { counsellorId: rating }
  const allReviews = await reviews.find({}).toArray();
  const matrix = {};
  for (const r of allReviews) {
    const cId = r.clientId.toString();
    const coId = r.counsellorId.toString();
    if (!matrix[cId]) matrix[cId] = {};
    matrix[cId][coId] = r.rating;
  }

  // Find clients whose concern overlap with this intake
  const { intakes } = collections();
  const pastIntakes = await intakes.find({ concerns: { $in: intake.concerns || [] } }).toArray();
  const similarClientIds = new Set(pastIntakes.map((i) => i.clientId.toString()));

  // Build a "target" vector from similar clients
  const targetVec = {};
  for (const clientId of similarClientIds) {
    const row = matrix[clientId] || {};
    for (const [coId, rating] of Object.entries(row)) {
      targetVec[coId] = (targetVec[coId] || 0) + rating;
    }
  }

  // Score each counsellor
  const scores = {};
  for (const coId of counsellorIds) {
    const idStr = coId.toString();
    // Item-based: how similar is this counsellor's rating pattern to the target vector?
    const counsellorVec = {};
    for (const [clientId, row] of Object.entries(matrix)) {
      if (row[idStr]) counsellorVec[clientId] = row[idStr];
    }
    scores[idStr] = cosineSimilarity(targetVec, counsellorVec);
  }
  return scores;
}

// ---- find earliest available slot ----

function findEarliestSlot(counsellor, preferredDays) {
  if (!counsellor.availability?.length) return null;
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const slots = counsellor.availability.sort(
    (a, b) => dayOrder.indexOf(a.day?.toLowerCase()) - dayOrder.indexOf(b.day?.toLowerCase())
  );
  if (preferredDays?.length) {
    const preferred = preferredDays.map((d) => d.toLowerCase());
    const hit = slots.find((s) => preferred.includes(s.day?.toLowerCase()));
    if (hit) return `${hit.day} ${hit.timeSlots?.[0] || ""}`.trim();
  }
  const first = slots[0];
  return first ? `${first.day} ${first.timeSlots?.[0] || ""}`.trim() : null;
}

// ---- build reason string ----

function buildReason(intake, counsellor, scores) {
  const parts = [];
  const matchedConcerns = (intake.concerns || []).filter((c) =>
    counsellor.specializations?.map((s) => s.toLowerCase()).includes(c.toLowerCase())
  );
  if (matchedConcerns.length) parts.push(`Works with ${matchedConcerns.join(", ")}`);

  const langMatch = intake.preferredLanguage &&
    counsellor.languages?.map((l) => l.toLowerCase()).includes(intake.preferredLanguage.toLowerCase());
  if (langMatch) parts.push(`speaks ${intake.preferredLanguage}`);

  if (intake.budgetMax && counsellor.sessionFeeRWF <= intake.budgetMax) {
    parts.push(`fee within budget`);
  }

  const slot = findEarliestSlot(counsellor, intake.preferredDays);
  if (slot) parts.push(`available ${slot}`);

  if (scores.collaborative > 0.3) parts.push(`highly rated by clients with similar concerns`);

  return parts.join(", ") || "Good general match for your needs";
}

// ---- main export ----

export async function recommend(intake) {
  const { counsellors } = collections();
  const allCounsellors = await counsellors.find({ acceptingNewClients: true }).toArray();

  if (!allCounsellors.length) return [];

  // Collaborative scores (async, over all counsellors)
  const collabScores = await computeCollaborativeScores(intake, allCounsellors.map((c) => c._id));

  const results = allCounsellors.map((counsellor) => {
    const content = computeContentScore(intake, counsellor);
    const quality = computeQualityScore(counsellor, allCounsellors);
    const collaborative = collabScores[counsellor._id.toString()] || 0;

    // Cold start: no collaborative signal available
    const hasCollabSignal = collaborative > 0;
    let final;
    if (hasCollabSignal) {
      final = 0.6 * content + 0.25 * collaborative + 0.15 * quality;
    } else {
      final = 0.75 * content + 0.25 * quality;
    }

    // Urgent: small availability bump
    if (intake.urgency === "urgent") {
      final = Math.min(1, final + 0.03);
    }

    const breakdown = {
      content: Math.round(content * 100),
      collaborative: Math.round(collaborative * 100),
      quality: Math.round(quality * 100),
    };

    const reason = buildReason(intake, counsellor, { collaborative });
    const earliestSlot = findEarliestSlot(counsellor, intake.preferredDays);

    return {
      counsellor,
      score: final,
      matchPercent: Math.round(final * 100),
      reason,
      breakdown,
      earliestSlot,
    };
  });

  // Sort descending, return top 5
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}
