// Lighthouse mobile x N, saves slimmed raw JSON + summary.
// usage: node lh.mjs <outDir> <runs> name=url [name=url ...]
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const [outDir, runsArg, ...targets] = process.argv.slice(2);
const runs = Number(runsArg) || 3;
fs.mkdirSync(outDir, { recursive: true });

const pick = (lhr) => {
  const a = lhr.audits;
  const items = a['resource-summary']?.details?.items || [];
  const byType = Object.fromEntries(items.map((i) => [i.resourceType, { requests: i.requestCount, kb: +(i.transferSize / 1024).toFixed(1) }]));
  return {
    performance: Math.round(lhr.categories.performance.score * 100),
    fcp_ms: Math.round(a['first-contentful-paint'].numericValue),
    lcp_ms: Math.round(a['largest-contentful-paint'].numericValue),
    tbt_ms: Math.round(a['total-blocking-time'].numericValue),
    cls: +a['cumulative-layout-shift'].numericValue.toFixed(4),
    si_ms: Math.round(a['speed-index'].numericValue),
    lcp_element: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet || null,
    resources: byType,
  };
};

const median = (xs) => { const s = [...xs].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const summary = {};
for (const t of targets) {
  const [name, url] = [t.slice(0, t.indexOf('=')), t.slice(t.indexOf('=') + 1)];
  const results = [];
  for (let i = 1; i <= runs; i++) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run'] });
    const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'] });
    await chrome.kill();
    const lhr = r.lhr;
    for (const k of ['final-screenshot', 'screenshot-thumbnails', 'full-page-screenshot']) delete lhr.audits[k];
    delete lhr.fullPageScreenshot;
    fs.writeFileSync(path.join(outDir, `${name}-run${i}.json`), JSON.stringify(lhr));
    const p = pick(lhr);
    results.push(p);
    console.log(name, i, JSON.stringify({ perf: p.performance, lcp: p.lcp_ms, tbt: p.tbt_ms, cls: p.cls }));
  }
  const med = {};
  for (const k of ['performance', 'fcp_ms', 'lcp_ms', 'tbt_ms', 'cls', 'si_ms']) med[k] = median(results.map((r) => r[k]));
  // resource weights taken from the run closest to median performance
  const ref = results.find((r) => r.performance === med.performance) || results[0];
  summary[name] = { url, runs: results, median: med, resources: ref.resources, lcp_element: ref.lcp_element };
}
const sumPath = path.join(outDir, 'summary.json');
const prev = fs.existsSync(sumPath) ? JSON.parse(fs.readFileSync(sumPath, 'utf8')) : {};
fs.writeFileSync(sumPath, JSON.stringify({ ...prev, ...summary, _meta: { date: new Date().toISOString(), runs, lighthouse: '13.5.0', formFactor: 'mobile (default throttling)' } }, null, 2));
console.log('done');
