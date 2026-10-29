# Use Cases: Baho Counselling System

## UC-01: Register as a client
**Actor**: Prospective patient  
**Trigger**: User opens the app and clicks "Get started"  
**Steps**: Fill in name, email, phone, password. Submit. System creates a client account and logs user in.  
**Outcome**: Client is redirected to the intake form.

## UC-02: Complete intake and receive recommendations
**Actor**: Client  
**Precondition**: Logged in as client  
**Steps**: Give consent. Answer up to 8 intake questions (concerns, language, mode, urgency, days, budget, gender preference). Submit.  
**Outcome**: System saves the intake, runs the hybrid recommender, returns top 5 counsellors with match percent, reason and score breakdown.

## UC-03: View crisis support panel
**Actor**: Client  
**Trigger**: Client selects "I am in crisis" or a concern containing crisis keywords  
**Outcome**: A prominent support panel appears BEFORE any results, showing the hospital phone number and emergency services number with advice to seek immediate help.

## UC-04: Book a session
**Actor**: Client  
**Precondition**: Viewing a counsellor profile or recommendation result  
**Steps**: Click "Book session". Choose a day, time slot, mode and date. Confirm.  
**Outcome**: Appointment created with status "pending".

## UC-05: Confirm or complete a session
**Actor**: Counsellor or admin  
**Steps**: Open the appointments list. Update status to "confirmed" or "completed".  
**Outcome**: Status updated. Counsellor session count increments on completion.

## UC-06: Leave a review
**Actor**: Client  
**Precondition**: Appointment status is "completed"  
**Steps**: Click "Leave review" on the appointment. Select star rating, write optional comment.  
**Outcome**: Review saved. Counsellor average rating recalculated.

## UC-07: Download recommendation report (client)
**Actor**: Client  
**Steps**: On the results page, click "Download".  
**Outcome**: A PDF containing matched counsellors, reasons and past appointments is downloaded.

## UC-08: Download admin report
**Actor**: Admin  
**Steps**: Go to Admin dashboard, Reports tab. Choose date range and format. Click "Download report".  
**Outcome**: PDF or CSV with headline stats, charts and appointment table is downloaded.

## UC-09: Manage counsellor availability
**Actor**: Counsellor  
**Steps**: Open counsellor dashboard. Click "Edit" next to Availability. Toggle days and time slots.  
**Outcome**: Availability updated in the database. Recommendations reflect the new schedule.

## UC-10: Manage counsellors (admin)
**Actor**: Admin  
**Steps**: Go to Admin dashboard, Counsellors tab. View list. Delete a counsellor.  
**Outcome**: Counsellor record removed. No new bookings can be made for that profile.
