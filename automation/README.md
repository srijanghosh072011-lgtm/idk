# Ghosh Designs — Email Automation

Hands-off email follow-up system. Runs daily inside Google Sheets + Apps Script. Sends cold follow-ups, post-proposal nudges, testimonial requests, referral asks, and 90-day check-ins automatically. Pauses any sequence the moment a prospect replies.

Cost: **$0 forever.** Runs on Google's servers, not your laptop.

---

## What's in this folder

- `Code.gs` — the Apps Script that runs everything
- `templates/email-templates.md` — readable copies of every email it sends

---

## Setup (one time, ~20 minutes)

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) (logged in as `srijan.ghosh072011@gmail.com`)
2. Click **+ Blank**
3. Rename the file to **Ghosh Designs — Leads**

### Step 2 — Add the Apps Script

1. In the sheet, click **Extensions → Apps Script**
2. Delete the default `function myFunction() {}` placeholder
3. Open `Code.gs` from this folder, copy ALL of it, paste into the Apps Script editor
4. Click the **Save** icon (or `Ctrl/Cmd + S`)
5. Name the project **Ghosh Designs Automation**

### Step 3 — Set up the sheet structure

1. Back in Apps Script, in the function dropdown at the top, select **`setupSheet`**
2. Click **Run**
3. First time only: Google asks for permission — click **Review permissions → choose your Gmail → Advanced → Go to Ghosh Designs Automation (unsafe) → Allow**. ("Unsafe" just means it's your own script, not from the store.)
4. Go back to your Sheet — you'll see a new tab called **Leads** with all the right columns

### Step 4 — Install the daily trigger

1. In Apps Script, in the function dropdown, select **`installDailyTrigger`**
2. Click **Run**
3. Done. The script will now run automatically every day at 9am.

### Step 5 — Test it

1. In the **Leads** tab, add yourself as a test row:
   - Company: `Test Co`
   - Contact Name: `Srijan Ghosh`
   - Email: `srijan.ghosh072011@gmail.com`
   - Status: `Contacted`
   - Date Contacted: a date 3 days ago
2. In Apps Script, run **`runDailyAutomation`**
3. Check your inbox — you should see the Day 3 follow-up email
4. Delete the test row when done

---

## How to use it day-to-day

### When you send a first cold email
Add a row in the **Leads** tab:
- Fill in Company, Contact Name, Email, Phone
- Set **Status** to `Contacted`
- Set **Date Contacted** to today

The automation handles Day 3 and Day 7 follow-ups automatically. If they don't reply by Day 14, the row is marked `Dead`.

### When you send a proposal
Update the same row:
- Change **Status** to `Proposal Sent`
- Set **Date Proposal Sent** to today

Day 2 and Day 5 follow-ups go out automatically. Day 10 you get a notification email so you can follow up by hand.

### When you close a deal
Change **Status** to `Closed`. No more emails go out automatically — you handle delivery comms manually.

### When you deliver the site
- Change **Status** to `Delivered`
- Set **Date Delivered** to today

The system sends:
- **Day 3:** testimonial request
- **Day 14:** referral ask
- **Day 90:** check-in

### When a prospect replies
You don't need to do anything. The script checks Gmail every morning. If it sees any reply from that email address in the last 60 days, it marks the row `Replied` and emails you a notification. All sequences for that contact pause immediately.

---

## Sheet columns

| Column | What goes in it |
|---|---|
| Company | Business name (e.g., "Regina Plumbing Co") |
| Contact Name | Owner's full name |
| Email | Their email |
| Phone | Their phone |
| Status | `Contacted` / `Replied` / `Proposal Sent` / `Closed` / `Delivered` / `Dead` |
| Date Contacted | When you sent the first cold email |
| Date Proposal Sent | When you sent the proposal |
| Date Delivered | When the site went live |
| Last Email Sent | Auto-filled by the script |
| Emails Sent Log | Auto-filled (e.g., `cold-day3; cold-day7`) — don't touch |
| Notes | Anything you want to remember |

---

## Status values (use these exactly)

- `Contacted` — first email sent
- `Replied` — they wrote back (auto-set by script)
- `Proposal Sent` — proposal is out
- `Closed` — they signed, work in progress
- `Delivered` — site is live
- `Dead` — gave up, moved on

---

## Customizing

Open `Code.gs` and edit the **CONFIG** block at the top:

```javascript
const YOUR_NAME = 'Srijan Ghosh';
const BUSINESS_NAME = 'Ghosh Designs';
const YOUR_EMAIL = 'srijan.ghosh072011@gmail.com';
const CALENDLY_LINK = 'https://calendly.com/your-calendly-link';
```

Update `CALENDLY_LINK` once you've set up Calendly. Email copy lives in the `EMAIL TEMPLATES` section further down.

---

## If something breaks

- **Emails aren't sending:** in Apps Script, click **Executions** on the left. Check for errors.
- **Daily run not happening:** in Apps Script, click **Triggers** on the left. You should see `runDailyAutomation` running daily. If not, run `installDailyTrigger` again.
- **Wrong email going out:** double-check the **Status** column in the sheet — that's what controls which sequence runs.

---

## Gmail sending limits

Free Gmail sends up to 500 emails/day. You'll never hit this. (If you ever do, that's a great problem.)
