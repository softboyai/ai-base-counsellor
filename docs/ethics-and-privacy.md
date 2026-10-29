# Ethics and Privacy: Baho Counselling

## Ethical principles

### No diagnosis, no clinical advice
Baho Counselling is a matching system. It compares a client's stated preferences with counsellor profiles. It does not assess mental health conditions, recommend medications or provide clinical treatment plans. Every results page, every PDF report and every intake form carries a plain-language disclaimer to this effect.

### Informed consent
Before the intake form begins, the client is shown a plain description of what will happen with their data. They must tick a checkbox explicitly consenting to the processing of their intake responses. No intake is processed without `consentGiven: true`. Consent is recorded in the `intakes` collection.

### Crisis safety
If the intake contains any of the following signals, the system shows a dedicated crisis support panel BEFORE any counsellor recommendation:
- The concern "I am in crisis" is selected
- The text contains keywords such as "suicidal", "self-harm", "end my life", "want to die" or similar

The panel shows the Baho Hospital phone number and the national emergency number, with calm, plain-language advice to seek immediate help. A counsellor recommendation is not shown until the client explicitly confirms they are safe and wish to continue.

### Transparency of algorithmic decision-making
The recommendation engine explains each result. Every counsellor card shows:
- A percentage match score
- A plain-language reason (e.g. "Works with anxiety, speaks Kinyarwanda, available Monday")
- A three-part score breakdown (content, collaborative, quality)

This design ensures clients can evaluate and question the system's output rather than trusting it blindly.

### Fairness and non-discrimination
The recommender weights concern matching, language, session mode, fee and availability. It does not weight by gender unless the client explicitly states a preference. No protected characteristics (ethnicity, religion, disability status) are collected or used in scoring.

## Privacy design

### Data minimisation
Intake forms collect only what is needed for matching: concerns, language preference, gender preference, session mode, urgency, budget and preferred days. No medical history, no diagnostic labels, no detailed symptom descriptions are collected.

### Access control
- Intake data is visible only to: the client who submitted it, their booked counsellor and administrators.
- Counsellors see only the clients who have booked them. They cannot browse other clients' intakes.
- Passwords are hashed with bcrypt (cost factor 12). Password hashes are never returned by the API.
- JWTs expire after 7 days.

### No logging of intake content
The server never logs intake field values. `console.error` and `console.log` calls in the server do not echo intake data.

### Data retention
The seed script and application do not implement automatic deletion. For a production deployment, a data retention policy should be configured in MongoDB (e.g. TTL indexes on `intakes` after a defined period) in line with Rwandan data protection law and hospital policy.

## Regulatory context
Rwanda enacted the Law No 058/2021 on the Protection of Personal Data and Privacy. Any deployment of this system at a real hospital must:
- Register with the Rwanda Utilities Regulatory Authority (RURA) if required
- Appoint a data protection officer
- Maintain a record of processing activities
- Implement a data breach notification procedure

This system is an academic prototype. It demonstrates the technical implementation of privacy-by-design principles. A production deployment would require a full legal and compliance review.
