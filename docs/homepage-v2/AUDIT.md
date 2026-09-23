# Homepage v2: audyt (Etap 1)

Data: 2026-09-23. Gałąź `feature/homepage-v2` (od `c376a8d`). Kod strony nie był zmieniany.
Surowe dane: `docs/homepage-v2/baseline/` (Lighthouse, pomiary Playwright, link-check, skrypty).

## 0. Najważniejsze wnioski

1. **Trzy różne wersje strony.**
   - Produkcja (grupagotoma.pl) to starszy kod z innego repo: złoty torus w hero, bez przypiętego diagramu.
   - Stage (zwieksz-sprzedaz-online.pl) = `origin/main` (1127d14): `common.js` identyczny bajt w bajt.
   - Localhost = HEAD (`c376a8d`). To stage + menu i podstrony (faa7202, bf3826b, 1a0288d) + WIP „temp changes”: nowe hero z wstęgami, 2-krokowa sekwencja diagramu, lokalne fonty i GSAP, ładowanie runtime po `load`.
2. **Sekwencja diagramu ma 2 kroki (finance → shops), nie 12.** To decyzja CEO, potwierdzona przez właściciela. Stage ma jeszcze 12 kroków i pin 8,84 vh (desktop) / 13,3 vh (mobile).
3. **Po zakończeniu sekwencji jest teleport.** `completeDesktopStory` / mobile: `storyTrigger.kill(true)` i `window.scrollTo(0, storyStart)`. Użytkownik zostaje cofnięty o ~2100–2600 px na początek sekcji. Dotyczy też klawisza End: kończy na y=1784 zamiast na dole strony.
4. **Twardy scroll-jacking kółkiem.** `handleStoryWheel` robi `preventDefault` i własny lerp. Seria 15 × 1200 px kółkiem przesuwa stronę tylko o ~1900 px i nie wypuszcza z pinu. Narusza Brief.
5. **Pliki GSAP/ScrollTrigger/cookiedialog nie są w repo.** `site/js/vendor/*.js` łapią się na regułę `vendor` w `.gitignore`. Build w CI nie będzie miał GSAP. Skutek: `loadScript` rzuca wyjątek, `common.min.js` się nie ładuje, więc nie działa menu mobilne, diagram, arkusze ani przycisk „do góry”.
6. **Fonty przy pierwszej wizycie.**
   - Wszystkie `@font-face` mają `font-display: optional`, a preloadowana jest tylko waga 600. Poppins 300/400 praktycznie nigdy nie renderuje się przy pierwszej wizycie (zmierzone przez CDP: hero i węzły w Arial).
   - `.c-blog-card__excerpt` ma `font-family: Poppins` bez fallbacku, więc opisy kart marek są w Times New Roman.
7. **Klawiatura gubi fokus na diagramie.** Tab z przycisku hero trafia na przycisk diagramu. Scroll tworzy pin (reparent do `pin-spacer`) i fokus spada na `<body>`. Następny Tab trafia już do kart marek, które mają fokus poza ekranem. Węzły są osiągalne dopiero ok. 90. Tabem.
8. **Anchory do kart nie działają.** Przycisk „Dowiedz się więcej” (`#dowiedz-sie-wiecej`) i wejście z hashem lądują w diagramie (pin p=0,04–0,15), a karty są ~1000–1300 px niżej. Powód: pin-spacer powstaje leniwie (`initializeWhenNear`, rootMargin -20%) i zmienia wysokość strony w trakcie przewijania do anchora.

## 1. Mapa repo (homepage PL/EN)

Wszystkie komponenty są wspólne dla PL i EN. Treść pochodzi z `site/_data/{pl,en}/projects.yml`, a karty marek z postów filtrowanych po `lang`.

| Obszar | Pliki |
|---|---|
| Strony | `site/collections/_pages/index.html` (serwowana jako `/`), `index_pl.html` (`/index_pl.html`, duplikat), `home_en.html` (`/en/`). Kolejność bloków: hero → how-it-works → blog-section (marki) → projects-section (liczby, klienci, banery) → partners → solutions |
| Layout | `site/_layouts/default.html` (head, header, bookshop blocks, scroll-top, footer, runtime-scripts, CookieDialog+GA). `_layouts/pl|en/default.html` są nieużywane |
| Head/SEO | `site/_includes/head.html`: robots `noindex, nofollow` na sztywno (l.5), canonical (l.9), hreflang tylko przy `translation_url` (l.10-13), preload tylko poppins-600 (l.27-29) |
| Header | `site/_includes/header.html`, dane `site/_data/{pl,en}/navigation.yml` |
| Skrypty | `site/_includes/runtime-scripts.html`: homepage po `load` i 2×rAF ładuje sekwencyjnie gsap → ScrollTrigger → `common.min.js` (bez fallbacku). Klasa `hero-motion-active` dopiero po pierwszej interakcji |
| JS | `site/js/common.js` → `common.min.js` (esbuild, `npm run build:js`). `site/js/scripts.js` nie jest ładowany na homepage |
| CSS | `site/assets/main.scss` → `{% bookshop_scss %}`: `component-library/shared/styles/**` + `component-library/components/*/*.scss` → `/assets/main.css` (117 KB) |
| Hero | `component-library/components/hero/hero.jekyll.html`, `hero.scss`; JS `initializeHeroCollapse` (`common.js` ~649-739); snapshoty wersji w `hero-versions/` |
| Diagram | `component-library/components/how-it-works-section/how-it-works-section.jekyll.html`: desktop `.scheme-desktop` l.5-339 (12 przycisków: finance + 11 `.scheme-node`, SVG połączeń na sztywno, `aside.scheme-story__content` z 12 tooltipami); mobile `.scheme-mobile` l.340-643 (diagram 382×1210, bottom-sheety). SCSS: `component-library/shared/styles/3-modules/_sections.scss` (desktop 692-1107, tooltipy 1108-1316, scroll story 1377-1608, mobile 1609-2430). JS: `common.js` 769-1240 desktop, 1243-1545 mobile, 1548-1742 tooltipy/arkusze, canvas kropek 6-205. Dane: `projects.yml` → `tooltips` (12 obszarów) |
| Karty marek | `component-library/components/blog-section/*`, `component-library/components/blog-card/*` (4 linki do tego samego URL na kartę); dane `site/collections/_posts/2018-11-1{1,2,3}-*-{pl,en}.markdown` |
| Liczby, klienci, banery | `component-library/components/projects-section/projects-section.jekyll.html` (12 logotypów klientów na sztywno), `_sections.scss` 26-170, 314-556 |
| Partnerzy | `component-library/components/partners-section/*` (marquee CSS, lista renderowana 2×), dane `slider_partners` (21) |
| Rozwiązania | `component-library/components/solutions-section/*`, dane `solutions` (11), `/images/solutions/*.png` |

## 2. Produkcja vs stage vs localhost

Zrzuty: 6 szerokości × PL/EN × 3 środowiska (Chromium). Wyniki w `baseline/playwright/survey.json`.

- **Localhost ≠ stage.**
  - Inne hero: wstęgi SVG zamiast złotego torusa. Nowe menu z dropdownami „Nasze firmy”/„Usługi” i logo ERP Factory.
  - Diagram ma 2 kroki zamiast 12. GSAP i fonty są lokalne (stage bierze je z CDN i Google Fonts).
  - Ładowanie JS jest odroczone, a efekt „CRT collapse” hero jest przypięty na 0,82 vh.
- **Stage vs produkcja.** Stage dodaje przypięty diagram z 12 krokami, panel opisu i animacje sekcji. Treści, liczby i kolejność sekcji są te same.
- **Produkcja:** atrybut `id="jak-to-dziala class="` jest uszkodzony (brak cudzysłowu), więc anchor diagramu nie działa. `<html lang="en">` na PL.
- **Wspólne dla wszystkich:**
  - Poziomy scroll przy 1280 px: 42 px na local/stage, 28 px na prod. Źródło: `.slider-container` partnerów przesunięty przez GSAP `x:110` (`common.js` ~539).
  - Przy 1280×800 karty marek są wyższe niż viewport.
- Na localhost i stage nie ma błędów konsoli. Jedyny nieudany request na prod i stage to przerwany beacon GA (bez znaczenia).
- **Przycisk „do góry” (`.top`) to pusty biały krąg.** Chevron w `currentColor` ma ten sam kolor co tło. Jego `aria-label` jest po angielsku także na PL.

## 3. Animacje (localhost)

- GSAP i ScrollTrigger **3.12.5** z `/js/vendor/`, ładowane po `load` (patrz tabela). `gsap.matchMedia` jest używane dla choreografii (reduced-motion), desktopu (≥1024) i mobile (≤1023, bez reduced motion).
- **Triggery:**
  - Hero: `pin`, `scrub:true`, end `+=innerHeight*0.82`. Start przesuwa się z 216 na 136 po refreshu.
  - Diagram desktop: `pin`, `scrub:1`, end `+=innerHeight*2.4` (`common.js:945`), `anticipatePin`, `invalidateOnRefresh`. Mobile: end `+=innerHeight*2.6` (`common.js:1408`).
  - ~10 triggerów choreografii sekcji (`scrub:1`, bez pinu): clip-path sekcji, wejście kart klientów, banerów, partnerów, rozwiązań, kart marek.
  - Nie ma `snap` ani linku „pomiń”.
- **Mechanika desktop:**
  - Węzły mierzone raz (`getBoundingClientRect`, bez ponownego pomiaru). `getLayout`/`getFocus` to wartości funkcyjne, przeliczane przy refreshu.
  - Zoom: transform na `.scheme-diagram`. Panel to `aside[aria-live=polite]`, przełączany przez autoAlpha.
  - W trakcie animowane są `width` i `clip-path` na `.scheme-story__visual`, co wymusza layout w każdej klatce.
  - Licznik: Liquid wypisuje „12”, JS nadpisuje na „02”.
- **Mechanika mobile:**
  - Diagram 382×1210 skalowany do `min((w-30)/382, (h-top-bottom)/1210, .78)`. Przy 390×844 daje to ~0,45, czyli diagram szeroki na ~170 px. Mieści się, bo jest zmniejszony, ale jest nieczytelny.
  - Zoom do 1,05–1,25. Bottom-sheety `max-height:min(43svh,390px)` z `backdrop-filter: blur(18px)`.
  - Po sekwencji ten sam teleport co na desktopie. `syncSheetAccessibility` nadpisuje `aria-hidden` w każdej klatce.
- **Sprzątanie:**
  - Funkcje revert w matchMedia są poprawne.
  - Brak `document.fonts.ready` i `orientationchange`. Kilka listenerów `resize`/`keydown` bez zdejmowania. Listener `scroll` przycisku „do góry” czyta `getBoundingClientRect` w każdym zdarzeniu.
- **Resize w trakcie sekwencji** (1440 → 1280 → 900 → 1440): stan wraca poprawnie, bez overflow i bez błędów. Przejście do mobile tworzy mobilny pin.
- **Koszt renderu:**
  - `drop-shadow` na wszystkich liniach i trasie diagramu skalowanego w każdej klatce.
  - `will-change` na 12 węzłach. `backdrop-filter` w tooltipach.
  - Canvas kropek 1024×768 w pętli rAF (pauzowany poza ekranem).
  - Przybliżone napisy węzłów są lekko rozmyte (skalowany raster).

## 4. Pomiary diagramu i drogi do kart

Metoda: kółko 100 px co 120 ms (Chromium). „Droga” to łączny przewinięty dystans do momentu, gdy karty marek są w pełni widoczne, z teleportem wliczonym.

| | pin diagramu | pin hero | droga do kart (travel) | pozycja kart (scrollY) |
|---|---|---|---|---|
| local 1920×1080 | 2592 px / 2,4 vh | 886 px | 5600 px / **5,19 vh** | 2,78 vh |
| local 1440×900 | 2160 px / 2,4 vh | 738 px | 4900 px / **5,44 vh** | 2,98 vh |
| local 1280×800 | 1920 px / 2,4 vh | 656 px | 4400 px / 5,50 vh | 3,09 vh |
| local 768 | 2662 px / 2,6 vh | 840 px | 6300 px / 6,15 vh | 3,52 vh |
| local 390×844 | 2194 px / 2,6 vh | 692 px | 5200–5300 px / **6,2 vh** | 3,5 vh |
| local 360×780 | 2028 px / 2,6 vh | 640 px | 4900 px / 6,28 vh | 3,61 vh |
| stage 1440 | 7956 px / 8,84 vh | – | 9700 px / 10,8 vh | – |
| stage 390 | 11225 px / 13,3 vh | – | 12900 px / 15,3 vh | – |
| prod 1440 / 390 | brak | – | 1,89 vh / 2,61 vh | – |

- **Zwykły scroll (1440):**
  - Pin trwa od 1784 do 3944 px. Panel pokazuje „Finansowanie” przez ~19–33% sekwencji, a „Sklepy internetowe” przez ~61–75%. Między nimi przez ~30% czasu żaden opis nie jest widoczny.
  - Przy 3900 px następuje teleport na 1784 px i trzeba jeszcze raz przewinąć statyczny diagram.
- **Szybki scroll:** 18 000 px kółkiem w dół daje stronę na 3739 px (pin p=0,91), bez wyjścia z sekcji. W górę: tylko do p=0,53. To scroll-jacking.
- **Klawiatura:**
  - PageDown i Space: karty po 7 naciśnięciach, ale z teleportem o ~2100 px.
  - End: zamiast dołu strony kończy na y=1784 (teleport).
  - Home: OK.
- **Tab:** zgubiony fokus (pkt 0.7). Karty marek mają po 4 linki na kartę, czyli 12 przystanków. Fokus jest widoczny (outline) na wszystkich przystankach.
  - Linki partnerów w tooltipach desktopu są osiągalne tylko w teorii: tooltip ukrywa się po blur węzła.
- **Reduced motion:** pinów brak, diagram statyczny. Opisy pokazują się tylko po hover/focus, a bez interakcji żaden z 12 opisów nie jest widoczny.
  - Hover na część węzłów pokazuje tooltip sąsiada (WMS dla TMS/ERP, SPRZĘT dla MES/PIM). Tooltip przykrywa sąsiednie węzły. Do weryfikacji w Etapie 2.
  - Marquee partnerów nie ma reguły reduced-motion.
- **Mobile:**
  - Pixel 7 (Chromium) i iPhone 13 (WebKit): pin 2,6 vh, potem teleport ~1700–2100 px. Karty po ~5,1 vh drogi (Pixel).
  - Tap na węzeł otwiera arkusz i blokuje scroll body. Błędów i overflow brak.
  - Arkusz nie przenosi fokusu i nie ma pułapki fokusu. `aria-label="Zamknij"` jest po polsku także w EN.

## 5. Linki i partnerzy

Pełna lista (kod HTTP, docelowy URL): `baseline/playwright/linkcheck.tsv`. Wszystkie linki zewnętrzne odpowiadają 200, `softlike.com` i `karpatiabs.pl` nie odpowiedziały z automatu. Wewnętrzne linki PL/EN dają 200. `/kontakt/` (404) jest tylko w zakomentowanym HTML.

Przypisania partnerów są zgodne PL↔EN w 12/12 obszarach:

| Obszar | Partnerzy |
|---|---|
| shops | Codarius, GOTOMA S.H. |
| security | spiree, GOTOMA GENERAL |
| finance | Karpatia, PragmaGO, Evoluma, elpartners |
| leads | Codarius, Moonwise, Ad Astra, smart hub |
| crm | Raynet, GOTOMA S.H. |
| wms | Optidata, GOTOMA S.H., so simple |
| tms | Optidata, GOTOMA S.H. |
| erp | enova365, ERP Factory, GOTOMA S.H. |
| hardware | Netige, Atman, Main, GOTOMA S.H. |
| mes | GOTOMA S.H. |
| pim | Ergonode, Pimcore, GOTOMA S.H. |
| custom | GOTOMA S.H., softlike |

Rozbieżności do potwierdzenia (niczego nie poprawiałem):
1. **PL custom → GOTOMA S.H. nie ma `href`** (`site/_data/pl/projects.yml` ~493). Renderuje się jako `href=""` (2×). EN ma `https://gotoma.pl/en/`.
2. **GOTOMA General ma dwie domeny.** Header (`navigation.yml`) używa `www.gotomageneral.pl` (301 → .com). Karty i diagram używają `gotomageneral.com`.
3. **Codarius w EN** (karta i header) prowadzi do `https://www.codarius.com/cennik`, czyli polskiego cennika. Czy istnieje wersja EN?
4. **Main w EN:** `https://main.pl//en/` (podwójny slash) w `slider_partners`.
5. **softlike:** diagram używa `softlike.pl` w obu językach, a slider EN `softlike.com` (nie odpowiada).
6. **Drobne niespójności www i domen w EN** (crm, security, custom). Raynet i PragmaGO w EN mają domeny .com, co wygląda na celowe.
7. **Teksty PL w EN:** `aria-label="Zamknij"`, fallback „Partnerzy obszaru:”, alty ikon diagramu („Finansowanie”, …). Z kolei `aria-label="Back to top"` jest po angielsku w PL.
8. **Brak tłumaczenia „Pomiń / przejdź do marek”** w `site/_data/**`.
9. **SEO:**
   - Na homepage nie ma hreflang (brak `translation_url`). Canonical PL wskazuje `https://www.grupagotoma.pl/index` zamiast `/`. `og:image` jest puste. Tytuł OG jest zdublowany: „Grupa GOTOMA – Grupa GOTOMA”.
   - `noindex, nofollow` jest na sztywno w `head.html`. Na stage to OK, ale nie może trafić na produkcję.
   - Duplikat `/index_pl.html`.

## 6. Bazowa wydajność (Lighthouse 13.5 mobile, mediana z 3 przebiegów)

Local = build produkcyjny (`JEKYLL_ENV=production`) serwowany statycznie. Dane w `baseline/lighthouse/summary.json`.

| | Perf | FCP | LCP | TBT | CLS | JS | CSS | Obrazy | Fonty | Requesty | Razem |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **local PL** | **83** (82/83/83) | 1,53 s | **4,33 s** | **19 ms** | **0** | 58 KB | 21 KB | 416 KB | 36 KB | 61 | 548 KB |
| **local EN** | **85** (88/85/84) | 1,38 s | **4,17 s** | **16 ms** | **0** | 58 KB | 21 KB | 414 KB | 24 KB | 59 | 534 KB |
| prod PL | 54 | 3,04 s | 6,40 s | 503 ms | 0 | 230 KB | 20 KB | 762 KB | 35 KB | 100 | 1090 KB |
| prod EN | 70 | 2,17 s | 4,31 s | 442 ms | 0,009 | 230 KB | 20 KB | 760 KB | 24 KB | 98 | 1078 KB |
| stage PL | 50 | 3,07 s | 6,89 s | 683 ms | 0 | 250 KB | 21 KB | 531 KB | 35 KB | 94 | 881 KB |
| stage EN | 57 | 2,98 s | 7,09 s | 368 ms | 0 | 250 KB | 21 KB | 530 KB | 24 KB | 92 | 868 KB |

- **Wyjściowy punkt odniesienia do limitów z Briefu to local PL/EN.**
- LCP local to `h1.c-hero__title`, z „element render delay” ~1,8–2,0 s: tekst czeka na CSS i fonty. Prod i stage mają LCP na obrazku `abstract-object.webp` z `loading="lazy"`.
- Lighthouse nie przewija strony, więc CLS=0 nie obejmuje wstawiania pin-spacera. CLS przy scrollu mierzymy w Etapie 2.
