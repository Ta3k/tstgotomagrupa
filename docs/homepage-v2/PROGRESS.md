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

## Etap 3: hero „Zaćmienie” wdrożone (2026-09-23)

Zrobione:
- Hero A „Zaćmienie” zastąpiło poprzedni komponent na stronie głównej PL i EN. Szczegóły w `HERO.md` („Decyzja i wdrożenie”).
- Usunięte: pin „CRT collapse” hero, lab `/hero-lab/*`, duplikat `index_pl.html` (D9).
- Poppins 400 ma `font-display: swap`.

Wyniki:
- Lighthouse mobile, mediana ×3: PL 83 → 89, EN 85 → 89. LCP 3,71 s (było 4,33 / 4,17), TBT 0 ms, CLS 0. Surowe dane w `docs/homepage-v2/hero-final/`.
- Chromium, WebKit i Firefox; 1440, 1920, 390, 360; PL i EN: brak błędów konsoli, nieudanych requestów i poziomego scrolla. Header i menu mobilne działają nad hero.
- Droga do kart marek: 4,44 vh (1440), 5,33 vh (390).

Build zielony. Testów automatycznych nadal brak: Etap 2 nie jest wykonany.

Otwarte kwestie:
- Etap 2 (testy) oraz poprawki D6/D7 (linki, teksty EN) planowane na jego początek.
- Na prawdziwym iPhonie trzeba sprawdzić maski i poświatę zaćmienia (pamięć GPU, `svh`).

### Menu i poprawka hero na podstronach (2026-09-23)

- Menu przestylowane w złotej kolorystyce (`_header.scss`, złote zmienne w `_B_color-scheme.scss`):
  - desktop: jasne pozycje z cienką złotą linią przy hover/focus i obracającą się strzałką; podmenu jako ciemny, półprzezroczysty panel ze złotą obwódką i strzałką przy hover, z „mostem” nad przerwą, żeby nie znikało przy przejściu kursorem;
  - mobile: złote kreski przy podpozycjach, złoty przycisk zamknięcia, flaga języka obok niego (wcześniej nachodziła na „Menu”);
  - usunięty martwy kod `.lang-switcher` / `.dropdown { background: #222 }`, który dawał szare tło pozycji „Nasze firmy” i „Usługi”.
- Hero na podstronach usług (14 stron PL/EN używa tego samego komponentu): przywrócone wyświetlanie `description_html` (po wdrożeniu „Zaćmienia” opisy znikały), a link „Jak to działa?” pokazuje się tylko na stronach z diagramem.
- Sprawdzone: Chromium i WebKit (1440, 390), strona główna i podstrony, hover, klawiatura, menu mobilne. Brak błędów i poziomego scrolla.

### Strony usług: złoty redesign (2026-09-23)

Dotyczy 14 stron (7 PL + 7 EN). Teksty i markup w front matter bez zmian, wszystko w CSS i w małym skrypcie:
- `component-library/components/content/content.scss`:
  - złota numeracja sekcji (01, 02…) z linią, większe nagłówki i leady;
  - karty z ciemnego szkła ze złotą krawędzią, linią światła i poświatą pod kursorem przy hover; w kartach marek cała karta jest klikalna, a link złoty;
  - kroki procesu na złotej osi z punktami (oś rysuje się przy wejściu);
  - wyróżnienia jako panele ze złotą obwódką i obracającym się pierścieniem (motyw z hero);
  - FAQ jako akordeon;
  - siatka dwóch kart w dwóch kolumnach.
- `content.jekyll.html`: skrypt dla stron z `service-page`:
  - akordeon FAQ (`aria-expanded`, `inert`);
  - kaskadowe wejścia sekcji i kart przez IntersectionObserver;
  - pozycja kursora dla poświaty.
  - Bez JS i przy reduced-motion cała treść jest widoczna.
- `button.scss`:
  - `c-button--primary` złoty (używany tylko na stronach usług i w formularzu);
  - końcowe CTA jako złoty panel z pierścieniem zaćmienia.
- `contact-form.scss` (Konsultacja 360°): formularz w złotym panelu, złote focus/checkboxy/linki, ciemne opcje selectów.
- Przycisk „do góry”: złoty, większy, z etykietą PL/EN (wcześniej pusty biały krąg z etykietą po angielsku).

Sprawdzone:
- wszystkie 14 stron w Chromium (1440 i 390): brak błędów i poziomego scrolla;
- 2 strony także w WebKit i Firefox; akordeon działa z klawiatury;
- reduced-motion i brak JS: nic nie jest ukryte.

### Ekran przejścia między stronami + diagnoza scrolla (2026-09-24)

- Ekran przejścia wzorowany na myfoodstories.pl (`site/_includes/page-transition.html`, `3-modules/_page-transition.scss`, dołączony w `_layouts/default.html`):
  - złota kurtyna z napisem „Grupa GOTOMA” / „GOTOMA Group”;
  - przy kliknięciu linku do innej strony witryny wjeżdża od dołu (0,62 s, nawigacja po 0,56 s), a na nowej stronie odjeżdża w górę;
  - wejście pojawia się tylko po nawigacji wewnętrznej (flaga w sessionStorage), więc pierwsza wizyta nie jest opóźniona;
  - pomija kotwice, linki zewnętrzne, nowe karty i modyfikatory; obsługuje powrót „wstecz” (bfcache); przy reduced-motion jest wyłączona;
  - sprawdzone w Chromium i WebKit (1440 i 390).
- Naprawiony błąd: zamknięte menu mobilne przechwytywało kliknięcia na telefonie (np. przycisk w hero). Przyczyna: `z-index` headera dodany przy wdrożeniu hero. Teraz zamknięte menu ma `visibility: hidden`.
- Diagnoza skoków scrolla diagramu: `docs/homepage-v2/SCROLL-DIAGNOZA.md`. Poprawka czeka na akceptację.
- Naprawa scrolla diagramu wdrożona:
  - bez teleportu i hamulca kółka;
  - pin tworzony wcześniej;
  - płynne, niewidoczne zakończenie na desktopie i mobile.
  - Droga do kart: 4,33 vh (1440), 5,21 vh (390). Szczegóły i pomiary w `SCROLL-DIAGNOZA.md`.
