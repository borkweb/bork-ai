---
name: setup-browser-cookies
description: Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless browser session. Use before QA testing authenticated pages. Use when asked to "import cookies", "login to the site", or "authenticate the browser".
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# Setup Browser Cookies

Import logged-in sessions from your real Chromium browser into the headless browser session. This lets you test authenticated pages without logging in through the headless browser every time.

## How it works

1. Detect installed Chromium browsers on the system
2. Extract cookies for the requested domains (requires macOS Keychain access for decryption)
3. Load the cookies into the Playwright session
4. Verify the import worked

## Steps

### 1. Check for browser cookie access

The user needs a way to extract cookies from their browser. Common approaches:

**Option A: Export cookies manually**
The user can export cookies from their browser using a browser extension (like "EditThisCookie" or "Cookie-Editor") and save them as a JSON file. Then import:

```bash
# If using Playwright MCP, use browser_evaluate to set cookies
# Or use a cookie JSON file with the browser tool
```

**Option B: Use a cookie extraction tool**
On macOS, Chromium browser cookies are stored in SQLite databases and encrypted with the Keychain. Tools like `cookie-import-browser` can decrypt and extract them.

### 2. Ask the user what to import

Use AskUserQuestion:

"Which site(s) do you need to authenticate with? I'll help you get cookies imported into the headless browser session."

- A) I'll provide a cookies JSON file
- B) Import from my browser for specific domain(s) — tell me which
- C) I'll log in manually through the headless browser

### 3. Import cookies

**If the user provides a JSON file:**

The cookie JSON should be an array of objects with `name`, `value`, `domain`, `path` fields. Use the browser's cookie-setting capability to load them.

**If the user wants to log in manually:**

Navigate to the login page and let the user interact:
1. Navigate to the login URL
2. Take a snapshot so the user can see the form
3. Ask the user for credentials (or let them type directly)
4. Fill and submit the form
5. Verify login succeeded

### 4. Verify

After importing, navigate to an authenticated page and verify access:

1. Navigate to a page that requires auth
2. Take a screenshot
3. Confirm the page loads authenticated content (not a login redirect)

Tell the user: "Cookies imported. Session is ready for authenticated testing."

## Notes

- On macOS, browser cookie extraction may trigger a Keychain dialog — click "Allow" or "Always Allow"
- Cookie values are never displayed in output — only domain names and counts
- The browser session persists cookies between commands, so imported cookies work immediately for `/qa`, `/browse`, and `/design-review`
- Sessions expire when the browser process ends — you may need to re-import for new sessions
