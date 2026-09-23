// Survey: env x lang x viewport. Wheel-scroll through page like a user, measure pin, path to brand cards,
// overflow, console errors, failed requests; save viewport screenshots.
// usage: node survey.mjs <outDir> [envs=local,stage,prod] [widths=1920,1440,1280,768,390,360]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2];
const envs = (process.argv[3] || 'local,stage,prod').split(',');
const widths = (process.argv[4] || '1920,1440,1280,768,390,360').split(',').map(Number);
fs.mkdirSync(outDir, { recursive: true });

const BASE = { local: 'http://localhost:6070', stage: 'https://www.zwieksz-sprzedaz-online.pl', prod: 'https://www.grupagotoma.pl', dev: 'http://localhost:6060' };
const VIEW = { 1920: [1920, 1080], 1440: [1440, 900], 1280: [1280, 800], 768: [768, 1024], 390: [390, 844], 360: [360, 780] };
const LANG = { pl: { path: '/', diagram: '#jak-to-dziala', cards: '#dowiedz-sie-wiecej' }, en: { path: '/en/', diagram: '#how-it-works', cards: '#choose-what-you-need' } };

const results = [];
const browser = await chromium.launch();
for (const env of envs) for (const lang of ['pl', 'en']) for (const w of widths) {
  const [vw, vh] = VIEW[w];
  const mobile = w < 768;
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 200)));
  page.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  const L = LANG[lang];
  const url = BASE[env] + L.path;
  const rec = { env, lang, w, vw, vh, url };
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    rec.docHeightInitial = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({ path: path.join(outDir, `${env}-${lang}-${w}-0top.png`) });
    // Scroll like a user: wheel 100px every 120ms (touch devices: same wheel emulation)
    await page.mouse.move(vw / 2, vh / 2);
    let maxPin = null, cardsVisibleAt = null, diagramShot = false, backJumps = [], prevY = 0, overflowMax = 0;
    const samples = [];
    for (let i = 0; i < 600; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(120);
      const s = await page.evaluate(({ diagramSel, cardsSel }) => {
        const y = window.scrollY, ih = window.innerHeight;
        const pins = (window.ScrollTrigger ? ScrollTrigger.getAll() : []).filter((t) => t.pin).map((t) => ({
          id: t.trigger?.id || t.trigger?.className?.toString().slice(0, 40), start: Math.round(t.start), end: Math.round(t.end), active: t.isActive,
        }));
        const cards = [...document.querySelectorAll(cardsSel + ' .c-blog-card')];
        const rects = cards.map((c) => c.getBoundingClientRect());
        const cardsFull = rects.length === 3 && rects.every((r) => r.top >= 0 && r.bottom <= ih + 1 && r.width > 0);
        // for stacked mobile cards: first card fully visible counts as "cards start"
        const firstCardFull = rects[0] && rects[0].top >= 0 && rects[0].bottom <= ih + 1 && rects[0].height > 0;
        const d = document.querySelector(diagramSel)?.getBoundingClientRect();
        return { y, ih, pins, cardsFull, firstCardFull, diagramTop: d ? Math.round(d.top) : null, sw: document.documentElement.scrollWidth, iw: window.innerWidth, h: document.documentElement.scrollHeight };
      }, { diagramSel: L.diagram, cardsSel: L.cards });
      samples.push(s);
      overflowMax = Math.max(overflowMax, s.sw - s.iw);
      if (s.y < prevY - 5) backJumps.push({ from: prevY, to: s.y });
      prevY = s.y;
      for (const p of s.pins) {
        const len = p.end - p.start;
        if (!maxPin || len > maxPin.len) maxPin = { ...p, len };
      }
      if (!diagramShot && s.diagramTop !== null && s.diagramTop <= 0) {
        diagramShot = true;
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(outDir, `${env}-${lang}-${w}-1diagram.png`) });
      }
      if (cardsVisibleAt === null && (mobile || w === 768 ? s.firstCardFull : s.cardsFull)) {
        cardsVisibleAt = { y: s.y, vh: +(s.y / s.ih).toFixed(2), wheelSteps: i + 1 };
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(outDir, `${env}-${lang}-${w}-2cards.png`) });
      }
      if (cardsVisibleAt && i > cardsVisibleAt.wheelSteps + 3) break;
      if (s.y + s.ih >= s.h - 2) break;
    }
    rec.pin = maxPin && { ...maxPin, vh: +(maxPin.len / vh).toFixed(2) };
    rec.cardsVisibleAt = cardsVisibleAt;
    rec.backJumps = backJumps;
    rec.overflowMax = overflowMax;
    rec.docHeightEnd = await page.evaluate(() => document.documentElement.scrollHeight);
    rec.allPinsSeen = [...new Map(samples.flatMap((s) => s.pins).map((p) => [p.id + p.start, p])).values()];
  } catch (e) { rec.error = String(e.message).slice(0, 300); }
  rec.consoleErrors = [...new Set(errors)];
  rec.failedRequests = [...new Set(failed)];
  results.push(rec);
  console.log(JSON.stringify({ env, lang, w, pin: rec.pin && `${rec.pin.len}px/${rec.pin.vh}vh`, cards: rec.cardsVisibleAt?.vh, back: rec.backJumps?.length, ovf: rec.overflowMax, err: rec.consoleErrors.length, fail: rec.failedRequests.length, e: rec.error }));
  await ctx.close();
}
await browser.close();
const f = path.join(outDir, 'survey.json');
const prev = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
fs.writeFileSync(f, JSON.stringify([...prev.filter((p) => !results.some((r) => r.env === p.env && r.lang === p.lang && r.w === p.w)), ...results], null, 2));
