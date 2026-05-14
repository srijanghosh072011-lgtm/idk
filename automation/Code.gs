/**
 * Ghosh Designs — Email Automation System
 * Author: Srijan Ghosh
 *
 * Runs daily. Reads prospects from the "Leads" sheet, checks status + dates,
 * and sends the right follow-up email automatically. Pauses sequences when
 * a prospect replies.
 */

// ============ CONFIG ============
const YOUR_NAME = 'Srijan Ghosh';
const BUSINESS_NAME = 'Ghosh Designs';
const YOUR_EMAIL = 'srijan.ghosh072011@gmail.com';
const CALENDLY_LINK = 'https://calendly.com/your-calendly-link';

const SHEET_NAME = 'Leads';

// Column indexes (1-based, matches the sheet)
const COL = {
  COMPANY: 1,
  CONTACT_NAME: 2,
  EMAIL: 3,
  PHONE: 4,
  STATUS: 5,
  DATE_CONTACTED: 6,
  DATE_PROPOSAL_SENT: 7,
  DATE_DELIVERED: 8,
  LAST_EMAIL_SENT: 9,
  EMAILS_SENT_LOG: 10,
  NOTES: 11
};

// Status values used in the sheet
const STATUS = {
  CONTACTED: 'Contacted',
  REPLIED: 'Replied',
  PROPOSAL_SENT: 'Proposal Sent',
  CLOSED: 'Closed',
  DELIVERED: 'Delivered',
  DEAD: 'Dead'
};

// ============ MAIN ENTRY POINT ============
/**
 * Run this daily via a time-based trigger.
 */
function runDailyAutomation() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log('Sheet "' + SHEET_NAME + '" not found.');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const today = new Date();

  for (let i = 0; i < data.length; i++) {
    const row = i + 2;
    const lead = parseLead(data[i]);

    if (!lead.email) continue;
    if (lead.status === STATUS.DEAD) continue;

    // Auto-pause if prospect has replied (check Gmail)
    if (hasReplied(lead.email)) {
      if (lead.status !== STATUS.REPLIED && lead.status !== STATUS.PROPOSAL_SENT &&
          lead.status !== STATUS.CLOSED && lead.status !== STATUS.DELIVERED) {
        sheet.getRange(row, COL.STATUS).setValue(STATUS.REPLIED);
        notifyMe('Reply received from ' + lead.company,
                 lead.contactName + ' at ' + lead.company + ' (' + lead.email + ') replied. ' +
                 'All sequences paused. Check your inbox.');
      }
      continue;
    }

    // Route to the right sequence based on status
    if (lead.status === STATUS.CONTACTED) {
      handleColdFollowup(sheet, row, lead, today);
    } else if (lead.status === STATUS.PROPOSAL_SENT) {
      handleProposalFollowup(sheet, row, lead, today);
    } else if (lead.status === STATUS.DELIVERED) {
      handleDeliveredSequence(sheet, row, lead, today);
    }
  }
}

// ============ PARSING ============
function parseLead(rowData) {
  return {
    company: rowData[COL.COMPANY - 1],
    contactName: rowData[COL.CONTACT_NAME - 1],
    email: rowData[COL.EMAIL - 1],
    phone: rowData[COL.PHONE - 1],
    status: rowData[COL.STATUS - 1],
    dateContacted: rowData[COL.DATE_CONTACTED - 1],
    dateProposalSent: rowData[COL.DATE_PROPOSAL_SENT - 1],
    dateDelivered: rowData[COL.DATE_DELIVERED - 1],
    emailsSentLog: rowData[COL.EMAILS_SENT_LOG - 1] || ''
  };
}

function daysSince(date, today) {
  if (!date || !(date instanceof Date)) return -1;
  const ms = today.getTime() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function hasSent(log, tag) {
  return log && log.toString().indexOf(tag) !== -1;
}

function markSent(sheet, row, currentLog, tag) {
  const newLog = currentLog ? currentLog + '; ' + tag : tag;
  sheet.getRange(row, COL.EMAILS_SENT_LOG).setValue(newLog);
  sheet.getRange(row, COL.LAST_EMAIL_SENT).setValue(new Date());
}

// ============ SEQUENCES ============
function handleColdFollowup(sheet, row, lead, today) {
  const days = daysSince(lead.dateContacted, today);
  if (days < 0) return;

  if (days >= 3 && !hasSent(lead.emailsSentLog, 'cold-day3')) {
    sendEmail(lead.email, coldDay3Subject(lead), coldDay3Body(lead));
    markSent(sheet, row, lead.emailsSentLog, 'cold-day3');
  } else if (days >= 7 && !hasSent(lead.emailsSentLog, 'cold-day7')) {
    sendEmail(lead.email, coldDay7Subject(lead), coldDay7Body(lead));
    markSent(sheet, row, lead.emailsSentLog, 'cold-day7');
  } else if (days >= 14 && !hasSent(lead.emailsSentLog, 'cold-dead')) {
    sheet.getRange(row, COL.STATUS).setValue(STATUS.DEAD);
    markSent(sheet, row, lead.emailsSentLog, 'cold-dead');
  }
}

function handleProposalFollowup(sheet, row, lead, today) {
  const days = daysSince(lead.dateProposalSent, today);
  if (days < 0) return;

  if (days >= 2 && !hasSent(lead.emailsSentLog, 'prop-day2')) {
    sendEmail(lead.email, propDay2Subject(lead), propDay2Body(lead));
    markSent(sheet, row, lead.emailsSentLog, 'prop-day2');
  } else if (days >= 5 && !hasSent(lead.emailsSentLog, 'prop-day5')) {
    sendEmail(lead.email, propDay5Subject(lead), propDay5Body(lead));
    markSent(sheet, row, lead.emailsSentLog, 'prop-day5');
  } else if (days >= 10 && !hasSent(lead.emailsSentLog, 'prop-day10')) {
    notifyMe('Proposal ghost: ' + lead.company,
             'No reply 10 days after proposal sent. Follow up manually.');
    markSent(sheet, row, lead.emailsSentLog, 'prop-day10');
  }
}

function handleDeliveredSequence(sheet, row, lead, today) {
  const days = daysSince(lead.dateDelivered, today);
  if (days < 0) return;

  if (days >= 3 && !hasSent(lead.emailsSentLog, 'testimonial')) {
    sendEmail(lead.email, testimonialSubject(lead), testimonialBody(lead));
    markSent(sheet, row, lead.emailsSentLog, 'testimonial');
  }
  if (days >= 14 && !hasSent(lead.emailsSentLog, 'referral')) {
    sendEmail(lead.email, referralSubject(lead), referralBody(lead));
    markSent(sheet, row, lead.emailsSentLog, 'referral');
  }
  if (days >= 90 && !hasSent(lead.emailsSentLog, 'checkin90')) {
    sendEmail(lead.email, checkin90Subject(lead), checkin90Body(lead));
    markSent(sheet, row, lead.emailsSentLog, 'checkin90');
  }
}

// ============ EMAIL TEMPLATES ============
function signature() {
  return '\n\nBest,\n' + YOUR_NAME + '\n' + BUSINESS_NAME;
}

function firstName(contactName) {
  if (!contactName) return 'there';
  return contactName.toString().split(' ')[0];
}

// --- Cold follow-ups ---
function coldDay3Subject(lead) {
  return 'Quick follow-up — ' + lead.company;
}
function coldDay3Body(lead) {
  return 'Hey ' + firstName(lead.contactName) + ',\n\n' +
    'Just bumping this up in case it got buried. Would love to connect for 15 minutes ' +
    'if timing works — here\'s my calendar: ' + CALENDLY_LINK + signature();
}

function coldDay7Subject(lead) {
  return 'Last follow-up — ' + lead.company;
}
function coldDay7Body(lead) {
  return 'Hey ' + firstName(lead.contactName) + ',\n\n' +
    'I know you\'re busy — last follow-up from me. If you ever want to talk about ' +
    'your website, I\'m here.' + signature();
}

// --- Proposal follow-ups ---
function propDay2Subject(lead) {
  return 'Did the proposal come through?';
}
function propDay2Body(lead) {
  return 'Hey ' + firstName(lead.contactName) + ',\n\n' +
    'Just wanted to make sure the proposal came through okay. Happy to hop on a quick ' +
    'call to walk through it together if that\'s easier — here\'s my calendar: ' +
    CALENDLY_LINK + signature();
}

function propDay5Subject(lead) {
  return 'Any questions on the proposal?';
}
function propDay5Body(lead) {
  return 'Hey ' + firstName(lead.contactName) + ',\n\n' +
    'Checking in — any questions on the proposal I sent? I\'d rather answer them now ' +
    'so you\'re not left wondering. Let me know what works.' + signature();
}

// --- Testimonial ---
function testimonialSubject(lead) {
  return 'Quick favor — ' + lead.company + ' site';
}
function testimonialBody(lead) {
  return 'Hey ' + firstName(lead.contactName) + ',\n\n' +
    'Really glad we got the site live! Would you be willing to write a quick 2–3 ' +
    'sentence review of your experience working with me? You can just reply to this ' +
    'email and I\'ll take care of the rest.' + signature();
}

// --- Referral ---
function referralSubject(lead) {
  return 'How\'s the new site?';
}
function referralBody(lead) {
  return 'Hey ' + firstName(lead.contactName) + ',\n\n' +
    'Hope the new site is already bringing in some attention! Quick ask — if you know ' +
    'any other business owners who could use something like this, I\'d love an intro. ' +
    'Even just a quick text saying "I know someone good" is all it takes.' + signature();
}

// --- 90-day check-in ---
function checkin90Subject(lead) {
  return 'Checking in — ' + lead.company;
}
function checkin90Body(lead) {
  return 'Hey ' + firstName(lead.contactName) + ',\n\n' +
    'Just wanted to check in — how\'s the website performing? Anything you want to ' +
    'update or improve? I\'m always here if you need anything.' + signature();
}

// ============ GMAIL / SENDING ============
function sendEmail(to, subject, body) {
  GmailApp.sendEmail(to, subject, body, {
    name: YOUR_NAME,
    from: YOUR_EMAIL
  });
}

function hasReplied(email) {
  if (!email) return false;
  const threads = GmailApp.search('from:' + email + ' newer_than:60d', 0, 5);
  return threads.length > 0;
}

function notifyMe(subject, body) {
  GmailApp.sendEmail(YOUR_EMAIL, '[Automation] ' + subject, body);
}

// ============ ONE-TIME SETUP HELPERS ============
/**
 * Run once to create the daily trigger.
 */
function installDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runDailyAutomation') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('runDailyAutomation')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  Logger.log('Daily trigger installed. Will run every day at 9am.');
}

/**
 * Run once to set up the sheet headers.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  const headers = [
    'Company', 'Contact Name', 'Email', 'Phone', 'Status',
    'Date Contacted', 'Date Proposal Sent', 'Date Delivered',
    'Last Email Sent', 'Emails Sent Log', 'Notes'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  Logger.log('Sheet ready. Add your prospects below row 1.');
}
