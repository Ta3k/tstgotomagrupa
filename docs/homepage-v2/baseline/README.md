# Baseline (Etap 1, 2026-09-23)

- `lighthouse/`
  - `summary.json`: mediany i wagi zasobów.
  - `<env>-<lang>-runN.json`: surowe raporty LHR (tylko kategoria performance, bez zrzutów ekranu, żeby zmniejszyć rozmiar).
  - Lighthouse 13.5.0, mobile, domyślny throttling, Chrome headless.
  - `local` = build `JEKYLL_ENV=production` z commita `c376a8d`, serwowany przez `serve` na :6070.
- `playwright/survey.json`: 3 środowiska × PL/EN × 6 szerokości. Pin, droga do kart (kółko 100 px / 120 ms), overflow, konsola, requesty.
- `playwright/interact.json`: local, tylko Chromium, 1440 i 1920 px. Trajektoria scrolla, szybki scroll, PageDown/Space/End/Home, Tab, anchory, reduced-motion, resize. Mobile: Pixel 7 (Chromium) i iPhone 13 (WebKit).
- `playwright/linkcheck.tsv`: link, kod HTTP, finalny URL, liczba przekierowań.
- `scripts/`: skrypty użyte do pomiarów (`lh.mjs`, `survey.mjs`, `interact.mjs`). Wymagają `playwright`, `lighthouse` i `chrome-launcher`. Były uruchamiane z katalogu tymczasowego. Właściwe testy powstaną w Etapie 2.
