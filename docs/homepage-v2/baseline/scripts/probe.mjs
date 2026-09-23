// Diagnoza skoków scrolla: log scrollY w każdej klatce + zdarzenia (utworzenie triggerów, zmiany wysokości,
// zakończenie sekwencji, preventDefault na wheel/touch, refresh ScrollTrigger).
// usage: node probe.mjs <desktop|mobile> [lang pl|en] [mode wheel|fast|touch|keys]
import { chromium } from 'playwright';
const [profile = 'desktop', lang = 'pl', mode = 'wheel'] = process.argv.slice(2);
const mobile = profile === 'mobile';
const b = await chromium.launch();
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : { viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.addInitScript(() => {
  window.__ev = []; const t0 = performance.now(); const log = (k, v) => window.__ev.push([Math.round(performance.now() - t0), k, v]);
  window.__log = log;
  // przechwyć preventDefault na wheel/touchmove
  const pd = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function () { if (this.type === 'wheel' || this.type === 'touchmove') log('preventDefault', this.type); return pd.call(this); };
  const sto = window.scrollTo;
  window.scrollTo = function (...a) { log('scrollTo()', JSON.stringify(a).slice(0, 60) + ' from ' + Math.round(scrollY)); return sto.apply(this, a); };
  let lastY = 0, lastH = 0, lastN = -1, lastDone = null, lastPins = '';
  const frame = () => {
    const y = Math.round(scrollY), h = document.documentElement.scrollHeight;
    const sec = document.querySelector('#jak-to-dziala, #how-it-works');
    const n = window.ScrollTrigger ? ScrollTrigger.getAll().length : -1;
    const pins = window.ScrollTrigger ? ScrollTrigger.getAll().filter((t) => t.pin).map((t) => `${t.trigger.id || 'x'}:${Math.round(t.start)}-${Math.round(t.end)}`).join(' ') : '';
    const done = sec?.dataset.scrollStoryCompleted || null;
    if (Math.abs(y - lastY) > 160) log('JUMP', `${lastY} -> ${y} (${y - lastY})`);
    if (h !== lastH) log('docHeight', `${lastH} -> ${h}`);
    if (n !== lastN) log('triggers', n);
    if (pins !== lastPins) log('pins', pins || '-');
    if (done !== lastDone) log('storyCompleted', done);
    lastY = y; lastH = h; lastN = n; lastDone = done; lastPins = pins;
    window.__ys = window.__ys || []; window.__ys.push(y);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  document.addEventListener('DOMContentLoaded', () => {
    const iv = setInterval(() => { if (window.ScrollTrigger) { clearInterval(iv); ScrollTrigger.addEventListener('refresh', () => log('ST.refresh', Math.round(scrollY))); } }, 50);
  });
});
await p.goto(`http://localhost:6070${lang === 'en' ? '/en' : ''}/`, { waitUntil: 'load' });
await p.addStyleTag({ content: '.cookie-dialog{display:none!important}' });
await p.waitForTimeout(2500);
await p.evaluate(() => window.__log('--- start scroll', ''));
const cdp = await ctx.newCDPSession(p);
if (mode === 'wheel') {
  await p.mouse.move(700, 450);
  for (let i = 0; i < 70; i++) { await p.mouse.wheel(0, 100); await p.waitForTimeout(110); }
} else if (mode === 'fast') {
  await p.mouse.move(700, 450);
  for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(50); }
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.__log('--- fast up', ''));
  for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, -500); await p.waitForTimeout(50); }
} else if (mode === 'touch') {
  // realistyczne przesunięcia palcem z bezwładnością (CDP)
  for (let i = 0; i < 16; i++) {
    let y = 700;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y }] });
    for (let k = 0; k < 12; k++) { y -= 32; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] }); await p.waitForTimeout(12); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(450);
  }
} else if (mode === 'trackpad') {
  // gładzik: seria drobnych zdarzeń co ~16 ms z wygasaniem (typowy "flick")
  await p.mouse.move(700, 450);
  for (let f = 0; f < 9; f++) {
    let d = 70;
    for (let k = 0; k < 40; k++) { await p.mouse.wheel(0, Math.round(d)); d *= .93; await p.waitForTimeout(16); }
    await p.waitForTimeout(300);
  }
  await p.evaluate(() => window.__log('--- expected total ~' + 9 * 970, ''));
} else if (mode === 'keys') {
  await p.locator('body').click({ position: { x: 5, y: 400 } });
  for (let i = 0; i < 10; i++) { await p.keyboard.press('PageDown'); await p.waitForTimeout(400); }
}
await p.waitForTimeout(1500);
const ev = await p.evaluate(() => window.__ev);
const ys = await p.evaluate(() => window.__ys);
const start = ev.findIndex((e) => e[1] === '--- start scroll');
console.log(`== ${profile} ${lang} ${mode}`);
for (const e of ev) if (!['docHeight'].includes(e[1]) || ev.indexOf(e) > start) console.log(e.join('  '));
// sumaryczna statystyka ruchu: największy skok klatka-do-klatki
let maxd = 0; for (let i = 1; i < ys.length; i++) maxd = Math.max(maxd, Math.abs(ys[i] - ys[i - 1]));
console.log('max frame delta', maxd, 'final y', ys[ys.length - 1]);
await b.close();
