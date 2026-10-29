import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "baho_counselling";

let client;
let db;

export async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db(dbName);

  // Ensure indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("appointments").createIndex({ clientId: 1 });
  await db.collection("appointments").createIndex({ counsellorId: 1 });
  await db.collection("reviews").createIndex({ counsellorId: 1 });

  return db;
}

export function getDB() {
  if (!db) throw new Error("Database not connected. Call connectDB first.");
  return db;
}

export { ObjectId };

export function collections() {
  const database = getDB();
  return {
    users: database.collection("users"),
    counsellors: database.collection("counsellors"),
    appointments: database.collection("appointments"),
    reviews: database.collection("reviews"),
    intakes: database.collection("intakes"),
  };
}
