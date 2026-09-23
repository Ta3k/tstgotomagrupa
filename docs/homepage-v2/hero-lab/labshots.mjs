// usage: node labshots.mjs <outDir> <base> <variants a,b,c> [langs pl,en] [widths 1440,1920,390,360] [engines chromium,webkit] [extra: times=300,1200,3000 reduced scroll]
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, devices } from 'playwright';
const [outDir, base, variantsArg, langsArg = 'pl', widthsArg = '1440,390', enginesArg = 'chromium', ...extra] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const VIEW = { 1920: [1920, 1080], 1440: [1440, 900], 1280: [1280, 800], 390: [390, 844], 360: [360, 780] };
const times = (extra.find((e) => e.startsWith('times=')) || 'times=3000').slice(6).split(',').map(Number);
const reduced = extra.includes('reduced');
const scroll = extra.includes('scroll');
const engines = { chromium, webkit };
for (const eng of enginesArg.split(',')) {
  const browser = await engines[eng].launch();
  for (const v of variantsArg.split(',')) for (const lang of langsArg.split(',')) for (const w of widthsArg.split(',').map(Number)) {
    const [vw, vh] = VIEW[w];
    const mobile = w < 768;
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile && eng === 'chromium', hasTouch: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    const url = `${base}${lang === 'en' ? '/en' : ''}/hero-lab/${v}/`;
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'commit' });
    await page.addStyleTag({ content: '.cookie-dialog{display:none!important}' }).catch(() => {});
    const tag = `${v}-${lang}-${w}-${eng}${reduced ? '-rm' : ''}`;
    let moved = false;
    for (const t of times) {
      if (!moved && t >= 1000) { const w0 = 900 - (Date.now() - t0); if (w0 > 0) await page.waitForTimeout(w0); await page.mouse.move(vw * .5, vh * .5); await page.mouse.move(vw * .52, vh * .5); moved = true; }
      const wait = t - (Date.now() - t0);
      if (wait > 0) await page.waitForTimeout(wait);
      if (moved && t >= 2000) { await page.mouse.move(vw * .55, vh * .52).catch(() => {}); await page.evaluate(() => window.dispatchEvent(new Event('scroll'))); if (t >= 3000) await page.waitForTimeout(1800); }
      await page.addStyleTag({ content: '.cookie-dialog{display:none!important}' }).catch(() => {});
      await page.screenshot({ path: path.join(outDir, `${tag}-t${t}.png`) });
    }
    if (scroll) {
      for (const f of [0.35, 0.8, 1.15]) {
        await page.evaluate((f) => window.scrollTo(0, innerHeight * f), f);
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(outDir, `${tag}-s${f}.png`) });
      }
    }
    const m = await page.evaluate(() => ({ ovf: document.documentElement.scrollWidth - innerWidth, h1: (() => { const r = document.querySelector('h1')?.getBoundingClientRect(); return r && [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)]; })() }));
    console.log(tag, JSON.stringify(m), errs.length ? 'ERR ' + errs.join(' | ').slice(0, 300) : '');
    await ctx.close();
  }
  await browser.close();
}
