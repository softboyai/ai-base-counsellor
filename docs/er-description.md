# ER Description: Baho Counselling Collections

MongoDB is a document store, so relationships are expressed through references (ObjectId) rather than foreign keys. Below is a description of each collection and how they relate.

## users
Stores all system accounts regardless of role.

| Field        | Type     | Notes                              |
|--------------|----------|------------------------------------|
| _id          | ObjectId | Primary key                        |
| name         | String   |                                    |
| email        | String   | Unique index                       |
| phone        | String   |                                    |
| passwordHash | String   | bcrypt hash, never returned to API |
| role         | String   | "client", "counsellor" or "admin"  |
| createdAt    | Date     |                                    |

## counsellors
One record per counsellor. Links back to a user account via userId.

| Field               | Type     | Notes                                       |
|---------------------|----------|---------------------------------------------|
| _id                 | ObjectId | Primary key                                 |
| userId              | ObjectId | Reference to users._id (nullable)           |
| fullName            | String   |                                             |
| title               | String   |                                             |
| bio                 | String   |                                             |
| specializations     | Array    | Strings: anxiety, depression, trauma, etc.  |
| approaches          | Array    | Strings: CBT, trauma-focused, etc.          |
| languages           | Array    | Strings: Kinyarwanda, English, etc.         |
| gender              | String   |                                             |
| yearsExperience     | Number   |                                             |
| sessionModes        | Array    | Strings: in-person, video, phone            |
| sessionFeeRWF       | Number   |                                             |
| availability        | Array    | Objects: { day, timeSlots[] }               |
| avgRating           | Number   | Computed from reviews                       |
| sessionsCount       | Number   | Incremented on appointment completion       |
| acceptingNewClients | Boolean  |                                             |
| createdAt           | Date     |                                             |

## intakes
One record per intake form submission. Stores client preferences and a snapshot of recommendation results.

| Field                   | Type     | Notes                              |
|-------------------------|----------|------------------------------------|
| _id                     | ObjectId | Primary key                        |
| clientId                | ObjectId | Reference to users._id             |
| concerns                | Array    | Strings                            |
| preferredLanguage       | String   |                                    |
| preferredGender         | String   |                                    |
| sessionMode             | String   |                                    |
| urgency                 | String   | routine, soon, urgent              |
| budgetMax               | Number   |                                    |
| preferredDays           | Array    | Strings                            |
| previousCounselling     | Boolean  |                                    |
| consentGiven            | Boolean  |                                    |
| recommendationSnapshot  | Array    | { counsellorId, matchPercent, reason, breakdown } |
| createdAt               | Date     |                                    |

## appointments
One record per booked session.

| Field       | Type     | Notes                                              |
|-------------|----------|----------------------------------------------------|
| _id         | ObjectId | Primary key                                        |
| clientId    | ObjectId | Reference to users._id (indexed)                   |
| counsellorId| ObjectId | Reference to counsellors._id (indexed)             |
| date        | String   | ISO date string                                    |
| timeSlot    | String   | e.g. "09:00"                                       |
| mode        | String   | in-person, video, phone                            |
| status      | String   | pending, confirmed, completed, cancelled           |
| notes       | String   |                                                    |
| createdAt   | Date     |                                                    |

## reviews
One review per completed appointment.

| Field        | Type     | Notes                                       |
|--------------|----------|---------------------------------------------|
| _id          | ObjectId | Primary key                                 |
| clientId     | ObjectId | Reference to users._id                      |
| counsellorId | ObjectId | Reference to counsellors._id (indexed)      |
| appointmentId| ObjectId | Reference to appointments._id               |
| rating       | Number   | 1 to 5                                      |
| comment      | String   |                                             |
| createdAt    | Date     |                                             |

## Relationships
- users 1..* intakes (one client can submit many intakes)
- users 1..* appointments as client
- counsellors 1..* appointments
- appointments 0..1 reviews (one review per completed appointment)
- counsellors 1..* reviews
