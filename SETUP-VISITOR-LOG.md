# Visitor log → Google Sheet

Every time someone enters their name (or returns), Jorata appends a row to a
Google Sheet you own, so you can see **who is using the site**. No database, no
service account — just a Google Sheet and a tiny script.

The app still works without this; logging simply no-ops until it's wired up.

---

## What you get

One clean, sortable row per entry:

| Timestamp | Event | Name | Visitor ID | Country | City | Region | Time Zone | Language | Page | Referrer | Device | IP |
|-----------|-------|------|------------|---------|------|--------|-----------|----------|------|----------|--------|----|

- **Event** — `joined` (first time they entered a name) or `visit` (returning, once per session).
- **Visitor ID** — a stable random id per device, so you can tell two "Alex"es apart.
- **Country / City / Region / IP** — filled in automatically on Vercel (blank in local dev).

---

## One-time setup (~5 minutes)

### 1. Create the sheet
Go to [sheets.new](https://sheets.new) and name it e.g. **Jorata Visitors**.
(Leave it empty — the script writes the header row for you.)

### 2. Add the script
In that sheet: **Extensions → Apps Script**. Delete the starter code, then paste
the contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs).

*(Recommended)* Set a secret near the top of the script:
```js
var SECRET = "pick-a-long-random-string";
```

Click the **Save** (disk) icon.

### 3. Deploy as a Web App
- **Deploy → New deployment**
- Click the gear ⚙ next to "Select type" → **Web app**
- **Execute as:** Me
- **Who has access:** **Anyone**
- **Deploy**, then **Authorize access** (pick your Google account → Advanced →
  "Go to … (unsafe)" → Allow — this is your own script).
- Copy the **Web app URL** (ends in `/exec`).

### 4. Add the env vars in Vercel
Project → **Settings → Environment Variables** (Production + Preview):

| Name | Value |
|------|-------|
| `GSHEET_WEBHOOK_URL` | the `/exec` URL from step 3 |
| `GSHEET_TOKEN` | the same string you put in `SECRET` (skip if you left `SECRET = ""`) |

**Redeploy** so the new env vars load.

For local testing, put the same two lines in `.env.local` and restart `next dev`.

---

## Verify

1. Open the site in a fresh/incognito window → enter a name → click **Continue**.
2. A new `joined` row appears in the sheet within a second or two.

Nothing showing up? Check **Vercel → Deployment → Runtime Logs** for
`[Jorata visitor]` warnings, and confirm the deployment URL ends in `/exec`.

> Changed the script later? Use **Deploy → Manage deployments → Edit → New
> version** so the live URL picks up your edit.
