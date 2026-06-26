/**
 * Jorata — Visitor Log (Google Apps Script Web App)
 * ------------------------------------------------------------------
 * Appends one row per visit to the bound Google Sheet. Deploy this as a Web App
 * and put its /exec URL into Vercel as GSHEET_WEBHOOK_URL. See SETUP-VISITOR-LOG.md.
 *
 * SECURITY: Set SECRET to a long random string (e.g. from
 * https://generate.plus/en/base64?len=32) AND set GSHEET_TOKEN to the same
 * value in Vercel's Environment Variables. Requests without a matching token
 * are rejected, preventing anyone who discovers the /exec URL from spamming
 * your sheet. Leaving SECRET empty disables this check — NOT recommended.
 */

var SECRET = ""; // REQUIRED: set to a long random string; match GSHEET_TOKEN in Vercel.

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

/**
 * Prefix any value that starts with =, +, -, or @ with a single quote so
 * Google Sheets treats it as plain text rather than a formula. This prevents
 * formula-injection attacks via crafted visitor names, referrers, etc.
 */
function sanitizeCell_(value) {
  var s = String(value || "");
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (SECRET && data.token !== SECRET) {
      // Do not reveal the expected token or any details.
      return json_({ ok: false, error: "unauthorized" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // First write: lay down a bold, frozen header row so the sheet reads cleanly.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Sanitize every user-supplied field against formula injection before
    // writing. A value like =IMPORTXML(...) would otherwise execute as a
    // spreadsheet formula when the sheet owner opens the file.
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      sanitizeCell_(data.event),
      sanitizeCell_(data.name),
      sanitizeCell_(data.visitorId),
      sanitizeCell_(data.country),
      sanitizeCell_(data.city),
      sanitizeCell_(data.region),
      sanitizeCell_(data.timeZone),
      sanitizeCell_(data.language),
      sanitizeCell_(data.path),
      sanitizeCell_(data.referrer),
      sanitizeCell_(data.userAgent),
      sanitizeCell_(data.ip),
    ]);

    return json_({ ok: true });
  } catch (err) {
    // Don't echo back the raw error — it could reveal sheet structure.
    return json_({ ok: false, error: "internal error" });
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
