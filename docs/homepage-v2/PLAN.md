# Homepage v2: plan zmian

Podstawa: audyt w `AUDIT.md`. Punkt wyjścia to **localhost (HEAD), nie stage**. Localhost ma już decyzję CEO o 2 krokach sekwencji, nowe hero, lokalne zasoby i Lighthouse 83–85 (stage: 50–57). Stage z 12 krokami traktujemy jako referencję zachowań (panel, zoom, trasa), nie jako bazę kodu.

## Decyzje właściciela (2026-09-23), obowiązują przed resztą planu

- **D1: zatwierdzone.** Tempo z tabeli poniżej. Kryterium nadrzędne: ma wyglądać po prostu dobrze.
- **D2: sekwencja wykonuje się raz.**
  - Po zakończeniu nie odtwarza się przy scrollu w górę ani ponownie w dół. Diagram zostaje statyczny i interaktywny.
  - Hamulec kółka usuwamy (scroll-jacking).
  - Teleport zastępujemy zdjęciem pinu z kompensacją `scrollY` o wysokość usuniętego pin-spacera. Widok się nie przesuwa, a użytkownik jedzie dalej od tego samego miejsca, bez cofania o ~2100 px.
- **D3:** link w czasie pinu ma teksty „Przejdź do marek” (PL) i „Skip to our brands” (EN). Dodać do `site/_data/{pl,en}`.
- **D4:** mobile ma krótki pin (≤ 1,2 vh), jednorazowy jak na desktopie.
- **D5: hero do przeprojektowania.** Ani wstęga, ani obracający się torus nie są wystarczające. Cel: efekt „wow” przy szybkim wczytaniu. LCP to tekst, bez czekania na JS. Grafika CSS/SVG albo lekki canvas ładowany po LCP. Bez ciężkiego WebGL i wideo.
- **D6: poprawić linki.**
  - (a) PL custom → GOTOMA S.H.: `https://www.gotoma.pl/`;
  - (b) GOTOMA General wszędzie `https://www.gotomageneral.com/` (EN: `/en/`), także w headerze;
  - (c) Codarius EN zostaje przy `/cennik`: nie ma wersji EN (`/en`, `/en/cennik`, `/en/pricing` dają 404);
  - (d) `https://main.pl/en/`;
  - (e) softlike wszędzie `https://softlike.pl/`, bo `softlike.com` nie odpowiada.
- **D7: poprawić teksty PL w EN.**
  - `aria-label` zamknięcia arkusza: „Zamknij” / „Close”.
  - Fallback etykiety partnerów bierzemy z danych językowych.
  - Alty ikon: tytuły obszarów z danych.
  - „Back to top” / „Przewiń do góry”.
- **D8:** `noindex, nofollow` zostaje na sztywno. Ta gałąź i repo trafiają tylko na stage, a produkcja ma własne wartości.
- **D9:** usunąć `site/collections/_pages/index_pl.html`. Jedyne odwołania są w warunkach `runtime-scripts.html`, do uproszczenia.
- **D10:** workflowy CI bez zmian.
- **D11:** lista do sprawdzenia na prawdziwym iPhonie zostaje w raporcie końcowym.

Poprawki z D6, D7 i D9 to zmiany wyłącznie w danych i drobnych szablonach. Robimy je na początku Etapu 2, zanim testy zapiszą oczekiwane linki.

## Zasada ogólna

Rozwijamy istniejący kod `common.js` (matchMedia, funkcyjny layout, zoom na `.scheme-diagram`, panel `aside`, rysowana trasa, bottom-sheety). Nie przepisujemy go od zera. Przebudowa obejmuje tylko te fragmenty, które łamią Brief:

- teleport po zakończeniu sekwencji;
- scroll-jacking kółkiem;
- leniwe tworzenie pinu (psuje anchory i fokus);
- animowanie `width` i `clip-path`.

## Proponowane tempo (zastępuje „12 kroków / 300–420 vh” z Briefu, do zatwierdzenia)

Desktop 1440×900:

| Faza | Teraz | Cel |
|---|---|---|
| Hero → diagram (hero collapse) | pin 0,82 vh | bez pinu: scrub na zwykłym scrollu, ≤ 0,6 vh |
| Wejście w diagram (całość → zoom na krok 1) | ~0,5 vh w pinie | ≤ 0,4 vh |
| Krok 1 (Finansowanie) + krok 2 (Sklepy) | ~1,3 vh, opis widoczny tylko przez ~40% czasu | 2 × ~0,45 vh, opis widoczny ≥ 70% czasu kroku |
| Wyjście (zoom out do całego diagramu + CTA do marek) | ~0,6 vh + teleport | ≤ 0,4 vh, bez teleportu |
| **Pin diagramu razem** | **2,4 vh** | **≈ 1,6–1,8 vh** |
| **Droga do kart marek (travel)** | **5,44 vh** | **≤ 4,0 vh** (Brief: ≤ 6) |

- 1920×1080: te same wartości w vh.
- Mobile 390×844: pin ≤ 1,2 vh (teraz 2,6) albo brak pinu (patrz decyzja D4). Droga do kart ≤ 4,5 vh (teraz ~6,2).
- Po zakończeniu sekwencji diagram zostaje na miejscu w stanie „cały diagram”, interaktywny (hover, focus, tap na każdym z 12 obszarów). Zgodnie z D2 sekwencja jest jednorazowa, bez replay i bez teleportu (kompensacja `scrollY`).
- W trakcie pinu (przed zakończeniem) scrub reaguje normalnie w obie strony.

## Plan per sekcja

**Etap 2: siatka testów (bez zmian wyglądu).** Zakres zgodnie z promptem. Testy „12 kroków” dostosowujemy do 2 kroków sekwencji i 12 obszarów dostępnych statycznie (spójność z danymi, klawiatura, reduced-motion).

**Infrastruktura (poprawki techniczne na początku Etapu 3, każda osobnym commitem):**
- Odblokować `site/js/vendor/` w `.gitignore` (`!site/js/vendor/`) i dodać pliki GSAP, ScrollTrigger i cookiedialog do repo. Bez tego CI zbuduje stronę bez JS.
- W `runtime-scripts.html` dodać obsługę błędu ładowania, żeby menu, arkusze i tooltipy działały bez GSAP. `common.js` już sprawdza `typeof gsap`.
- Fonty:
  - preload `poppins-400-latin` (i ewentualnie 300);
  - `font-display: swap` z fallbackiem dopasowanym metrycznie (`size-adjust`), żeby nie było CLS;
  - fallback `sans-serif` wszędzie, gdzie jest samo `Poppins` (`blog-card.scss` l.144, 172, 250).
  - Zmianę pilnujemy Lighthouse'em (LCP h1).
- `ScrollTrigger.refresh()` po `document.fonts.ready` i po załadowaniu obrazów w diagramie. Obsługa `orientationchange`.

**Hero (Etap 3):**
- Nowa kompozycja „wow” (D5) zamiast wstęg i torusa. Kolorystyka i złoty akcent zostają. Tekst hero pozostaje elementem LCP. Grafika nie blokuje renderu (CSS/SVG, ewentualnie lekki canvas po LCP).
- Mocniejsza kompozycja: tytuł wyżej i wyraźniej, mniej pustki nad tekstem (na 1440 tekst zaczyna się ~450 px, banner cookies go zasłania). Złota linia prowadzi wzrok do nagłówka diagramu.
- Efekt „CRT collapse” bez pinu albo usunięty, jeśli nie obroni się w przeglądzie.
- Zdjąć opóźnienie renderu h1 (~2 s). `hero-motion-active` nie może blokować niczego, co widać bez interakcji.

**Diagram desktop (Etap 4):**
- Zostaje: matchMedia, `getLayout`/`getFocus`, zoom transformem, panel, trasa `strokeDashoffset`, 2 kroki.
- Przebudowa:
  1. Usunąć `handleStoryWheel` (scroll-jacking). W `completeDesktopStory` zostaje jednorazowość (D2), ale `window.scrollTo(0, storyStart)` zastępujemy kompensacją: `scrollY -= wysokość usuniętego spacera`. Timeline kończy się stanem „cały diagram”.
  2. Tworzyć ScrollTrigger od razu po załadowaniu runtime, a nie przy -20% viewportu. Przestrzeń pinu rezerwować w CSS, żeby wysokość strony była stała od początku. To naprawia anchory i gubienie fokusu.
  3. Zamiast `width`/`clip-path` użyć transformu na `.scheme-story__visual`.
  4. Ponownie mierzyć węzły przy refreshu.
  5. Licznik „01/02” renderować poprawnie w Liquid (dziś Liquid wypisuje „12”, JS nadpisuje).
  6. Link „Pomiń / przejdź do marek” widoczny w czasie pinu (tekst czeka na decyzję D3).
  7. Większy i stabilny panel opisu, ostrzejsze napisy przy zoomie (mniejszy max scale albo `will-change` tylko podczas animacji), mniej `drop-shadow` w trakcie skalowania.
- Klawiatura:
  - linki partnerów bezpośrednio po węźle (DOM) albo `aria-controls` z tooltipem, który nie znika, gdy fokus przejdzie na jego linki;
  - `aria-expanded` na węzłach;
  - Esc zamyka tooltip.
- Reduced motion: statyczny diagram plus lista wszystkich 12 obszarów z opisami i partnerami, widoczna bez interakcji (np. rozwijana pod diagramem). Treści bez zmian, z danych `tooltips`.
- Tooltip nie może przykrywać sąsiednich węzłów.

**Diagram mobile (Etap 4):**
- Zostaje koncepcja: diagram 382×1210, kolory i linie, bottom-sheety z partnerami.
- Zmiany:
  - krótsza sekwencja albo brak pinu (D4);
  - bez teleportu;
  - diagram nie zmniejszany do ~0,45 (dziś ~170 px szerokości, nieczytelny);
  - arkusz: fokus do środka i powrót, `aria-label` z danych językowych, bez przepisywania `aria-hidden` w każdej klatce;
  - `svh`/`dvh` sprawdzone w WebKit.

**Karty marek (Etap 5):**
- Jeden link na kartę (rozciągnięty link, zamiast 4 przystanków Tab).
- Widoczny `:focus-visible`, hover i tap z mikroruchem.
- Wejście powiązane z wyjściem z diagramu.
- Proporcje dopasowane tak, żeby nagłówek i 3 karty mieściły się na 1280×800.
- Kolejność (Codarius, GOTOMA S.H., GOTOMA General) i domeny bez zmian do decyzji D6.

**Liczby, klienci, partnerzy, rozwiązania (Etap 6):**
- Obecne wejścia scrub są w porządku. Wyciszamy je: mniejsze przesunięcia, bez `rotationX`.
- Poprawka overflow przy 1280 px: `x:110` na `.slider-container` zamienić na ruch wewnątrz przyciętego kontenera.
- Marquee z regułą reduced-motion. Liczniki liczb z wartością obecną w HTML od początku.

**Utwardzanie (Etap 7):**
- Przycisk „do góry”: widoczna ikona, etykieta PL/EN.
- SEO: hreflang na homepage (`translation_url`), canonical PL = `/`, `og:image`, tytuł OG.
- `noindex` warunkowo (D8).
- Duplikat `/index_pl.html` (D9).

## Ryzyka

1. **Brief kontra decyzja CEO.** Cele liczbowe i testy z Briefu zakładają 12 kroków. Bez zatwierdzenia nowych liczb (D1) testy Etapu 2 będą raportować „niezgodność”.
2. **Pin plus leniwie ładowany runtime.** GSAP ładuje się po `load`, więc pin-spacer pojawia się późno. Rozwiązanie z rezerwacją miejsca w CSS trzeba dobrze przetestować (CLS przy scrollu, anchory, powrót „wstecz” w przeglądarce).
3. **iOS Safari:** zmienna wysokość paska adresu przy pinie, `backdrop-filter`, `svh`/`dvh`. Emulacja WebKit to tylko przybliżenie.
4. **Fonty:** przejście z `optional` na `swap` może pogorszyć LCP i CLS. Wymaga pomiaru i fallbacku z `size-adjust`.
5. **Vendor w repo:** do czasu poprawki `.gitignore` każdy deploy z CI jest bez JS.
6. **Dwa workflowy deploy na push do `main`** (`.github/workflows/deploy.yml` na przestarzałych akcjach v2/v3 i `jekyll.yml`). Mogą się ścigać albo jeden będzie padał. Nie dotyczy tej gałęzi, bo nie robimy push.
7. **Wydajność efektów:** `drop-shadow` i `backdrop-filter` przy skalowaniu na średnim telefonie. Kontrola Lighthouse'em i profilem w Etapie 4.

## Sprawy do decyzji właściciela

- **D1. Nowe cele liczbowe dla sekwencji 2-krokowej.** Proponuję: pin desktop ≈ 1,6–1,8 vh, droga do kart ≤ 4,0 vh (desktop) i ≤ 4,5 vh (mobile), pin mobile ≤ 1,2 vh. Zatwierdzasz te liczby w miejsce „300–420 vh / 12 kroków”?
- **D2. Usunięcie teleportu i „hamulca” kółka.** Sekwencja byłaby odwracalna, bez jednorazowego „zakończenia”. Tak?
- **D3. Tekst linku „Pomiń / przejdź do marek”.** Nie ma go w tłumaczeniach. Podaj PL i EN (albo zgoda na „Przejdź do marek” / „Skip to our brands”).
- **D4. Mobile: krótki pin (≤ 1,2 vh) czy brak pinu.** Bez pinu 2 kroki pokazujemy jako podświetlenie i otwarty arkusz przy przewijaniu. „Droga nie dłuższa niż obecnie” liczyć względem localhost (~6,2 vh) czy produkcji (~2,6 vh)?
- **D5. Hero:** zostają wstęgi (obecny localhost) czy wracamy do złotego torusa z produkcji i stage? Jest snapshot `hero-versions/`.
- **D6. Linki (AUDIT §5):**
  - (a) link GOTOMA S.H. w PL „Aplikacje custom”: `https://www.gotoma.pl/`?
  - (b) GOTOMA General: `.com` wszędzie?
  - (c) Codarius EN: zostaje `/cennik`?
  - (d) `main.pl//en/` → `main.pl/en/`?
  - (e) softlike EN: `.pl` czy `.com`?
- **D7. Teksty PL w wersji EN.** `aria-label` „Zamknij”, „Partnerzy obszaru:”, alty ikon. Mogę użyć istniejących odpowiedników EN z danych, np. `partners_label` EN i tytuły obszarów jako alty. Na „Zamknij” / „Close” potrzebuję zgody.
- **D8. `noindex, nofollow`.** Zostawić na sztywno (stage) czy uzależnić od konfiguracji, żeby nie przeszedł na produkcję?
- **D9. Duplikat `/index_pl.html`.** Usunąć albo przekierować?
- **D10. Workflowy CI.** Zostawić oba czy usunąć przestarzały `deploy.yml`? Tylko zgłaszam, nie ruszam.
- **D11. Do potwierdzenia na prawdziwym iPhonie** (po Etapie 4): pin i pasek adresu, płynność scrubu i momentum, bottom-sheet z `backdrop-filter`, fonty przy pierwszej wizycie.
