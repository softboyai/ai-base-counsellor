# System Flow: Baho Counselling

## High-level architecture

```
Browser (React / Vite)
        |
        | HTTP / REST JSON
        v
Express API (Node.js, port 5000)
        |
        | mongodb driver
        v
MongoDB (baho_counselling database)
```

The Vite dev server proxies all `/api/*` requests to the Express server, so the browser never needs a separate origin. In production, a reverse proxy (Nginx) would serve the built React bundle and forward API requests.

## Request flow: intake and recommendation

1. Client fills in the intake form (4 to 8 steps, one question per screen).
2. On submit, the browser sends `POST /api/recommendations` with the intake object and JWT.
3. The server validates the payload with Zod and checks consent.
4. The intake is saved to the `intakes` collection.
5. `recommender.js` runs three scoring functions in parallel:
   - **Content score**: weighted field-by-field comparison of intake vs each counsellor.
   - **Collaborative score**: item-based cosine similarity from the ratings matrix.
   - **Quality score**: normalised avgRating multiplied by log(sessionsCount + 1) plus experience bonus.
6. Scores are combined: `0.6 * content + 0.25 * collaborative + 0.15 * quality`. Cold-start clients (no collaborative signal) use `0.75 * content + 0.25 * quality`.
7. Results are sorted, the top 5 are returned with matchPercent, reason and breakdown.
8. The snapshot is written back to the intake record for report reconstruction.
9. The browser navigates to the results page. If the intake contains crisis keywords, the crisis panel is shown first.

## Request flow: booking

1. Client clicks "Book session" on a result card.
2. Browser sends `POST /api/appointments`.
3. Server verifies the counsellor exists, saves the appointment with status "pending".
4. Counsellor logs in, sees the pending appointment, updates status to "confirmed".
5. After the session, counsellor (or admin) sets status to "completed". sessionsCount increments.
6. Client can now leave a review.

## Request flow: report download

1. Browser calls the report endpoint with the Bearer token (e.g. `GET /api/reports/admin?format=pdf`).
2. Server authenticates, authorises by role, queries the database.
3. PDFKit streams the PDF directly into the HTTP response.
4. The browser receives a blob, the JS creates a temporary anchor tag and triggers a download.

## Authentication flow

1. Register or login returns a JWT (7-day expiry).
2. JWT is stored in localStorage.
3. Every API request includes `Authorization: Bearer <token>`.
4. The `requireAuth` middleware verifies the token and attaches the payload to `req.user`.
5. `requireRole()` checks `req.user.role` against allowed roles.
