import "dotenv/config";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "baho_counselling";

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Clear existing data
  await db.collection("users").deleteMany({});
  await db.collection("counsellors").deleteMany({});
  await db.collection("appointments").deleteMany({});
  await db.collection("reviews").deleteMany({});
  await db.collection("intakes").deleteMany({});

  // Create indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("appointments").createIndex({ clientId: 1 });
  await db.collection("appointments").createIndex({ counsellorId: 1 });
  await db.collection("reviews").createIndex({ counsellorId: 1 });

  const hash = (pw) => bcrypt.hashSync(pw, 12);

  // ---- 1. Admin Account ----
  const adminUser = {
    _id: new ObjectId(),
    name: "Dr. Amina Uwase",
    email: "admin@baho.rw",
    phone: "+250 788 000 001",
    passwordHash: hash("Admin@1234"),
    role: "admin",
    createdAt: new Date(),
  };

  // ---- 2. Three Specific Clients with Personal Emails ----
  const specificClients = [
    {
      _id: new ObjectId(),
      name: "Divine Mutoni",
      email: "divine.mutoni@gmail.com",
      phone: "+250 788 123 456",
      passwordHash: hash("Client@1234"),
      role: "client",
      createdAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Eric Kamanzi",
      email: "kamanzi.eric@yahoo.com",
      phone: "+250 785 987 654",
      passwordHash: hash("Client@1234"),
      role: "client",
      createdAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: "Fiona Umutoniwase",
      email: "fiona.umuto@outlook.com",
      phone: "+250 783 456 789",
      passwordHash: hash("Client@1234"),
      role: "client",
      createdAt: new Date(),
    }
  ];

  // ---- 3. Counsellor Accounts & Profiles ----
  const rawCounsellors = [
    { name: "Jean Pierre Habimana", email: "jean.pierre@baho.rw", title: "Clinical Psychologist", specializations: ["anxiety", "trauma", "stress and burnout"], languages: ["Kinyarwanda", "French", "English"], price: 15000, gender: "male", exp: 8 },
    { name: "Dr. Solange Niyonkuru", email: "solange.n@baho.rw", title: "Psychiatrist and Counsellor", specializations: ["depression", "grief", "family and relationships"], languages: ["Kinyarwanda", "English"], price: 20000, gender: "female", exp: 12 },
    { name: "Emmanuel Rwigamba", email: "emmanuel.r@baho.rw", title: "Counselling Psychologist", specializations: ["youth and adolescents", "stress and burnout", "anxiety"], languages: ["Kinyarwanda", "English", "Swahili"], price: 12000, gender: "male", exp: 5 },
    { name: "Chantal Mukamusoni", email: "chantal.m@baho.rw", title: "Licensed Therapist", specializations: ["addiction", "trauma", "depression"], languages: ["Kinyarwanda", "French"], price: 18000, gender: "female", exp: 9 },
    { name: "Dr. Patrick Uwimana", email: "patrick.u@baho.rw", title: "Marriage and Family Therapist", specializations: ["couples", "family and relationships", "grief"], languages: ["Kinyarwanda", "English", "French"], price: 25000, gender: "male", exp: 15 },
    { name: "Ange Uwineza", email: "ange.u@baho.rw", title: "Psychosocial Counsellor", specializations: ["stress and burnout", "anxiety", "depression"], languages: ["Kinyarwanda", "English"], price: 10000, gender: "female", exp: 4 },
    { name: "Pierre Hakizimana", email: "pierre.h@baho.rw", title: "Trauma Specialist", specializations: ["trauma", "grief", "anxiety"], languages: ["Kinyarwanda", "French", "English"], price: 22000, gender: "male", exp: 10 },
    { name: "Diane Ishimwe", email: "diane.i@baho.rw", title: "Child and Adolescent Therapist", specializations: ["youth and adolescents", "anxiety", "family and relationships"], languages: ["Kinyarwanda", "English"], price: 14000, gender: "female", exp: 6 },
    { name: "Fabrice Niyonzima", email: "fabrice.n@baho.rw", title: "Addiction Recovery Counsellor", specializations: ["addiction", "stress and burnout", "depression"], languages: ["Kinyarwanda", "French", "English"], price: 16000, gender: "male", exp: 7 },
    { name: "Vestine Uwamahoro", email: "vestine.u@baho.rw", title: "Couples and Relationship Therapist", specializations: ["couples", "family and relationships", "stress and burnout"], languages: ["Kinyarwanda", "English", "Swahili"], price: 19000, gender: "female", exp: 8 },
    { name: "Albert Rutaganda", email: "albert.r@baho.rw", title: "Community Mental Health Worker", specializations: ["anxiety", "depression", "grief"], languages: ["Kinyarwanda", "Swahili"], price: 8000, gender: "male", exp: 3 },
    { name: "Annette Mukagatare", email: "annette.m@baho.rw", title: "Senior Psychologist", specializations: ["depression", "anxiety", "trauma"], languages: ["Kinyarwanda", "French", "English"], price: 15000, gender: "female", exp: 14 }
  ];

  const counsellorUsers = [];
  const counsellorProfiles = [];

  for (const c of rawCounsellors) {
    const userId = new ObjectId();
    
    counsellorUsers.push({
      _id: userId,
      name: c.name,
      email: c.email,
      phone: `+250 788 100 ${Math.floor(Math.random() * 900 + 100)}`,
      passwordHash: hash("Counsellor@1234"),
      role: "counsellor",
      createdAt: new Date()
    });

    counsellorProfiles.push({
      _id: new ObjectId(),
      userId: userId,
      fullName: c.name,
      title: c.title,
      bio: `${c.name} is a dedicated mental health professional working at Baho Hospital, specializing in custom client care.`,
      specializations: c.specializations,
      approaches: ["CBT", "supportive counselling"],
      languages: c.languages,
      gender: c.gender,
      yearsExperience: c.exp,
      sessionModes: ["in-person", "video"],
      sessionFeeRWF: c.price,
      availability: [
        { day: "Monday", timeSlots: ["09:00", "10:00", "11:00"] },
        { day: "Wednesday", timeSlots: ["14:00", "15:00"] }
      ],
      avgRating: 4.8,
      sessionsCount: Math.floor(Math.random() * 100 + 10),
      acceptingNewClients: true,
      createdAt: new Date()
    });
  }

  // ---- 4. Extra Random Rwandan Clients ----
  const clientUsers = [];
  const rwandanNames = [
    "Placide Nshuti", "Grace Uwimana", "Patrick Nzeyimana", "Solange Umubyeyi",
    "Olivier Hakizimana", "Diane Uwingabire", "Yvette Mukamusoni", "Samuel Gashugi",
    "Beatrice Uwineza", "David Kayiranga", "Annick Iradukunda", "Christian Bizimana"
  ];

  for (const name of rwandanNames) {
    const firstName = name.split(" ")[0].toLowerCase();
    clientUsers.push({
      _id: new ObjectId(),
      name,
      email: `${firstName}.${Math.floor(Math.random() * 899 + 100)}@gmail.com`,
      phone: `+250 78${Math.floor(Math.random() * 9000000 + 1000000)}`,
      passwordHash: hash("Password@1234"),
      role: "client",
      createdAt: new Date(),
    });
  }

  const allUsers = [adminUser, ...specificClients, ...counsellorUsers, ...clientUsers];
  
  await db.collection("users").insertMany(allUsers);
  await db.collection("counsellors").insertMany(counsellorProfiles);

  console.log("\n[SEED SUCCESS] Database populated successfully!");
  console.log("==================================================");
  console.log("Admin Credentials:     admin@baho.rw | Admin@1234");
  console.log("==================================================");
  console.log("Test Client Accounts (Password for all: Client@1234):");
  specificClients.forEach(c => console.log(`  - ${c.name}: ${c.email}`));
  console.log("==================================================");
  console.log(`Total Counsellor Accounts injected: ${counsellorProfiles.length} (Password: Counsellor@1234)`);

  await client.close();
}

seed().catch(console.error);
