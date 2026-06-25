/**
 * Jorata — Visitor Log + AI Feedback (Google Apps Script Web App)
 * ------------------------------------------------------------------
 * Routes incoming rows to one of two sheet tabs:
 *   • "Visitors"    — join/visit events from the name gate
 *   • "AI Feedback" — thumbs-up / thumbs-down on AI replies
 *
 * Deploy as a Web App (Execute as: Me, Who has access: Anyone) and put
 * its /exec URL into Vercel as GSHEET_WEBHOOK_URL. See SETUP-VISITOR-LOG.md.
 *
 * If you set a SECRET below, also set GSHEET_TOKEN in Vercel — requests
 * without a matching token are rejected. Leave SECRET = "" to disable.
 */

var SECRET = ""; // e.g. "a-long-random-string"; must equal GSHEET_TOKEN in Vercel.

var VISITOR_HEADERS = [
  "Timestamp",
  "Event",
  "Name",
  "Visitor ID",
  "Country",
  "City",
  "Region",
  "Time Zone",
  "Language",
  "Page",
  "Referrer",
  "Device",
  "IP",
];

var FEEDBACK_HEADERS = [
  "Timestamp",
  "Rating",
  "Question",
  "Reply",
  "Visitor ID",
  "Country",
  "Device",
  "IP",
];

/** Returns the named sheet, creating it with a bold frozen header if missing. */
function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (SECRET && data.token !== SECRET) {
      return json_({ ok: false, error: "unauthorized" });
    }

    if (data.type === "ai_feedback") {
      var fbSheet = getOrCreateSheet("AI Feedback", FEEDBACK_HEADERS);
      fbSheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.rating || "",
        data.question || "",
        data.reply || "",
        data.visitorId || "",
        data.country || "",
        data.userAgent || "",
        data.ip || "",
      ]);
    } else {
      var visitorSheet = getOrCreateSheet("Visitors", VISITOR_HEADERS);
      visitorSheet.appendRow([
        data.timestamp || new Date().toISOString(),
        data.event || "",
        data.name || "",
        data.visitorId || "",
        data.country || "",
        data.city || "",
        data.region || "",
        data.timeZone || "",
        data.language || "",
        data.path || "",
        data.referrer || "",
        data.userAgent || "",
        data.ip || "",
      ]);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  return json_({ ok: true, service: "jorata-visitor-log" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
