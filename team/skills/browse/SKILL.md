---
name: browse
description: Headless browser for QA testing and site dogfooding. Navigate any URL, interact with elements, verify page state, take screenshots, check responsive layouts, test forms, handle dialogs, and assert element states. Use when you need to test a feature, verify a deployment, dogfood a user flow, or file a bug with evidence. Use when asked to "open in browser", "test the site", "take a screenshot", or "dogfood this".
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# browse: QA Testing & Dogfooding

Headless browser for testing live sites. Uses Playwright MCP tools when available, or falls back to other browser automation.

**Requirement:** This skill requires a browser tool — either Playwright MCP (`mcp__plugin_playwright_playwright__*`) or similar. Check for available browser tools before proceeding.

## Core QA Patterns

### 1. Verify a page loads correctly
- Navigate to the URL
- Check that key elements are visible
- Check console for JS errors
- Check for failed network requests

### 2. Test a user flow
- Navigate to the starting page
- Take a snapshot to see interactive elements
- Fill form fields, click buttons
- Verify the result — take a screenshot, check what changed

### 3. Verify an action worked
- Take a baseline screenshot
- Perform the action (click, submit, etc.)
- Take an after screenshot
- Compare: what changed?

### 4. Visual evidence for bug reports
- Take annotated screenshots showing the problem
- Capture console errors
- Document repro steps alongside screenshots

### 5. Assert element states
Check whether elements are:
- Visible / hidden
- Enabled / disabled
- Checked (checkboxes, radios)
- Focused
- Contains expected text

Use JavaScript evaluation for complex assertions:
```
document.body.textContent.includes('Success')
```

### 6. Test responsive layouts
Take screenshots at multiple viewports:
- Mobile: 375x812
- Tablet: 768x1024
- Desktop: 1280x720

### 7. Test file uploads
- Target the file input element
- Upload the file
- Verify the upload success indicator appears

### 8. Test dialogs
- Set up a dialog handler (accept/dismiss)
- Trigger the dialog
- Verify the result

### 9. Compare environments
Navigate to the same page on staging vs production and compare rendered content.

### 10. Show screenshots to the user
After taking any screenshot, always use the Read tool on the output PNG so the user can see it inline. Without this, screenshots are invisible to the user.

## User Handoff

When you hit something you can't handle in headless mode (CAPTCHA, complex auth, MFA):

1. Tell the user what happened via AskUserQuestion
2. Ask them to complete the action manually
3. Once they confirm, re-snapshot and continue

**When to use handoff:**
- CAPTCHAs or bot detection
- Multi-factor authentication
- OAuth flows requiring user interaction
- Complex interactions the AI can't handle after 3 attempts

## Playwright MCP Tool Mapping

When Playwright MCP tools are available, use them directly:

| Pattern | Playwright MCP Tool |
|---------|-------------------|
| Navigate to URL | `browser_navigate` |
| Click element | `browser_click` |
| Fill input | `browser_fill_form` |
| Take screenshot | `browser_take_screenshot` |
| Get page state | `browser_snapshot` |
| Press key | `browser_press_key` |
| Hover | `browser_hover` |
| Select option | `browser_select_option` |
| Upload file | `browser_file_upload` |
| Handle dialog | `browser_handle_dialog` |
| Evaluate JS | `browser_evaluate` |
| Check console | `browser_console_messages` |
| Check network | `browser_network_requests` |
| Resize viewport | `browser_resize` |
| Navigate back | `browser_navigate_back` |
| List tabs | `browser_tabs` |
| Wait for element | `browser_wait_for` |
| Drag element | `browser_drag` |
| Type text | `browser_type` |
| Run code | `browser_run_code` |

### Workflow with Playwright MCP

```
1. browser_navigate → go to URL
2. browser_snapshot → see the page structure and interactive elements
3. browser_click / browser_fill_form → interact
4. browser_snapshot → verify what changed
5. browser_take_screenshot → capture evidence
6. Read the screenshot file → show to user
```

The snapshot returns an accessibility tree with element references (like `[ref=e3]`). Use these refs in subsequent commands to target specific elements.

## Important Rules

1. **Screenshots are evidence.** Every finding needs a screenshot.
2. **Show screenshots to the user.** Always Read the PNG file after taking it.
3. **Check console after every interaction.** JS errors that don't surface visually are still bugs.
4. **Test like a user.** Use realistic data. Walk through complete workflows.
5. **Verify before documenting.** Retry once to confirm an issue is reproducible.
6. **Never include credentials in output.** Write `[REDACTED]` for passwords.
