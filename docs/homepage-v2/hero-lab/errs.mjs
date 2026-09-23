import { chromium, webkit, firefox } from 'playwright';
for (const bt of [chromium, webkit, firefox]) {
  const b = await bt.launch(); let bad = 0, n = 0;
  for (const v of ['0', 'a', 'b', 'c']) for (const l of ['', '/en']) for (const vp of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] } }); const p = await ctx.newPage(); const e = [];
    p.on('pageerror', (x) => e.push(x.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') e.push(m.type() + ':' + m.text()); });
    p.on('response', (r) => { if (r.status() >= 400) e.push(r.status() + ' ' + r.url()); });
    await p.goto(`http://localhost:6070${l}/hero-lab/${v}/`, { waitUntil: 'load' }); await p.mouse.move(200, 200); await p.mouse.move(260, 220); await p.evaluate(() => scrollBy(0, 300)); await p.waitForTimeout(2500);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); n++;
    if (e.length || ov > 0) { bad++; console.log(bt.name(), v, l || '/pl', vp[0], 'ovf', ov, e.slice(0, 3).join(' | ').slice(0, 300)); }
    await ctx.close();
  }
  console.log(bt.name(), `checked ${n}, issues ${bad}`); await b.close();
}
