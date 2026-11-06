# Baho Counselling

An AI-Based Counsellor Recommendation System built for Baho Hospital, Kigali, Rwanda.
Academic project by a student at [Mount kigali university].

---

## What is this project?

Imagine you are feeling anxious, going through grief, or struggling with stress at work.
You go to Baho Hospital and you want to see a counsellor, but there are 12 different
counsellors and you have no idea who is right for you.

**This system solves that problem.**

You answer a few simple questions about what you need, and the system uses an AI
algorithm to find the counsellors who are the best fit for you. It shows you the top 5
matches, explains exactly why each one was chosen, and lets you book a session directly.

Think of it like a smart filter. Instead of reading 12 profiles and guessing, the system
does the matching work for you in seconds.

---

## Who uses this system?

There are three types of users:

**1. Client (patient)**
A person who needs counselling. They fill in a short form, see their matched counsellors,
book a session, and leave a review afterwards.

**2. Counsellor**
A mental health professional at Baho Hospital. They log in to see who has booked them,
confirm or complete appointments, and manage their availability schedule.

**3. Admin (hospital staff)**
A staff member who manages the whole system. They can add new counsellors, view all
appointments, see statistics and charts about the hospital's activity, and download reports.

---

## How to run the project (one command)

**Before you start, you need:**
- Node.js version 18 or newer (download from nodejs.org)
- MongoDB Community Edition installed and running (download from mongodb.com)

**Step 1: Start MongoDB**

- Windows: Press Win+R, type `services.msc`, find "MongoDB Server" and click Start.
  Or open a terminal and run: `mongod`
- macOS: `brew services start mongodb/brew/mongodb-community`
- Linux: `sudo systemctl start mongod`

**Step 2: Open a terminal in the project folder and run:**

```bash
npm start
```

That is the only command you need. The system will:
1. Create the config file automatically if it is missing
2. Install all packages for both the server and the client if not already installed
3. Check that MongoDB is reachable
4. Fill the database with sample data automatically (counsellors, clients, appointments)
5. Start the API server on port 5000
6. Start the website on port 5173
7. Open your browser automatically at http://localhost:5173

Press Ctrl+C to stop everything.

---

## Demo login accounts

Use these to explore the system without creating an account:

| Role       | Email                  | Password        |
|------------|------------------------|-----------------|
| Admin      | admin@baho.rw          | Admin@1234      |
| Counsellor | counsellor@baho.rw     | Counsellor@1234 |
| Client     | client@baho.rw         | Client@1234     |

---

## How does the AI work? (Plain English explanation)

This is the most important part of the project. The AI is called a **Hybrid Recommendation
Engine**. The word "hybrid" means it combines multiple methods together to get a better
result than any single method alone.

Here is how it works, step by step:

---

### Step 1: The client fills in an intake form

Before the AI can do anything, it needs information. The client answers up to 8 questions:

- What do you want support with? (anxiety, grief, stress, trauma, etc.)
- Which language do you prefer? (Kinyarwanda, English, French, Swahili)
- How would you like to meet? (in-person, video call, phone)
- How urgently do you need support? (routine, soon, urgent)
- Which days work for you?
- What is your budget per session?
- Do you have a gender preference for your counsellor?

This information is called the **intake**. It is saved privately in the database.

---

### Step 2: The AI scores every counsellor

Once the intake is saved, the AI looks at every counsellor in the database and gives
each one a score from 0 to 100. It calculates three separate scores:

---

#### Score A: Content Score (60% of the final result)

This is direct matching. The AI compares what the client needs to what each counsellor offers.

Example: If a client says "I need help with anxiety and I speak Kinyarwanda and I want a
video session and my budget is RWF 15,000", then a counsellor who:
- specialises in anxiety (match)
- speaks Kinyarwanda (match)
- offers video sessions (match)
- charges RWF 12,000 (within budget, match)

...will get a high content score. A counsellor who only speaks French and does not
specialise in anxiety will get a low content score.

The content score is broken down into weighted parts:

| What is being matched            | Weight |
|----------------------------------|--------|
| Concern vs specialisation        | 30%    |
| Language preference              | 20%    |
| Session mode (video/phone/etc.)  | 15%    |
| Availability on preferred days   | 10%    |
| Fee within budget                | 10%    |
| Gender preference                | 10%    |
| Currently accepting new clients  | 5%     |

---

#### Score B: Collaborative Score (25% of the final result)

This is inspired by how Netflix or Spotify recommends things to you.

The idea: if 10 other clients with similar concerns (like anxiety and stress) all gave
high ratings to Counsellor X, then the system assumes that a new client with those
same concerns will probably also like Counsellor X.

How it works technically:
1. The system looks at all past reviews in the database.
2. It finds clients whose intake concerns overlap with the current client's concerns.
3. It builds a list of which counsellors those similar clients rated highly.
4. It uses a mathematical formula called **cosine similarity** to measure how closely
   the current client's needs line up with that list of highly-rated counsellors.
5. Counsellors that similar clients loved get a higher collaborative score.

This is called **item-based collaborative filtering**. It does not need to know anything
personal about the client. It only looks at patterns in the rating data.

**Cold start problem:** If the system is brand new and has no ratings yet, there is no
collaborative data to use. In that case, the system falls back to using only the content
score and quality score. The weights adjust automatically:
- Normal: 60% content + 25% collaborative + 15% quality
- Cold start (no data): 75% content + 25% quality

---

#### Score C: Quality Score (15% of the final result)

This rewards counsellors who have a strong track record.

The formula is:
```
quality = normalised( avgRating * log(sessionsCount + 1) ) + experienceBonus
```

Breaking this down:
- `avgRating` is the counsellor's average star rating from client reviews (1 to 5).
- `sessionsCount` is how many completed sessions they have had.
- The `log()` function is used so that a counsellor with 100 sessions is not given a
  massively unfair advantage over one with 20 sessions. The log compresses the gap.
- `experienceBonus` adds a small extra score for years of professional experience
  (capped at +0.1 so it does not dominate).
- `normalised` means the score is scaled between 0 and 1 relative to all counsellors.

This ensures the AI does not just push the most popular counsellor every single time,
but still rewards real quality.

---

### Step 3: Combine the three scores

The final score for each counsellor is calculated like this:

```
Final score = (0.60 x Content) + (0.25 x Collaborative) + (0.15 x Quality)
```

If the urgency is set to "urgent", a small boost is added to counsellors who have
immediate availability.

---

### Step 4: Return the top 5 results

The counsellors are sorted from highest to lowest final score. The top 5 are returned
to the client with:
- A **match percentage** (e.g. 82%)
- A **plain English reason** (e.g. "Works with anxiety, speaks Kinyarwanda, available Monday")
- A **score breakdown** showing how much came from content, collaborative, and quality

This transparency is intentional. The client can see exactly why the system suggested
each counsellor, which builds trust.

---

### Visual diagram of the AI process

```
CLIENT FILLS INTAKE FORM
         |
         v
+---------------------------+
|  Intake saved to database |
+---------------------------+
         |
         v
+------------------------------------------------+
|  FOR EACH COUNSELLOR in the database:          |
|                                                |
|  Content Score (60%)                           |
|    Compare: concerns, language, mode,          |
|    budget, days, gender, accepting             |
|                                                |
|  Collaborative Score (25%)                     |
|    Find similar clients by concerns            |
|    See which counsellors they rated highly     |
|    Use cosine similarity to measure overlap    |
|                                                |
|  Quality Score (15%)                           |
|    avgRating x log(sessions) + experience      |
|                                                |
|  Final = 0.60*C + 0.25*Collab + 0.15*Quality  |
+------------------------------------------------+
         |
         v
+-------------------------------+
|  Sort counsellors by score    |
|  Take the top 5               |
+-------------------------------+
         |
         v
+----------------------------------------------+
|  Return to client:                           |
|  - Match percent                             |
|  - Plain English reason                      |
|  - Score breakdown (content/collab/quality)  |
+----------------------------------------------+
```

---

### How the system evaluates its own accuracy

The file `server/scripts/evaluate.js` measures how good the AI recommendations actually
are. It uses two standard metrics from information retrieval:

**Precision@K**: Out of the top K counsellors the system suggested, how many were ones
the client actually rated highly (4 or 5 stars)?

**Recall@K**: Out of all the counsellors a client rated highly, how many did the system
manage to include in its top K suggestions?

To test fairly, the data is split 80% for training and 20% for testing. The system is
evaluated on the 20% it has never seen. Run it with:

```bash
npm run evaluate
```

---

## Safety features built into the system

Mental health is a sensitive area. The system has several safety measures:

**1. Crisis detection**
If a client selects "I am in crisis" or types any of these words: "suicidal", "self-harm",
"want to die", "end my life" -- the system immediately stops the normal flow and shows
a crisis support panel FIRST, with the hospital phone number and emergency services.
No recommendations are shown until the client confirms they are safe.

**2. No diagnosis**
The system never says "you have anxiety disorder" or "you need CBT therapy". It only
suggests which counsellor might be a good fit. Every page carries a disclaimer:
"This system suggests counsellors only and is not medical advice."

**3. Consent required**
Before the intake form starts, the client must tick a consent checkbox. Without ticking
it, the form cannot be submitted. This is stored in the database.

**4. Private data**
Intake responses (what the client said they need) are only visible to:
- The client who submitted them
- The counsellor they actually booked
- The admin

No other counsellor can see another client's intake.

**5. Password security**
Passwords are never stored as plain text. They are hashed using bcrypt with a cost
factor of 12, which means even if someone accessed the database, they could not read
the passwords.

---

## Project structure explained

```
baho-counselling/
|
|-- package.json          The root config. "npm start" runs scripts/start.mjs
|-- .env.example          Template for environment variables (copy to server/.env)
|-- scripts/
|   |-- start.mjs         The one-command start script (pure Node.js, no extra tools)
|
|-- server/               Everything that runs on the server (the backend)
|   |-- index.js          The main Express app. Connects all routes together.
|   |-- db.js             Connects to MongoDB. Exports the database collections.
|   |-- middleware/
|   |   |-- auth.js       Checks login tokens (JWT). Blocks unauthorised requests.
|   |   |-- errorHandler.js  Catches any errors and returns a clean JSON response.
|   |-- routes/
|   |   |-- auth.js       Register, login, forgot password, reset password
|   |   |-- counsellors.js  List, create, update, delete counsellor profiles
|   |   |-- recommendations.js  THE MAIN AI ENDPOINT. Takes intake, returns top 5.
|   |   |-- appointments.js   Book, view, confirm, complete, cancel appointments
|   |   |-- reviews.js    Leave a star rating after a completed session
|   |   |-- admin.js      Statistics: totals, charts, top counsellors
|   |   |-- reports.js    Generate PDF and CSV reports using PDFKit
|   |-- utils/
|   |   |-- recommender.js  THE AI ENGINE. Content + collaborative + quality scores.
|   |-- scripts/
|       |-- seed.js       Fills the database with 12 counsellors and 40+ fake clients
|       |-- evaluate.js   Tests the AI accuracy with Precision@K and Recall@K
|
|-- client/               Everything the user sees in the browser (the frontend)
|   |-- index.html        The single HTML page that loads the React app
|   |-- vite.config.js    Vite dev server config. Proxies /api calls to port 5000.
|   |-- tailwind.config.js  Custom design system colours, fonts, spacing
|   |-- src/
|       |-- main.jsx      React app entry point
|       |-- index.css     Global styles, CSS variables for the colour theme
|       |-- App.jsx       Router: maps URL paths to page components
|       |-- lib/
|       |   |-- api.js    All fetch() calls to the backend in one place
|       |   |-- auth.js   Login state (stored in React context)
|       |   |-- utils.js  Helper functions: format currency, detect crisis words
|       |-- components/
|       |   |-- Navbar.jsx        Top navigation bar
|       |   |-- Button.jsx        Reusable button (primary, secondary, ghost styles)
|       |   |-- Input.jsx         Reusable text input and textarea
|       |   |-- CounsellorCard.jsx  The card shown on results and directory pages
|       |   |-- CrisisPanel.jsx   The safety panel shown when crisis is detected
|       |-- pages/
|           |-- Landing.jsx           Home page
|           |-- Login.jsx             Login form
|           |-- Register.jsx          Registration form
|           |-- ForgotPassword.jsx    Request a password reset token
|           |-- ResetPassword.jsx     Set a new password using the token
|           |-- FindCounsellor.jsx    The 8-step intake wizard (the main client flow)
|           |-- Results.jsx           Shows the top 5 AI-matched counsellors
|           |-- Directory.jsx         Browse all counsellors with filters
|           |-- CounsellorProfile.jsx Full counsellor page with reviews
|           |-- BookAppointment.jsx   Choose a date, time and mode to book
|           |-- MyAppointments.jsx    Client/counsellor/admin appointment list
|           |-- LeaveReview.jsx       Star rating form after a completed session
|           |-- CounsellorDashboard.jsx  Counsellor's home: see bookings, set availability
|           |-- AdminDashboard.jsx    Admin home: stats, manage counsellors, reports
|
|-- docs/                 Written documentation for the academic report
    |-- use-cases.md      10 use cases describing how the system is used
    |-- er-description.md  Explains each database collection and its fields
    |-- system-flow.md    Step-by-step flow of how requests travel through the system
    |-- ethics-and-privacy.md  How the system handles data responsibly
```

---

## The technology stack and why each was chosen

| Technology      | What it does                                      | Why it was chosen                                    |
|-----------------|---------------------------------------------------|------------------------------------------------------|
| React + Vite    | Builds the user interface in the browser          | Fast, widely used, component-based structure         |
| Tailwind CSS    | Styles the interface using utility classes        | Rapid styling, consistent design system              |
| Node.js + Express | Runs the backend API server                     | JavaScript on both sides, simple and well-documented |
| MongoDB         | Stores all data (users, counsellors, bookings)    | Flexible document format, easy to query              |
| JWT             | Keeps users logged in securely                    | Stateless, works well with REST APIs                 |
| bcrypt          | Hashes passwords before storing them              | Industry standard, protects against database leaks   |
| Zod             | Validates incoming data on the server             | Catches bad input before it reaches the database     |
| PDFKit          | Generates PDF reports on the server               | No paid service needed, runs entirely offline        |
| Recharts        | Draws charts in the admin dashboard               | Works natively with React, no extra setup            |

---

## Database collections explained simply

MongoDB stores data in "collections", which are like tables in a spreadsheet:

**users** - Every person with an account (clients, counsellors, admins).
Contains: name, email, hashed password, role, phone number.

**counsellors** - The professional profile for each counsellor.
Contains: their name, bio, specialisations, languages, fee, availability schedule,
average rating, number of completed sessions.

**intakes** - Every time a client fills in the matching form.
Contains: their concerns, language preference, budget, urgency, and a snapshot of
the AI results so they can be printed in a report later.

**appointments** - Every booked session.
Contains: which client, which counsellor, the date and time, the mode, and the status
(pending, confirmed, completed or cancelled).

**reviews** - Star ratings left by clients after completed sessions.
Contains: the rating (1 to 5), an optional comment, and links to the client and counsellor.

---

## How to customise this project

### Change the hospital name
Open `client/src/components/Navbar.jsx` and change "Baho" and "Counselling" to your hospital name.
Also update the title in `client/index.html`.

### Change the colours
All colours are defined as CSS variables in `client/src/index.css`.
Find `--pine: #1E5B47` and change it to any colour you want.
The same variable name is used everywhere so changing it once updates the whole site.

### Change the emergency phone numbers
Open `server/.env` and update:
```
HOSPITAL_PHONE=+250 000 000 000
EMERGENCY_PHONE=112
```
Restart the server. The crisis panel reads these values automatically.

### Add a real counsellor
Log in as admin and go to the Counsellors tab. Click "Add counsellor".
Fill in the two-step form: first create their login account, then fill in their profile.
They can then log in with those credentials and see their dashboard immediately.

### Change the AI weights
Open `server/utils/recommender.js` and find the `weights` object inside `computeContentScore`:
```javascript
const weights = {
  concerns: 0.30,
  language: 0.20,
  mode:     0.15,
  ...
};
```
Change the numbers to adjust how much each factor matters. They should always add up to 1.0.

To change the hybrid blend, find this line in the `recommend` function:
```javascript
final = 0.6 * content + 0.25 * collaborative + 0.15 * quality;
```
Adjust the three numbers. They should add up to 1.0.

---

## API endpoints (for developers)

All endpoints start with `/api`.

### Authentication
| Method | URL                     | Who can use it | What it does                  |
|--------|-------------------------|----------------|-------------------------------|
| POST   | /auth/register          | Anyone         | Create a new account          |
| POST   | /auth/login             | Anyone         | Log in, receive a JWT token   |
| GET    | /auth/me                | Logged in      | Get current user info         |
| POST   | /auth/forgot-password   | Anyone         | Request a password reset token|
| POST   | /auth/reset-password    | Anyone         | Set a new password            |

### Counsellors
| Method | URL                       | Who can use it      | What it does                  |
|--------|---------------------------|---------------------|-------------------------------|
| GET    | /counsellors              | Anyone              | List all counsellors          |
| GET    | /counsellors/:id          | Anyone              | Get one counsellor's profile  |
| POST   | /counsellors              | Admin only          | Create a counsellor profile   |
| PUT    | /counsellors/:id          | Admin or the counsellor | Update a profile          |
| DELETE | /counsellors/:id          | Admin only          | Remove a counsellor           |
| GET    | /counsellors/me/profile   | Counsellor only     | Get own profile               |

### AI Recommendations
| Method | URL                          | Who can use it | What it does                         |
|--------|------------------------------|----------------|--------------------------------------|
| POST   | /recommendations             | Client only    | Submit intake, get top 5 matches     |
| GET    | /recommendations/:intakeId   | Client, admin  | Get a saved intake and its results   |

### Appointments
| Method | URL                          | Who can use it       | What it does             |
|--------|------------------------------|----------------------|--------------------------|
| POST   | /appointments                | Client only          | Book a session           |
| GET    | /appointments/my             | Any logged-in user   | See own appointments     |
| GET    | /appointments/all            | Admin only           | See all appointments     |
| PUT    | /appointments/:id/status     | Counsellor or admin  | Confirm, complete, cancel|

### Reviews
| Method | URL                    | Who can use it | What it does              |
|--------|------------------------|----------------|---------------------------|
| POST   | /reviews               | Client only    | Leave a star rating       |
| GET    | /reviews/:counsellorId | Anyone         | See reviews for one person|

### Reports (download files)
| Method | URL                                 | Who can use it | What it does               |
|--------|-------------------------------------|----------------|----------------------------|
| GET    | /reports/admin?format=pdf           | Admin only     | Download admin PDF report  |
| GET    | /reports/admin?format=csv           | Admin only     | Download admin CSV export  |
| GET    | /reports/recommendation/:intakeId   | Client, admin  | Download my results as PDF |
| GET    | /reports/my-appointments?format=pdf | Any logged in  | Download schedule as PDF   |

---

## Common problems and how to fix them

**"Cannot reach MongoDB"**
MongoDB is not running. Start it using the instructions in the "Start MongoDB" section above.

**"Port 5000 already in use"**
Another process is using that port. On Windows, open Task Manager, find Node.js processes
and end them. Or change the port in `server/.env` by setting `PORT=5001`.

**"npm start is not recognised"**
You are not in the right folder. Make sure your terminal is in the `ai_based_counsellor`
folder, not inside `server/` or `client/`.

**The page shows a blank screen**
Open the browser console (F12) and look at the error. Most often it means the API server
on port 5000 is not running. Check the terminal output.

**"Invalid token" when trying to do things**
Your login session expired (tokens last 7 days). Log out and log in again.

---

## Optional extras

```bash
npm run seed       # Wipe the database and refill it with fresh sample data
npm run evaluate   # Print the AI accuracy report (Precision@K and Recall@K)
```

---

## Academic notes

This project was built as a case study for Baho Hospital, Kigali, Rwanda.
It demonstrates the following computer science concepts:

- **Hybrid recommender systems**: combining content-based and collaborative filtering
- **Cold start problem**: handling new users with no history
- **Cosine similarity**: measuring overlap between preference vectors
- **Normalisation**: scaling scores fairly across a dataset
- **RESTful API design**: stateless HTTP endpoints with JWT authentication
- **Role-based access control**: different permissions for client, counsellor and admin
- **Privacy by design**: consent gates, hashed passwords, access-restricted data
- **PDF generation**: server-side document creation with charts using PDFKit

For the full written documentation see the `/docs` folder:
- `use-cases.md` - 10 detailed use cases
- `er-description.md` - Database structure explained
- `system-flow.md` - How a request travels from browser to database and back
- `ethics-and-privacy.md` - Data protection, consent and safety design
