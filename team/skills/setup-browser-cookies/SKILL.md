---
name: setup-browser-cookies
description: >
  Import cookies from your real browser into the Claude in Chrome browser
  session for authenticated testing. Use before QA testing authenticated pages.
  Use when asked to "import cookies", "set up cookies", "login to the site",
  "authenticate the browser", "set up auth", or when another skill (like /qa,
  /browse, /design-review) needs an authenticated session.
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
  - mcp__Claude_in_Chrome__computer
  - mcp__Claude_in_Chrome__read_page
  - mcp__Claude_in_Chrome__navigate
  - mcp__Claude_in_Chrome__javascript_tool
  - mcp__Claude_in_Chrome__form_input
  - mcp__Claude_in_Chrome__tabs_context_mcp
  - mcp__Claude_in_Chrome__tabs_create_mcp
  - mcp__Claude_in_Chrome__find
  - mcp__Claude_in_Chrome__get_page_text
---

# Setup Browser Cookies

Import logged-in sessions into the Claude in Chrome browser so you can test authenticated pages without re-logging in every time. This is the bridge between "I'm logged in on my machine" and "Claude can browse as me."

## Why this exists

Many QA, browse, and design-review tasks require an authenticated session. Logging in through the headless browser works but is slow and fragile (MFA, CAPTCHAs, SSO redirects). Importing cookies from a browser where you're already logged in skips all of that.

## Step 1: Get a browser tab ready

Before anything else, make sure you have a Claude in Chrome tab to work with:

```
1. Call tabs_context_mcp (with createIfEmpty: true) to get or create a tab group
2. Note the tabId — you'll need it for every browser action below
```

## Step 2: Ask what the user needs

Use AskUserQuestion to find out what they want to authenticate with:

**Question:** "Which site(s) do you need to authenticate with? And how would you like to get your cookies into the browser?"

**Options:**
- A) I'll provide a cookies JSON file (exported from a browser extension like Cookie-Editor)
- B) I'll log in manually — just navigate me to the login page
- C) I have cookies as text/key-value pairs I can paste

## Step 3: Import the cookies

### Option A: User provides a cookies JSON file

The user exports cookies from a browser extension (Cookie-Editor, EditThisCookie, etc.) which produces a JSON array. The format looks like this:

```json
[
  {
    "name": "session_id",
    "value": "abc123",
    "domain": ".example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "Lax"
  }
]
```

To import:

1. Read the JSON file the user provides (it'll be in uploads or a path they specify)
2. Navigate to the target domain first — cookies can only be set for the current domain or its parent:
   ```
   navigate to https://example.com
   ```
3. Use `javascript_tool` to set each cookie via `document.cookie`:
   ```javascript
   // For each cookie in the array:
   document.cookie = "name=value; domain=.example.com; path=/; secure; samesite=lax; max-age=86400";
   ```
4. For httpOnly cookies (which can't be set via document.cookie), use the Chrome DevTools protocol approach — execute via `javascript_tool`:
   ```javascript
   // httpOnly cookies need a page reload after setting non-httpOnly ones
   // Navigate to a page that will trigger the server to re-issue httpOnly session cookies
   // Or inform the user that httpOnly cookies need manual login for that specific cookie
   ```

**Important:** `document.cookie` cannot set `httpOnly` cookies. If the export contains httpOnly cookies (which session cookies usually are), let the user know and suggest Option B as a fallback for those specific cookies, or suggest they try accessing the site after importing the non-httpOnly cookies — sometimes that's enough to maintain a session.

### Option B: User logs in manually through the browser

This is the most reliable path, especially for sites with MFA or SSO:

1. Ask which URL to navigate to (e.g., "https://example.com/login")
2. Navigate there:
   ```
   navigate → the login URL
   ```
3. Take a screenshot so the user can see the login form:
   ```
   computer → screenshot
   ```
4. Walk the user through it interactively:
   - Use `read_page` to identify form fields
   - Use `form_input` to fill in values the user provides (username, email)
   - **Never type passwords yourself** — ask the user to provide them or let them know you'll fill the field but the value comes from them
   - Use `computer` with `left_click` to submit the form
5. After submission, take another screenshot to check the result
6. If MFA/CAPTCHA appears, tell the user and ask them to complete it manually, then re-screenshot to continue

### Option C: User pastes cookie key-value pairs

Sometimes the user just has the cookie values (from DevTools, from a script, etc.):

1. Ask them to paste the cookies in `name=value` format (one per line, or however they have them)
2. Navigate to the target domain first
3. Set each one via `javascript_tool`:
   ```javascript
   document.cookie = "session_id=abc123; path=/; secure; samesite=lax; max-age=86400";
   ```
4. Reload the page to let the cookies take effect

## Step 4: Verify the session works

This is the most important step — don't skip it.

1. Navigate to a page that requires authentication (ask the user which page, or try the site's main dashboard/home page)
2. Take a screenshot:
   ```
   computer → screenshot
   ```
3. Check the page content with `get_page_text` — look for signs of a logged-in state (username displayed, dashboard content, absence of login redirects)
4. Report back to the user: either "You're authenticated — I can see [dashboard/username/etc.]" or "It looks like the session didn't take — I'm seeing a login page. Want to try Option B?"

## Cookie format reference

Different browser extensions export slightly different formats. Here's what to expect:

| Extension | Format |
|-----------|--------|
| Cookie-Editor | JSON array with `name`, `value`, `domain`, `path`, `secure`, `httpOnly`, `sameSite` |
| EditThisCookie | JSON array, similar fields, sometimes includes `expirationDate` |
| Netscape/curl format | Tab-separated text file (domain, flag, path, secure, expiry, name, value) |

For Netscape format, parse it line by line in bash and convert to the `document.cookie` string format before injecting.

## Security notes

- Cookie values are sensitive credentials — **never display cookie values in output**. Only show domain names and cookie names (not values) when reporting status.
- Treat imported sessions with care. The user is trusting you with their authenticated session.
- Sessions persist in the Claude in Chrome tab group for the duration of the session, but expire when the browser process ends or when the server-side session expires (whichever comes first).
- If a session expires mid-testing, you'll see login redirects — just re-run this skill.

## Troubleshooting

**Cookies set but still redirected to login:**
- The site probably relies on httpOnly cookies that `document.cookie` can't set. Use Option B (manual login) instead.
- Some sites check additional signals (localStorage tokens, request headers). Try `javascript_tool` to set `localStorage` items if the site uses JWT or similar token-based auth.

**Cookie domain mismatch:**
- You must navigate to the target domain before setting cookies. Browsers won't let you set cookies for a domain you're not on.
- Use the parent domain with a leading dot (`.example.com`) to cover subdomains.

**SameSite issues:**
- If cookies have `sameSite: "Strict"`, they won't be sent on cross-origin navigations. Navigate directly to the site (don't follow redirects from another domain).
