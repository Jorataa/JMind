/**
 * JMind — Visitor Log (Google Apps Script Web App)
 * ------------------------------------------------------------------
 * Appends one row per visit to the bound Google Sheet. Deploy this as a Web App
 * and put its /exec URL into Vercel as GSHEET_WEBHOOK_URL. See SETUP-VISITOR-LOG.md.
 *
 * If you set a SECRET below, also set GSHEET_TOKEN to the same value in Vercel —
 * requests without a matching token are rejected (stops randoms spamming rows).
 * Leave SECRET = "" to disable the check.
 */

var SECRET = ""; // e.g. "a-long-random-string"; must equal GSHEET_TOKEN in Vercel.

// Column order written to the sheet. Edit freely — the header auto-syncs.
var HEADERS = [
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

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (SECRET && data.token !== SECRET) {
      return json_({ ok: false, error: "unauthorized" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // First write: lay down a bold, frozen header row so the sheet reads cleanly.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
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

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  return json_({ ok: true, service: "jmind-visitor-log" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
