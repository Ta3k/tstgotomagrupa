// Koszt w spoczynku: 6 s po załadowaniu, metryki CDP (czas zadań wątku głównego) + fps rAF.
// usage: node idle.mjs <base> <variants 0,a,b,c> <profile desktop|mobile4x>
import { chromium } from 'playwright';
const [base, variantsArg, profile = 'desktop'] = process.argv.slice(2);
const mobile = profile.startsWith('mobile');
const browser = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] });
for (const v of variantsArg.split(',')) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  if (process.env.HEROONLY) await page.route('**/common.min.js', (r) => r.abort());
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  if (mobile) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(`${base}/hero-lab/${v}/`, { waitUntil: 'load' });
  if (process.env.HIDECSS) await page.addStyleTag({ content: process.env.HIDECSS });
  await page.waitForTimeout(4000);
  const renderer = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'; });
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const a = await m();
  const frames = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = (t) => { n++; if (t - t0 < 6000) requestAnimationFrame(f); else res(n / ((t - t0) / 1000)); }; requestAnimationFrame(f); }));
  const b = await m();
  const d = (k) => +((b[k] - a[k]) * 1000 / 6).toFixed(1); // ms na sekundę
  const canvas = await page.evaluate(() => { const c = document.querySelector('canvas.hl-c__canvas'); return c ? `${c.width}x${c.height}` : '-'; });
  console.log(JSON.stringify({ v, profile, taskMsPerS: d('TaskDuration'), scriptMsPerS: d('ScriptDuration'), styleMsPerS: d('RecalcStyleDuration'), layoutMsPerS: d('LayoutDuration'), fps: +frames.toFixed(1), canvas, renderer: renderer.slice(0, 60) }));
  await ctx.close();
}
await browser.close();
