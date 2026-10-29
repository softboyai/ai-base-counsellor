/**
 * Baho Counselling: Recommender Evaluation
 * Reports Precision@K and Recall@K on a train/test split.
 * Run: node server/scripts/evaluate.js
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "baho_counselling";

async function evaluate() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const reviews = await db.collection("reviews").find({}).toArray();
  const intakes = await db.collection("intakes").find({}).toArray();
  const counsellors = await db.collection("counsellors").find({}).toArray();

  if (reviews.length < 10) {
    console.log("[evaluate] Not enough review data. Run the seed first.");
    await client.close();
    return;
  }

  // Train/test split: 80/20
  const shuffled = reviews.sort(() => Math.random() - 0.5);
  const split = Math.floor(shuffled.length * 0.8);
  const trainSet = shuffled.slice(0, split);
  const testSet = shuffled.slice(split);

  // Build ground truth: clientId -> Set of counsellorIds they rated >= 4
  const groundTruth = {};
  for (const r of testSet) {
    if (r.rating >= 4) {
      const cId = r.clientId.toString();
      if (!groundTruth[cId]) groundTruth[cId] = new Set();
      groundTruth[cId].add(r.counsellorId.toString());
    }
  }

  const Ks = [1, 3, 5];
  const results = {};
  for (const K of Ks) results[K] = { precisions: [], recalls: [] };

  for (const [clientId, relevant] of Object.entries(groundTruth)) {
    const intake = intakes.find((i) => i.clientId.toString() === clientId);
    if (!intake) continue;

    // Simple content score for each counsellor
    const scored = counsellors
      .filter((c) => c.acceptingNewClients)
      .map((c) => {
        const overlap = (intake.concerns || []).filter((con) =>
          c.specializations?.map((s) => s.toLowerCase()).includes(con.toLowerCase())
        ).length;
        const langMatch = c.languages?.map((l) => l.toLowerCase()).includes(
          (intake.preferredLanguage || "").toLowerCase()
        ) ? 1 : 0;
        const score = (overlap / Math.max(intake.concerns?.length || 1, 1)) * 0.6 + langMatch * 0.4;
        return { id: c._id.toString(), score };
      })
      .sort((a, b) => b.score - a.score);

    for (const K of Ks) {
      const topK = new Set(scored.slice(0, K).map((s) => s.id));
      const tp = [...topK].filter((id) => relevant.has(id)).length;
      results[K].precisions.push(tp / K);
      results[K].recalls.push(tp / relevant.size);
    }
  }

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  console.log("\n====================================");
  console.log("  Baho Counselling Recommender Eval ");
  console.log("====================================");
  console.log(`  Train: ${trainSet.length} reviews | Test: ${testSet.length} reviews`);
  console.log(`  Clients with ground truth: ${Object.keys(groundTruth).length}`);
  console.log("------------------------------------");
  console.log("  K  | Precision@K | Recall@K");
  console.log("------------------------------------");
  for (const K of Ks) {
    const p = (avg(results[K].precisions) * 100).toFixed(1);
    const r = (avg(results[K].recalls) * 100).toFixed(1);
    console.log(`  ${K}  |    ${p.padStart(5)}%   |  ${r.padStart(5)}%`);
  }
  console.log("====================================\n");

  await client.close();
}

evaluate().catch((err) => {
  console.error("[evaluate] Error:", err.message);
  process.exit(1);
});
