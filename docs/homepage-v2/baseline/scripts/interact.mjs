// Interaction audit on one base URL (default local prod build).
// usage: node interact.mjs <outDir> [base]
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, devices } from 'playwright';

const outDir = process.argv[2];
const BASE = process.argv[3] || 'http://localhost:6070';
fs.mkdirSync(outDir, { recursive: true });
const LANG = { pl: { path: '/', diagram: '#jak-to-dziala', cards: '#dowiedz-sie-wiecej' }, en: { path: '/en/', diagram: '#how-it-works', cards: '#choose-what-you-need' } };
const out = {};
const log = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); fs.writeFileSync(path.join(outDir, "interact.partial.json"), JSON.stringify(out, null, 2)); };

const state = (page, L) => page.evaluate(({ diagramSel, cardsSel }) => {
  const sec = document.querySelector(diagramSel);
  const vis = (el) => { if (!el) return false; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
  const tips = [...(sec?.querySelectorAll('.scheme-desktop [data-scheme-tooltip], .scheme-tooltip') || [])];
  const visibleTips = [...new Set(tips)].filter(vis).map((t) => t.querySelector('.scheme-tooltip__title, h3, strong')?.textContent.trim().slice(0, 30));
  const cards = [...document.querySelectorAll(cardsSel + ' .c-blog-card')].map((c) => { const r = c.getBoundingClientRect(); return Math.round(r.top); });
  const pins = (window.ScrollTrigger ? ScrollTrigger.getAll() : []).filter((t) => t.pin).map((t) => ({ id: t.trigger?.id || t.trigger?.className?.toString().slice(0, 30), s: Math.round(t.start), e: Math.round(t.end), p: +t.progress.toFixed(2) }));
  const sheet = document.body.classList.contains('scheme-mobile-tooltip-open');
  return {
    y: Math.round(scrollY), ih: innerHeight, h: document.documentElement.scrollHeight,
    storyCompleted: sec?.dataset.scrollStoryCompleted === 'true',
    storyClass: !!document.querySelector('.scheme-scroll-story'),
    visibleTips, cardsTop: cards, pins,
    step: document.querySelector('.scheme-story__step')?.dataset ? `${document.querySelector('.scheme-story__step').dataset.tens}${document.querySelector('.scheme-story__step').dataset.ones}` : null,
    total: document.querySelector('.scheme-story__total')?.textContent,
    overflow: document.documentElement.scrollWidth - innerWidth,
    sheetOpen: !!sheet, bodyOverflow: getComputedStyle(document.body).overflow,
  };
}, { diagramSel: L.diagram, cardsSel: L.cards });

const newPage = async (browser, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page._errors = [];
  page.on('pageerror', (e) => page._errors.push(String(e.message).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') page._errors.push(m.text().slice(0, 200)); });
  return { ctx, page };
};
const ready = async (page, url) => { await page.goto(url, { waitUntil: 'load' }); await page.addStyleTag({ content: '.cookie-dialog{display:none!important}' }); await page.waitForTimeout(2500); };

const cr = await chromium.launch();
for (const lang of ['pl', 'en']) {
  const L = LANG[lang]; const url = BASE + L.path;

  for (const [vw, vh] of [[1440, 900], [1920, 1080]]) {
    // 1. Normal wheel scroll, record trajectory around the diagram
    {
      const { ctx, page } = await newPage(cr, { viewport: { width: vw, height: vh } });
      await ready(page, url); await page.mouse.move(vw / 2, vh / 2);
      const traj = []; let prev = 0;
      for (let i = 0; i < 200; i++) {
        await page.mouse.wheel(0, 100); await page.waitForTimeout(130);
        const s = await state(page, L);
        traj.push({ i, y: s.y, step: s.step, tips: s.visibleTips.join('|'), pins: s.pins.map((p) => `${p.id}:${p.s}-${p.e}@${p.p}`).join(' '), done: s.storyCompleted });
        if (s.y < prev - 5) traj[traj.length - 1].BACKJUMP = prev - s.y;
        prev = s.y;
        if (s.cardsTop.length && s.cardsTop[0] < vh * 0.3 && i > 20) break;
      }
      log(`${lang}-${vw}-normal-trajectory`, traj.filter((t, i) => i % 3 === 0 || t.BACKJUMP));
      await page.screenshot({ path: path.join(outDir, `${lang}-${vw}-after-normal.png`) });
      log(`${lang}-${vw}-errors`, page._errors);
      await ctx.close();
    }
    // 2. Fast wheel down then up
    {
      const { ctx, page } = await newPage(cr, { viewport: { width: vw, height: vh } });
      await ready(page, url); await page.mouse.move(vw / 2, vh / 2);
      // get to diagram top first so the story initialises
      await page.evaluate((sel) => document.querySelector(sel).scrollIntoView(), L.diagram);
      await page.waitForTimeout(800);
      const s0 = await state(page, L);
      const t0 = Date.now();
      for (let i = 0; i < 15; i++) { await page.mouse.wheel(0, 1200); await page.waitForTimeout(30); }
      const sFastMid = await state(page, L);
      await page.waitForTimeout(1500);
      const sFastDown = await state(page, L);
      for (let i = 0; i < 15; i++) { await page.mouse.wheel(0, -1200); await page.waitForTimeout(30); }
      await page.waitForTimeout(1500);
      const sFastUp = await state(page, L);
      log(`${lang}-${vw}-fast`, { atDiagram: s0, afterBurstDown_immediate: sFastMid, afterBurstDown: sFastDown, afterBurstUp: sFastUp, burstMs: Date.now() - t0 });
      await page.screenshot({ path: path.join(outDir, `${lang}-${vw}-after-fast.png`) });
      await ctx.close();
    }
  }

  // 3. Keyboard scrolling at 1440
  for (const key of ['PageDown', 'Space']) {
    const { ctx, page } = await newPage(cr);
    await ready(page, url);
    await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
    const seq = []; let cardsAt = null; let prev = 0;
    for (let i = 1; i <= 40; i++) {
      await page.keyboard.press(key === 'Space' ? ' ' : key); await page.waitForTimeout(450);
      const s = await state(page, L);
      seq.push({ i, y: s.y, step: s.step, done: s.storyCompleted, back: s.y < prev - 5 ? prev - s.y : undefined });
      prev = s.y;
      if (cardsAt === null && s.cardsTop.length === 3 && s.cardsTop.every((t) => t >= 0 && t < s.ih * 0.6)) { cardsAt = { presses: i, y: s.y, vh: +(s.y / s.ih).toFixed(2) }; break; }
    }
    log(`${lang}-kbd-${key}`, { cardsAt, seq });
    await ctx.close();
  }
  // End / Home
  {
    const { ctx, page } = await newPage(cr);
    await ready(page, url);
    await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
    await page.keyboard.press('End'); await page.waitForTimeout(2000);
    const sEnd = await state(page, L);
    await page.keyboard.press('Home'); await page.waitForTimeout(2000);
    const sHome = await state(page, L);
    log(`${lang}-kbd-EndHome`, { end: { y: sEnd.y, h: sEnd.h, atBottom: sEnd.y + sEnd.ih >= sEnd.h - 5 }, home: { y: sHome.y } });
    await ctx.close();
  }
  // 4. Tab order
  {
    const { ctx, page } = await newPage(cr);
    await ready(page, url);
    const stops = [];
    for (let i = 0; i < 160; i++) {
      await page.keyboard.press('Tab'); await page.waitForTimeout(60);
      const f = await page.evaluate(() => {
        const a = document.activeElement; if (!a || a === document.body) return null;
        const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
        const inTip = !!a.closest('.scheme-tooltip, [data-scheme-tooltip]');
        const tipVisible = inTip ? +getComputedStyle(a.closest('.scheme-tooltip, [data-scheme-tooltip]')).opacity : null;
        return { tag: a.tagName, cls: (a.className?.toString() || '').slice(0, 40), text: (a.textContent || a.getAttribute('aria-label') || a.querySelector('img')?.alt || '').trim().slice(0, 30), href: a.getAttribute('href'),
          outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? cs.outlineStyle + ' ' + cs.outlineWidth : 'none', boxShadow: cs.boxShadow !== 'none',
          inView: r.bottom > 0 && r.top < innerHeight && r.width > 0, inTip, tipVisible, y: Math.round(scrollY) };
      });
      stops.push(f);
    }
    const idx = (pred) => stops.findIndex(pred);
    log(`${lang}-tab`, {
      firstNode: idx((s) => s?.cls.includes('scheme-node')), nodeCount: stops.filter((s) => s?.cls.includes('scheme-node')).length,
      firstPartnerInTip: idx((s) => s?.inTip), partnerStopsVisible: stops.filter((s) => s?.inTip).map((s) => s.tipVisible),
      firstBrandCard: idx((s) => /gotoma|codarius/i.test(s?.href || '') && s?.cls.includes('c-blog-card')),
      brandCardStops: stops.filter((s) => s?.cls.includes('c-blog-card')).length,
      noVisibleFocus: stops.filter((s) => s && s.outline === 'none' && !s.boxShadow).map((s) => `${s.tag}.${s.cls}`).slice(0, 15),
      outOfView: stops.filter((s) => s && !s.inView).map((s) => `${s.tag}.${s.cls}:${s.text}`).slice(0, 15),
      stops: stops.map((s, i) => s && `${i}:${s.tag}.${s.cls.split(' ')[0]}:${s.text}${s.inTip ? `[tip op=${s.tipVisible}]` : ''}`),
    });
    await ctx.close();
  }
  // 5. Anchors: hero button, direct hash
  {
    const { ctx, page } = await newPage(cr);
    await ready(page, url);
    await page.locator('.works-button').first().click(); await page.waitForTimeout(2500);
    const s = await state(page, L);
    log(`${lang}-heroButton`, { y: s.y, cardsTop: s.cardsTop, pins: s.pins, done: s.storyCompleted });
    await page.screenshot({ path: path.join(outDir, `${lang}-after-hero-button.png`) });
    await ctx.close();
    const p2 = await newPage(cr);
    await ready(p2.page, url + L.cards);
    await p2.page.waitForTimeout(1500);
    const s2 = await state(p2.page, L);
    log(`${lang}-directHash`, { y: s2.y, cardsTop: s2.cardsTop, pins: s2.pins });
    await p2.ctx.close();
  }
  // 6. Reduced motion
  {
    const { ctx, page } = await newPage(cr, { reducedMotion: 'reduce' });
    await ready(page, url);
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView(), L.diagram);
    await page.waitForTimeout(1200);
    const s = await state(page, L);
    await page.screenshot({ path: path.join(outDir, `${lang}-reduced-diagram.png`) });
    // hover each node, check a tooltip shows
    const nodes = page.locator(`${L.diagram} .scheme-desktop .scheme-node, ${L.diagram} .scheme-desktop [data-tooltip]`);
    const n = await nodes.count(); const shown = [];
    for (let i = 0; i < n; i++) { await nodes.nth(i).hover({ force: true }).catch(() => {}); await page.waitForTimeout(250); const t = await state(page, L); shown.push(t.visibleTips.join('|') || '-'); }
    const pinCount = s.pins.length;
    log(`${lang}-reduced`, { pins: pinCount, visibleTipsAtRest: s.visibleTips, nodes: n, hoverShown: shown });
    await ctx.close();
  }
  // 7. Resize mid-sequence
  {
    const { ctx, page } = await newPage(cr);
    await ready(page, url); await page.mouse.move(700, 450);
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView(), L.diagram);
    await page.waitForTimeout(600);
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(130); }
    const before = await state(page, L);
    await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(1200);
    const mid = await state(page, L);
    await page.screenshot({ path: path.join(outDir, `${lang}-resize-1280.png`) });
    await page.setViewportSize({ width: 900, height: 1100 }); await page.waitForTimeout(1200);
    const toMobile = await state(page, L);
    await page.screenshot({ path: path.join(outDir, `${lang}-resize-900.png`) });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(1200);
    const back = await state(page, L);
    await page.screenshot({ path: path.join(outDir, `${lang}-resize-back1440.png`) });
    log(`${lang}-resize`, { before, mid, toMobile, back, errors: page._errors });
    await ctx.close();
  }
}
await cr.close();

// 8. Mobile: chromium Pixel 7 and webkit iPhone 13 — touch-ish scroll, node tap, sheet
for (const [name, bt, dev] of [['pixel7', chromium, devices['Pixel 7']], ['iphone13', webkit, devices['iPhone 13']]]) {
  const b = await bt.launch();
  for (const lang of ['pl', 'en']) {
    const L = LANG[lang];
    const { ctx, page } = await newPage(b, { ...dev });
    await ready(page, BASE + L.path);
    const traj = []; let prev = 0, cardsAt = null;
    for (let i = 0; i < 400; i++) {
      await page.evaluate(() => window.scrollBy(0, 120)); await page.waitForTimeout(90);
      const s = await state(page, L);
      if (i % 4 === 0 || s.y < prev - 5) traj.push({ i, y: s.y, pins: s.pins.map((p) => `${p.id}:${p.s}-${p.e}@${p.p}`).join(' '), back: s.y < prev - 5 ? prev - s.y : undefined });
      prev = s.y;
      if (cardsAt === null && s.cardsTop.length && s.cardsTop[0] >= 0 && s.cardsTop[0] < s.ih * 0.5) { cardsAt = { y: s.y, vh: +(s.y / s.ih).toFixed(2) }; break; }
    }
    // tap a node after the story
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView(), L.diagram); await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, `${name}-${lang}-diagram-static.png`) });
    const trig = page.locator('[data-mobile-tooltip-trigger]');
    const nt = await trig.count(); let tap = null;
    if (nt) {
      await trig.nth(3).tap().catch((e) => { tap = 'tap failed: ' + e.message.slice(0, 100); });
      await page.waitForTimeout(800);
      const s = await state(page, L); tap = tap || { sheetOpen: s.sheetOpen, bodyOverflow: s.bodyOverflow };
      await page.screenshot({ path: path.join(outDir, `${name}-${lang}-sheet.png`) });
    }
    log(`${name}-${lang}-mobile`, { cardsAt, traj, triggers: nt, tap, errors: page._errors, overflow: (await state(page, L)).overflow });
    await ctx.close();
  }
  await b.close();
}
fs.writeFileSync(path.join(outDir, 'interact.json'), JSON.stringify(out, null, 2));
