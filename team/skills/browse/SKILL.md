---
name: browse
description: Browser-based QA testing and site dogfooding via Claude in Chrome. Navigate any URL, interact with elements, verify page state, take screenshots, record GIFs, check responsive layouts, test forms, run accessibility audits, monitor network performance, and assert element states. Use when you need to test a feature, verify a deployment, dogfood a user flow, or file a bug with evidence. Use when asked to "open in browser", "test the site", "take a screenshot", "dogfood this", or "check this page".
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
  - mcp__Claude_in_Chrome__computer
  - mcp__Claude_in_Chrome__navigate
  - mcp__Claude_in_Chrome__read_page
  - mcp__Claude_in_Chrome__find
  - mcp__Claude_in_Chrome__form_input
  - mcp__Claude_in_Chrome__get_page_text
  - mcp__Claude_in_Chrome__javascript_tool
  - mcp__Claude_in_Chrome__read_console_messages
  - mcp__Claude_in_Chrome__read_network_requests
  - mcp__Claude_in_Chrome__resize_window
  - mcp__Claude_in_Chrome__gif_creator
  - mcp__Claude_in_Chrome__file_upload
  - mcp__Claude_in_Chrome__upload_image
  - mcp__Claude_in_Chrome__tabs_context_mcp
  - mcp__Claude_in_Chrome__tabs_create_mcp
  - mcp__Claude_in_Chrome__tabs_close_mcp
  - mcp__Claude_in_Chrome__shortcuts_list
  - mcp__Claude_in_Chrome__shortcuts_execute
---

# browse: QA Testing & Dogfooding

Browser-based testing for live sites using Claude in Chrome.

## Prerequisites

Before doing anything, get a tab context:

```
1. tabs_context_mcp (createIfEmpty: true) → get available tabs
2. tabs_create_mcp → create a fresh tab for this session
3. navigate → go to the target URL
```

Every tool call requires a `tabId`. Get it from `tabs_context_mcp` first.

### Auth-Gated Sites

If the site requires login, use the **setup-browser-cookies** skill first to import a logged-in session from a real browser. This avoids manual login flows in most cases. Fall back to the User Handoff protocol (below) only when cookies aren't sufficient (MFA, CAPTCHA, OAuth).

---

## Claude in Chrome Tool Reference

### Navigation & Tabs

| Action | Tool | Key params |
|--------|------|------------|
| Navigate to URL | `navigate` | `url`, `tabId` |
| Go back/forward | `navigate` | `url: "back"` or `url: "forward"` |
| Get tab context | `tabs_context_mcp` | `createIfEmpty: true` |
| Create new tab | `tabs_create_mcp` | — |
| Close tab | `tabs_close_mcp` | `tabId` |

### Reading the Page

| Action | Tool | Key params |
|--------|------|------------|
| Accessibility tree | `read_page` | `tabId`, optional `filter: "interactive"`, `ref_id`, `depth` |
| Find elements by description | `find` | `query` (natural language), `tabId` |
| Extract page text | `get_page_text` | `tabId` |

`read_page` returns an accessibility tree with element references (e.g. `ref_1`, `ref_2`). Use these refs in subsequent tool calls to target specific elements.

`find` accepts natural language queries like `"login button"`, `"search bar"`, `"price containing $49"`. Returns up to 20 matching elements with refs.

### Interaction

| Action | Tool | Key params |
|--------|------|------------|
| Click | `computer` | `action: "left_click"`, `coordinate` or `ref` |
| Type text | `computer` | `action: "type"`, `text` |
| Press key | `computer` | `action: "key"`, `text` (e.g. `"Enter"`, `"Tab"`) |
| Scroll | `computer` | `action: "scroll"`, `coordinate`, `scroll_direction` |
| Scroll element into view | `computer` | `action: "scroll_to"`, `ref` |
| Hover | `computer` | `action: "hover"`, `coordinate` or `ref` |
| Drag | `computer` | `action: "left_click_drag"`, `start_coordinate`, `coordinate` |
| Right-click | `computer` | `action: "right_click"`, `coordinate` |
| Double-click | `computer` | `action: "double_click"`, `coordinate` |
| Fill form field | `form_input` | `ref`, `value`, `tabId` |
| Upload file | `file_upload` | `paths` (array), `ref`, `tabId` |

**Tip:** Use `find` to locate elements by description, then use the returned `ref` for clicks and form inputs. This is more reliable than coordinate-based clicking.

### Screenshots & Evidence

| Action | Tool | Key params |
|--------|------|------------|
| Take screenshot | `computer` | `action: "screenshot"`, `tabId` |
| Save screenshot to disk | `computer` | `action: "screenshot"`, `save_to_disk: true` |
| Zoom into region | `computer` | `action: "zoom"`, `region: [x0, y0, x1, y1]` |
| Start GIF recording | `gif_creator` | `action: "start_recording"`, `tabId` |
| Stop GIF recording | `gif_creator` | `action: "stop_recording"`, `tabId` |
| Export GIF | `gif_creator` | `action: "export"`, `download: true`, `tabId` |

### Debugging

| Action | Tool | Key params |
|--------|------|------------|
| Read console messages | `read_console_messages` | `tabId`, `pattern` (regex), `onlyErrors: true` for errors only |
| Read network requests | `read_network_requests` | `tabId`, `urlPattern` (string filter) |
| Execute JavaScript | `javascript_tool` | `text` (JS code), `tabId` |

### Viewport

| Action | Tool | Key params |
|--------|------|------------|
| Resize window | `resize_window` | `width`, `height`, `tabId` |

---

## Core QA Patterns

### 1. Verify a page loads correctly

```
navigate → URL
computer → screenshot
read_console_messages → pattern: "error|warning|fail" or onlyErrors: true
read_network_requests → check for failed requests (4xx/5xx)
```

A page is healthy when: no JS errors in console, no failed network requests, key content is visible in screenshot.

### 2. Test a user flow

```
navigate → starting page
read_page → see interactive elements and their refs
form_input / computer → fill fields, click buttons
computer → screenshot after each step
read_console_messages → check for errors after each interaction
```

Use `find` with natural language to locate elements when the page is complex: `find("submit order button")`.

### 3. Before/after comparison

```
computer → screenshot (baseline)
[perform the action]
computer → screenshot (after)
Compare: what changed? Was it expected?
```

### 4. Visual evidence for bug reports

Always capture:
- A screenshot showing the problem (`save_to_disk: true`)
- Console errors (`read_console_messages` with `onlyErrors: true`)
- Failed network requests (`read_network_requests`)
- The repro steps you followed

Use `zoom` to highlight small UI issues: `action: "zoom", region: [x0, y0, x1, y1]`.

### 5. Record a GIF of a user flow

For flows that need to show interaction over time:

```
gif_creator → action: "start_recording"
computer → screenshot (captures initial frame)
[perform the flow: clicks, typing, navigation]
computer → screenshot (captures final frame)
gif_creator → action: "stop_recording"
gif_creator → action: "export", download: true
```

GIFs include click indicators, action labels, and a progress bar by default. Disable with `options: { showClickIndicators: false, ... }`.

### 6. Assert element states

Use `javascript_tool` for assertions:

```javascript
// Element visible?
document.querySelector('.success-banner')?.offsetParent !== null

// Element contains text?
document.querySelector('.status')?.textContent.includes('Complete')

// Checkbox checked?
document.querySelector('#agree-terms')?.checked

// Element disabled?
document.querySelector('#submit-btn')?.disabled

// Element focused?
document.activeElement === document.querySelector('#email-input')

// Element count
document.querySelectorAll('.error-message').length
```

### 7. Test responsive layouts

Take screenshots at standard breakpoints:

```
resize_window → 375 x 812 (Mobile)     → screenshot
resize_window → 768 x 1024 (Tablet)    → screenshot
resize_window → 1280 x 800 (Desktop)   → screenshot
resize_window → 1920 x 1080 (Large)    → screenshot
```

Check for: overflow, overlapping elements, hidden content, touch target sizes, readable text.

### 8. Test file uploads

Don't click file input buttons (opens a native dialog you can't interact with). Instead:

```
find → "file upload input"
file_upload → paths: ["/path/to/file"], ref: "ref_X", tabId
```

Verify the upload indicator appears afterward.

### 9. Test dialogs and modals

- Trigger the dialog (click the button that opens it)
- Take a screenshot to verify it appeared
- Interact with dialog contents
- Verify dismissal works (close button, escape key, backdrop click)

### 10. Compare environments

Navigate to the same page on staging vs production:
- Take screenshots of both
- Compare rendered content, layout, data
- Check console/network on both for discrepancies

---

## Accessibility Testing

Run these checks on every page you test:

### Automated checks via JavaScript

```javascript
// Missing alt text on images
document.querySelectorAll('img:not([alt]), img[alt=""]').length

// Missing form labels
document.querySelectorAll('input:not([aria-label]):not([id])').length

// Empty links
document.querySelectorAll('a:not([aria-label])').length === 0
  ? 'OK'
  : [...document.querySelectorAll('a')].filter(a => !a.textContent.trim() && !a.getAttribute('aria-label')).length

// Heading hierarchy (should not skip levels)
[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName)

// Missing lang attribute
document.documentElement.hasAttribute('lang')

// Focus indicator test — tab through and screenshot each focused element
// Use computer → action: "key", text: "Tab" repeatedly, screenshot between each
```

### Manual checks

- **Keyboard navigation**: Tab through the entire page. Every interactive element should be reachable and have a visible focus indicator.
- **Color contrast**: Screenshot the page and look for low-contrast text, especially light gray on white or similar.
- **Touch targets**: At mobile viewport, interactive elements should be at least 44x44px. Use `zoom` to inspect.
- **Screen reader semantics**: Use `read_page` (which returns the accessibility tree) to verify elements have proper roles, labels, and structure.

---

## Performance Observation

Use `read_network_requests` to catch performance issues:

```
read_network_requests → tabId, clear: true  (clear first to get a clean slate)
navigate → URL
computer → wait, duration: 3  (let the page finish loading)
read_network_requests → tabId
```

### What to look for

- **Failed requests**: Any 4xx or 5xx status codes
- **Slow requests**: API calls taking unusually long (note timestamps)
- **Large payloads**: Responses that are disproportionately large for their purpose
- **Redundant requests**: The same endpoint called multiple times
- **Mixed content**: HTTP requests on an HTTPS page
- **Missing resources**: 404s for CSS, JS, images, or fonts

### Client-side performance via JavaScript

```javascript
// Page load timing
JSON.stringify(performance.timing.loadEventEnd - performance.timing.navigationStart) + 'ms'

// Largest Contentful Paint
new PerformanceObserver(l => {}).observe({type: 'largest-contentful-paint'});
performance.getEntriesByType('largest-contentful-paint').pop()?.startTime

// DOM size
document.querySelectorAll('*').length

// Memory (if available)
performance.memory?.usedJSHeapSize
```

---

## Bug Report Template

When documenting findings, use this structure:

```
### [BUG-001] Short descriptive title

**Severity:** Critical | High | Medium | Low
**Category:** Functional | Visual | UX | Performance | Accessibility | Content | Security
**Page:** URL where the issue occurs
**Viewport:** Desktop 1280x800 / Tablet 768x1024 / Mobile 375x812

**Steps to reproduce:**
1. Navigate to [URL]
2. [Action]
3. [Action]

**Expected:** What should happen
**Actual:** What actually happens

**Evidence:**
- Screenshot: [filename or inline]
- Console errors: [if any]
- Network failures: [if any]

**Fix effort estimate:** Trivial | Small | Medium | Large
```

Assign severity as:
- **Critical**: Blocks core functionality, data loss, security vulnerability
- **High**: Major feature broken, significant UX degradation
- **Medium**: Minor feature broken, cosmetic issue affecting usability
- **Low**: Cosmetic polish, nice-to-have improvement

---

## User Handoff

When you hit something you can't handle:

1. Tell the user what happened via `AskUserQuestion`
2. Ask them to complete the action manually in the browser
3. Once they confirm, take a fresh screenshot and continue

**When to hand off:**
- CAPTCHAs or bot detection
- Multi-factor authentication (when cookies aren't sufficient)
- OAuth flows requiring user interaction
- Native file picker dialogs (use `file_upload` tool instead when possible)
- Complex interactions that fail after 3 attempts

---

## Important Rules

1. **Get tab context first.** Always call `tabs_context_mcp` before any other browser tool.
2. **Screenshots are evidence.** Every finding needs a screenshot. Use `save_to_disk: true` when the screenshot is a deliverable.
3. **Show screenshots to the user.** Use the Read tool on the saved PNG so the user can see it inline.
4. **Check console after every interaction.** JS errors that don't surface visually are still bugs. Use `pattern` to filter noise.
5. **Check network after page loads.** Failed requests are silent bugs. Use `urlPattern` to focus on API calls.
6. **Use `find` over coordinates.** Natural language element finding is more reliable than guessing pixel positions.
7. **Test like a user.** Use realistic data. Walk through complete workflows.
8. **Verify before documenting.** Retry once to confirm an issue is reproducible.
9. **Record GIFs for complex flows.** A GIF is worth a thousand screenshots for multi-step bugs.
10. **Never include credentials in output.** Write `[REDACTED]` for passwords, tokens, and keys.
