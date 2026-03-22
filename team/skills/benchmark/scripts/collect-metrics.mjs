#!/usr/bin/env node

/**
 * collect-metrics.mjs
 *
 * Headless browser benchmark runner using Puppeteer.
 * Navigates to each URL multiple times, collects performance metrics via the
 * Performance API, and outputs median values as JSON.
 *
 * Usage:
 *   node collect-metrics.mjs --urls "http://localhost:3000/,http://localhost:3000/dashboard" \
 *     --runs 5 --warmup --output metrics.json
 *
 * Options:
 *   --urls       Comma-separated list of URLs to benchmark (required)
 *   --runs       Number of measurement passes per URL (default: 5)
 *   --warmup     Include one warm-up navigation before measuring (default: false)
 *   --output     Path to write the JSON results (default: stdout)
 *   --timeout    Page load timeout in ms (default: 30000)
 */

import puppeteer from "puppeteer";
import { writeFileSync } from "fs";
import { parseArgs } from "util";

const { values: args } = parseArgs({
  options: {
    urls:    { type: "string" },
    runs:    { type: "string", default: "5" },
    warmup:  { type: "boolean", default: false },
    output:  { type: "string", default: "" },
    timeout: { type: "string", default: "30000" },
  },
});

if (!args.urls) {
  console.error("Error: --urls is required (comma-separated list of URLs)");
  process.exit(1);
}

const urls = args.urls.split(",").map((u) => u.trim()).filter(Boolean);
const RUNS = parseInt(args.runs, 10);
const TIMEOUT = parseInt(args.timeout, 10);
const WARMUP = args.warmup;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function p75(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.75) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Navigate to `url` and extract performance metrics from the page.
 * Returns a raw metrics object for one run.
 */
async function collectOnce(page, url) {
  // Clear caches between runs so each measurement is independent
  const client = await page.createCDPSession();
  await client.send("Network.clearBrowserCache");
  await client.send("Network.clearBrowserCookies");
  await client.detach();

  await page.goto(url, { waitUntil: "networkidle0", timeout: TIMEOUT });

  // Wait a beat for late observers (LCP, CLS) to settle
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

  const metrics = await page.evaluate(() => {
    // --- Navigation timing ---
    const nav = performance.getEntriesByType("navigation")[0] || {};
    const ttfb = nav.responseStart - nav.requestStart;
    const domInteractive = nav.domInteractive - nav.startTime;
    const domComplete = nav.domComplete - nav.startTime;
    const fullLoad = nav.loadEventEnd - nav.startTime;

    // --- Paint timing (FCP) ---
    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");
    const fcp = fcpEntry ? fcpEntry.startTime : null;

    // --- LCP via stored observer value ---
    // We inject an observer at page start; fall back to 0 if unavailable.
    const lcp = window.__lcp_value || null;

    // --- CLS via stored observer value ---
    const cls = window.__cls_value || null;

    // --- Resource metrics ---
    const resources = performance.getEntriesByType("resource").map((r) => ({
      name: r.name.split("/").pop().split("?")[0],
      fullUrl: r.name,
      type: r.initiatorType,
      size: r.transferSize || 0,
      duration: Math.round(r.duration),
    }));

    const jsResources = resources.filter((r) => r.type === "script");
    const cssResources = resources.filter((r) => r.type === "css" || r.type === "link");

    const totalTransfer = resources.reduce((s, r) => s + r.size, 0);
    const jsBundleBytes = jsResources.reduce((s, r) => s + r.size, 0);
    const cssBundleBytes = cssResources.reduce((s, r) => s + r.size, 0);

    const byType = {};
    resources.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });

    return {
      ttfb_ms: Math.round(ttfb),
      fcp_ms: fcp !== null ? Math.round(fcp) : null,
      lcp_ms: lcp !== null ? Math.round(lcp) : null,
      cls: cls !== null ? parseFloat(cls.toFixed(4)) : null,
      dom_interactive_ms: Math.round(domInteractive),
      dom_complete_ms: Math.round(domComplete),
      full_load_ms: Math.round(fullLoad),
      total_requests: resources.length,
      total_transfer_bytes: totalTransfer,
      js_bundle_bytes: jsBundleBytes,
      css_bundle_bytes: cssBundleBytes,
      resources_by_type: byType,
      largest_resources: resources
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 15)
        .map(({ name, type, size, duration }) => ({ name, type, size, duration })),
      js_bundles: jsResources.map(({ name, size }) => ({ name, size })),
      css_bundles: cssResources.map(({ name, size }) => ({ name, size })),
    };
  });

  return metrics;
}

/**
 * Inject PerformanceObservers for LCP and CLS before navigation.
 * These observers store their latest values on `window` so we can
 * read them after the page settles.
 */
async function injectObservers(page) {
  await page.evaluateOnNewDocument(() => {
    window.__lcp_value = 0;
    window.__cls_value = 0;

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) {
        window.__lcp_value = entries[entries.length - 1].startTime;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstEntry = sessionEntries[0];
          const lastEntry = sessionEntries[sessionEntries.length - 1];
          if (
            sessionValue &&
            entry.startTime - lastEntry.startTime < 1000 &&
            entry.startTime - firstEntry.startTime < 5000
          ) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            window.__cls_value = clsValue;
          }
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const results = {};

  for (const url of urls) {
    const runData = [];
    const page = await browser.newPage();
    await injectObservers(page);

    // Optional warm-up pass (not measured)
    if (WARMUP) {
      try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: TIMEOUT });
      } catch {
        // Warm-up failures are non-fatal
      }
    }

    for (let i = 0; i < RUNS; i++) {
      try {
        const metrics = await collectOnce(page, url);
        runData.push(metrics);
        process.stderr.write(`  [${url}] run ${i + 1}/${RUNS} complete\n`);
      } catch (err) {
        process.stderr.write(`  [${url}] run ${i + 1}/${RUNS} FAILED: ${err.message}\n`);
      }
    }

    await page.close();

    if (!runData.length) {
      results[url] = { error: "All runs failed" };
      continue;
    }

    // Aggregate: median for timing, p75 for CLS (per Web Vitals methodology)
    results[url] = {
      runs: runData.length,
      ttfb_ms:              median(runData.map((r) => r.ttfb_ms)),
      fcp_ms:               median(runData.filter((r) => r.fcp_ms !== null).map((r) => r.fcp_ms)),
      lcp_ms:               median(runData.filter((r) => r.lcp_ms !== null).map((r) => r.lcp_ms)),
      cls:                  p75(runData.filter((r) => r.cls !== null).map((r) => r.cls)),
      dom_interactive_ms:   median(runData.map((r) => r.dom_interactive_ms)),
      dom_complete_ms:      median(runData.map((r) => r.dom_complete_ms)),
      full_load_ms:         median(runData.map((r) => r.full_load_ms)),
      total_requests:       median(runData.map((r) => r.total_requests)),
      total_transfer_bytes: median(runData.map((r) => r.total_transfer_bytes)),
      js_bundle_bytes:      median(runData.map((r) => r.js_bundle_bytes)),
      css_bundle_bytes:     median(runData.map((r) => r.css_bundle_bytes)),
      // Use the last run's resource breakdown (structural, not timing-sensitive)
      largest_resources:    runData[runData.length - 1].largest_resources,
      js_bundles:           runData[runData.length - 1].js_bundles,
      css_bundles:          runData[runData.length - 1].css_bundles,
      resources_by_type:    runData[runData.length - 1].resources_by_type,
      // Include all individual runs for transparency
      all_runs: runData,
    };
  }

  const output = JSON.stringify(results, null, 2);

  if (args.output) {
    writeFileSync(args.output, output, "utf-8");
    process.stderr.write(`Results written to ${args.output}\n`);
  } else {
    process.stdout.write(output + "\n");
  }

  await browser.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
