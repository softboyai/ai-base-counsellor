# Baho Counselling

AI-Based Counsellor Recommendation System for Baho Hospital, Kigali, Rwanda.
Academic project. Case study: Baho Hospital.

---

## Quick start (one command)

**Prerequisites**: Node.js 18 or later, MongoDB running locally.

```bash
npm run dev
```

That is the only command needed after unzipping. It will:
1. Initialize the monorepo connection manager tool layers
2. Check that MongoDB is reachable and print a clear connection state profile
3. Simultaneously start the Express API backend server (port 5000) and the Vite React development server (port 5173) in a unified terminal layout log window
4. Automatically open your system default web browser directly to `http://localhost:5173/`

Press `Ctrl + C` to stop both system server layers instantly.

---

## Installing on another computer

1. Install [Node.js 18+](https://nodejs.org) and [MongoDB Community Edition](https://mongodb.com)
2. Start MongoDB service configuration tool (see below)
3. Unzip or clone the main project files
4. Open a terminal in the project root main folder
5. Execute the build and run system:
   ```bash
   npm run dev
   ```

### Starting MongoDB

- **Windows**: Open Services (`Win + R`, type `services.msc`), locate "MongoDB Server", and click start. Or run `mongod` in a terminal window.
- **macOS**: `brew services start mongodb/brew/mongodb-community`
- **Linux**: `sudo systemctl start mongod`

---

## Optional commands

Run these scripts from your root system terminal stack directory:

```bash
npm run server     # Run only the Express backend development server
npm run client     # Run only the Vite React client frontend application
npm run seed       # Reseed the database with 12 counsellors and custom client profiles (clears active data)
npm run evaluate   # Print Precision@K and Recall@K statistics metrics for the hybrid recommender system engine
```

---

## 👥 Demo Logins & Account Directory

The password baseline for **all** standard system accounts listed below is **`Counsellor@1234`** (Admin account defaults to **`Admin@1234`**).

| Full Name | Account Email / Login | Role | Password |
| :--- | :--- | :--- | :--- |
| **Dr. Amina Uwase** | `admin@baho.rw` | admin | `Admin@1234` |
| **Divine Mutoni** | `divine.mutoni@gmail.com` | client | `Client@1234` |
| **Eric Kamanzi** | `kamanzi.eric@yahoo.com` | client | `Client@1234` |
| **Fiona Umutoniwase** | `fiona.umuto@outlook.com` | client | `Client@1234` |
| **Jean Pierre Habimana** | `jean.pierre@baho.rw` | counsellor | `Counsellor@1234` |
| **Dr. Solange Niyonkuru** | `solange.n@baho.rw` | counsellor | `Counsellor@1234` |
| **Emmanuel Rwigamba** | `emmanuel.r@baho.rw` | counsellor | `Counsellor@1234` |
| **Chantal Mukamusoni** | `chantal.m@baho.rw` | counsellor | `Counsellor@1234` |
| **Dr. Patrick Uwimana** | `patrick.u@baho.rw` | counsellor | `Counsellor@1234` |
| **Ange Uwineza** | `ange.u@baho.rw` | counsellor | `Counsellor@1234` |
| **Pierre Hakizimana** | `pierre.h@baho.rw` | counsellor | `Counsellor@1234` |
| **Diane Ishimwe** | `diane.i@baho.rw` | counsellor | `Counsellor@1234` |
| **Fabrice Niyonzima** | `fabrice.n@baho.rw` | counsellor | `Counsellor@1234` |
| **Vestine Uwamahoro** | `vestine.u@baho.rw` | counsellor | `Counsellor@1234` |
| **Albert Rutaganda** | `albert.r@baho.rw` | counsellor | `Counsellor@1234` |
| **Annette Mukagatare** | `annette.m@baho.rw` | counsellor | `Counsellor@1234` |

---

## Customisation

### Change the hospital name or branding
- Open `client/src/components/Navbar.jsx` and update the "Baho" and "Counselling" branding assets.
- Update `client/index.html` to modify the global page title structure.
- Landing layout copy can be found inside `client/src/pages/Landing.jsx`.

### Change colours and fonts
- Global style tokens are defined inside **`client/src/index.css`** using custom properties selectors.
- Typography configurations utilize professional **Satoshi** font structures on core layout paths with a clean milky-white base to enhance system readability and accessibility.

---

## Project structure

baho-counselling/ 
package.json Root monorepo configuration (concurrently runner setup) 
server/ 
index.js Express app entry point 
db.js MongoDB configuration mappings 
routes/ 
auth.js Authentication layer endpoints (JWT login, register, profile) 
counselors.js Counsellor profile system actions 
recommendations.js Intake recommendation processing script 
appointments.js Appointment book system tracking 
reviews.js Feedback submission paths 
scripts/ 
seed.js Advanced automation database seeder (12 advisors, synced accounts) 
evaluate.js Hybrid recommendation calculation verification metrics 
client/ 
index.html Client web shell 
vite.config.js Vite configurations with active proxy routing definitions 
tailwind.config.js Tailwind processor styles 
src/ 
main.jsx React initialization root setup 
index.css Typography profiles, custom properties variables layers 
App.jsx Global wrapper component structure 
components/ Shared UI objects (Buttons, Navbars, Cards) 
pages/ Platform layouts (Dashboards, Client Intakes, Directories) 
docs/ Project operational requirement summaries

---

## API reference

All backend development endpoints are prefixed with `/api`.

### Auth

| Method | Path             | Body                               | Auth    | Description          |
|--------|------------------|-------------------------------------|---------|----------------------|
| POST   | /auth/register   | name, email, phone, password, role | None    | Create account       |
| POST   | /auth/login      | email, password                    | None    | Return JWT           |
| GET    | /auth/me         | -                                  | Bearer  | Current user profile |

### Counsellors

| Method | Path                  | Auth           | Description              |
|--------|-----------------------|----------------|--------------------------|
| GET    | /counsellors          | None           | List (filterable)        |
| GET    | /counsellors/:id      | None           | Single counsellor        |
| POST   | /counsellors          | Admin          | Create                   |
| PUT    | /counsellors/:id      | Admin or owner | Update                   |
| DELETE | /counsellors/:id      | Admin          | Delete                   |
| GET    | /counsellors/me/profile | Counsellor   | Own profile              |

### Recommendations

| Method | Path                       | Auth   | Description                    |
|--------|----------------------------|--------|--------------------------------|
| POST   | /recommendations           | Client | Submit intake, get top 5       |
| GET    | /recommendations/:intakeId | Client or admin | Get saved intake and snapshot |

### Appointments

| Method | Path                        | Auth                   | Description         |
|--------|-----------------------------|------------------------|---------------------|
| POST   | /appointments               | Client                 | Book an appoint