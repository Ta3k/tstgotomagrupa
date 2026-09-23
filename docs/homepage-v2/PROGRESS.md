# Homepage v2: postęp

## Etap 0: przygotowanie (uzupełniony w ramach Etapu 1)

Etap 0 nie był wcześniej wykonany osobno. Stan wyjściowy:
- Bieżące zmiany były już zacommitowane przez właściciela jako `c376a8d temp changes` na `feature/zmiany-strony-v2`. Nie powstał osobny commit „WIP: stan wyjściowy”.
- Gałąź `feature/homepage-v2` utworzona od `c376a8d`. Bez push.
- `PROMPTY-homepage-v2.md` jest w `.git/info/exclude` i poza historią.
- Katalog `.agents/` jest pusty.

Środowisko: Node v20.12.0, npm 10.5.2, Ruby 3.4.9 (x64-mingw-ucrt), Bundler 2.6.9. CI używa Node 18 i Ruby 3.1/3.2.

Komendy:
```
npm install
npm run jekyll:install        # lokalnie: bundle check → zależności spełnione
npm start                     # jekyll serve --port 6060 --livereload → http://localhost:6060 (PL) i /en/
npm run build                 # esbuild common.js → common.min.js + jekyll build → _site/
# build produkcyjny do pomiarów (poza _site, bo dev serwer nadpisuje _site):
JEKYLL_ENV=production BUNDLE_GEMFILE=site/Gemfile bundle exec jekyll build --source site --destination <katalog>
npx serve -l 6070 <katalog>
```

Wynik buildu: zielony (Jekyll ~6,5 s, esbuild 12 ms). Ostrzeżenia:
- Jekyll podpowiada `wdm` na Windows (kosmetyka).
- **`site/js/vendor/*.js` są ignorowane przez `.gitignore` (`vendor`)**, więc build w CI nie będzie miał GSAP ani cookiedialog (AUDIT §0.5).

## Etap 1: audyt i bazowe pomiary

Zrobione:
- `docs/homepage-v2/AUDIT.md`: mapa repo, porównanie prod, stage i local, animacje, pomiary diagramu, linki, wydajność.
- `docs/homepage-v2/PLAN.md`: plan per sekcja, proponowane tempo, ryzyka, decyzje D1–D11.
- `docs/homepage-v2/baseline/`: Lighthouse ×3 (local, prod, stage × PL/EN), pomiary Playwright, link-check, skrypty.

Wyniki pomiarów (szczegóły w AUDIT):
- Lighthouse mobile, mediana: local PL **83** (LCP 4,33 s, TBT 19 ms, CLS 0), local EN **85** (LCP 4,17 s, TBT 16 ms, CLS 0).
- Pin diagramu (local): 2,4 vh na desktopie, 2,6 vh na mobile. Droga do kart marek: 5,44 vh (1440), 5,19 vh (1920), ~6,2 vh (390). W każdej z nich jest teleport o ~2100 px.
- Stage: pin 8,84 / 13,3 vh (12 kroków). Produkcja: brak pinu, droga do kart 1,9 / 2,6 vh.
- Przeglądarki: Chromium (6 szerokości × 3 środowiska × PL/EN), WebKit iPhone 13 i Chromium Pixel 7 (local). Na localhost błędów konsoli brak.

Build i testy: build zielony. Testów automatycznych jeszcze nie ma, powstaną w Etapie 2. Kod strony nie był zmieniany.

Decyzja właściciela (2026-09-23): **sekwencja diagramu ma 2 kroki (decyzja CEO)**, nie 12. Cele z Briefu wymagają aktualizacji (PLAN D1).

Otwarte kwestie: decyzje D1–D11 w `PLAN.md`. Najpilniejsze: D1 (nowe liczby), D2 (usunięcie teleportu i scroll-jackingu), D3 (tekst „pomiń”).
