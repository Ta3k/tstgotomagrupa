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

Decyzje D1–D11 podjęte 2026-09-23 i zapisane na początku `PLAN.md`:
- sekwencja jednorazowa, bez teleportu i scroll-jackingu;
- krótki pin na mobile;
- nowe hero „wow”;
- poprawki linków i tekstów EN;
- usunięcie `index_pl.html`;
- `noindex` zostaje (stage).

## Hero lab: trzy koncepcje nowego hero (przed Etapem 3)

Zrobione:
- Prototypy A „Zaćmienie” (CSS), B „Ekosystem” (SVG/CSS 3D) i C „Płynne złoto” (WebGL1 z fallbackiem CSS).
  - PL i EN, desktop i mobile.
  - Adresy: `/hero-lab/{a,b,c}/` i `/en/hero-lab/{a,b,c}/`, kontrola z obecnym hero pod `/hero-lab/0/`.
  - Lab jest poza nawigacją i sitemapą, z `noindex`.
- Opis, koszty, ryzyka iOS i rekomendacja są w `docs/homepage-v2/HERO.md`. Surowe pomiary: `docs/homepage-v2/hero-lab/`.
- Jedyna zmiana poza labem: flaga `homepage_runtime` w `site/_includes/runtime-scripts.html`, żeby lab ładował JS jak strona główna.

Wyniki:
- Lighthouse mobile, mediana ×3 (PL/EN): kontrola 90/90, A 89/88, B 89/88, C 90/90 (start shadera przy pierwszej interakcji). CLS 0 wszędzie.
- C ze startem od razu po `load`: 64–78, TBT 400–1260 ms. Odrzucone.
- Koszt w spoczynku (mobile, CPU ×4, ponad kontrolę): A ~+150 ms/s, B ~+450 ms/s, C ~+100 ms/s.
- Chromium i WebKit (1440, 1920, 390, 360, PL/EN) oraz Firefox: brak poziomego scrolla i błędów konsoli. Sprawdzone też reduced-motion i przejście do diagramu.

Build zielony (`npm run build`). Testów automatycznych jeszcze nie ma: Etap 2 nie jest wykonany, bo właściciel zlecił najpierw lab hero.

Otwarte kwestie:
- Wybór koncepcji (rekomendacja: C, alternatywa: A).
- Dla C: akceptacja startu ruchu przy pierwszej interakcji i test na prawdziwym iPhonie.

### Hero lab: iteracja po rozmowie (2026-09-23)

- C v1 („złote morze o zachodzie”) zostało odrzucone: właściciel uznał, że wygląda jak tafla morza, a nie płynne złoto, i słabo wiąże się z grupą technologiczną.
- C v2 „Płynne złoto”: struga polerowanego złota w świetle studyjnym. Przy scrollu spływa w dół, zwęża się i przechodzi w złotą nić do diagramu. Wydajność celowo niemierzona (decyzja właściciela: najpierw efekt).
  - Sprawdzone wizualnie w Chromium z GPU (1440, 1920, 390, 360; PL/EN; sekwencja scrolla).
- B+: ocena wykonalności przejścia prawdziwego diagramu z perspektywy 3D do widoku płaskiego. Test techniczny na prawdziwym DOM diagramu: ostry render, 57–60 fps.
  - Szczegóły i ryzyka w `HERO.md`. Niczego nie wdrażałem.
- B+ „Diagram jako hero”: prototyp `/hero-lab/d/` (PL/EN). Prawdziwy diagram przechodzi z perspektywy 3D w hero do widoku płaskiego w sekcji. Na mobile łagodna wersja. Obecna sekwencja 2 kroków jest na tej stronie wyłączona (uproszczenie prototypu).
