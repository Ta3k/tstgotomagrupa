# Diagnoza skoków przy scrollu diagramu (2026-09-24)

Pomiar: build produkcyjny, Playwright (Chromium). Log `scrollY` w każdej klatce plus zdarzenia: tworzenie triggerów, zmiany wysokości strony, `ScrollTrigger.refresh`, `window.scrollTo`, `preventDefault` na wheel.
Scenariusze:
- desktop 1440×900: kółko 100 px / 110 ms, szybkie kółko 14×500 px w dół i w górę, PageDown, gładzik;
- mobile 390×844: przeciągnięcia palcem (touch).

Skrypt: `docs/homepage-v2/baseline/scripts/probe.mjs`.

## Przyczyny (w kolejności wagi)

1. **Teleport po zakończeniu sekwencji** (`completeDesktopStory` / mobile w `site/js/common.js`).
   - Po końcu pinu: `storyTrigger.kill(true)` i `window.scrollTo(0, storyStart)`. Strona przeskakuje o **−2180…−2220 px** w jednej klatce.
   - Występuje w każdym scenariuszu: kółko, gładzik, PageDown, dotyk na mobile.
   - Użytkownik wraca na początek sekcji i drugi raz przewija już statyczny diagram.
2. **Hamulec kółka** (`handleStoryWheel`).
   - Przy szybkim scrollu każde zdarzenie wheel dostaje `preventDefault` (14/14 w dół i 14/14 w górę), a strona jest przewijana własną animacją.
   - Skutek: szybki scroll w dół „grzęźnie” w pinie, a szybki scroll w górę zatrzymuje się na początku sekcji (y=901) zamiast wrócić na górę strony.
   - Na gładziku (flick) ten sam mechanizm może włączać się losowo, bo progi to odstęp < 56 ms i delta ≥ 48.
3. **Późne tworzenie pinu i przebudowa widocznej sekcji.**
   - Trigger powstaje dopiero, gdy sekcja wejdzie w środek okna (`initializeWhenNear`, rootMargin −20%). W tym momencie:
     - dodanie klas `scheme-scroll-story` / `scheme-mobile-scroll-story` zmienia układ sekcji na ekranie. Diagram przeskakuje o **~50 px** w górę (desktop 1440 i mobile 390), a na mobile jego wysokość spada z 1007 do 566 px;
     - wstawiany jest pin-spacer (+2160 px na desktopie, +2194 px na mobile);
     - `ScrollTrigger.refresh` wywołuje się dwa razy pod rząd.
   - Użytkownik widzi szarpnięcie sekcji, zanim zacznie się sekwencja.
4. **`scrub: 1`** (wygładzanie 1 s) we wszystkich animacjach powiązanych ze scrollem. Diagram jeszcze się rusza po zatrzymaniu przewijania, co przy bezwładności dotyku na telefonie potęguje wrażenie „pływania”. To nie jest skok, ale wpływa na odczucie.
5. **Ryzyko tylko na iOS (do potwierdzenia na urządzeniu).**
   - Końce pinów liczone są z `window.innerHeight` z `invalidateOnRefresh`, a `ScrollTrigger.config({ ignoreMobileResize })` nie jest ustawione.
   - Chowanie i pokazywanie paska adresu Safari może więc wywoływać refresh i przesunięcia w trakcie pinu.

## Proponowana naprawa (wdrożona 2026-09-24, wyniki niżej)

- Usunąć hamulec kółka (1:1 z decyzją D2).
- Zamiast teleportu: przy zakończeniu zdjąć pin i skorygować `scrollY` o wysokość usuniętego spacera w tej samej klatce. Obraz się nie przesuwa, sekwencja zostaje jednorazowa (D2).
- Tworzyć ScrollTrigger od razu po załadowaniu runtime, a stan „story” (klasy CSS) nakładać zanim sekcja pojawi się na ekranie. Jeden `refresh` zamiast dwóch.
- `scrub: .4–.6` zamiast 1 (desktop), na mobile `scrub: true` albo krótkie wygładzanie.
- `ScrollTrigger.config({ ignoreMobileResize: true })` oraz końce pinów liczone w stałej jednostce (`svh`), żeby pasek adresu iOS nie przesuwał pinu.
- Po poprawce powtórzyć ten sam pomiar. Cel: brak skoków > 160 px na klatkę i zero `preventDefault` na wheel.

## Wdrożenie i wyniki (2026-09-24)

Zmiany w `site/js/common.js` i `_sections.scss`:
- **Hamulec kółka usunięty w całości** (`handleStoryWheel`, `runScrollBrake`).
- **Bez teleportu.** `releaseStoryPin()` zdejmuje pin i koryguje `scrollY` tak, żeby sekcja została w tym samym miejscu okna. Zakończenie odpala się na `onComplete`, czyli gdy animacja po wygładzeniu faktycznie dojdzie do końca, a nie na `onLeave`.
- **Ostatnia klatka = stan statyczny.**
  - Desktop: nagłówek wraca, diagram bez przygaszenia do 18%.
  - Mobile: diagram i nagłówek jadą na dokładną pozycję i skalę z normalnego układu (`measureNatural`, ponawiane przy `refreshInit` z pominięciem inline stylów pinu).
  - Na mobile scena ma wysokość sekcji z normalnego układu, a arkusze są kotwiczone do dołu ekranu (`--story-extra`), więc treść pod sekcją się nie przesuwa.
- **Pin tworzony od razu po załadowaniu runtime** (`initializeStoryNow`), gdy sekcja jest jeszcze pod ekranem.
- `scrub` zmniejszony: desktop 1 → 0,6, mobile 1 → 0,4.
- `ScrollTrigger.config({ ignoreMobileResize: true })`.

Pomiar po zmianach (ten sam `probe.mjs`):

| Scenariusz | Przed | Po |
|---|---|---|
| Przesunięcie widocznej treści przy końcu sekwencji (desktop, kółko / PageDown) | skok −2200 px, zmiana wyglądu sekcji | **0 px** (diagram, nagłówek, karty w tym samym miejscu okna) |
| To samo, mobile (dotyk, PL/EN) | skok −2220 px | **0 px** |
| Szarpnięcie sekcji przy starcie sekwencji | ~50 px (desktop i mobile), zmiana wysokości diagramu na mobile | **brak** |
| `preventDefault` na wheel przy szybkim scrollu | 14/14 zdarzeń, utknięcie na początku sekcji przy szybkim scrollu w górę | **0**, natywny scroll |
| Powtórzenie sekwencji po przewinięciu w górę | nie | nie (jednorazowa, D2) |
| Droga do kart marek (1920 / 1440 / 390) | 5,19 / 5,44 / 6,2 vh | **4,17 / 4,33 / 5,21 vh** |

Uwaga: `scrollY` nadal zmienia się o wysokość zdjętego pin-spacera (~2160 px). To korekta pozycji, niewidoczna dla użytkownika (zmienia się tylko położenie paska przewijania).

Sprawdzone:
- Chromium, WebKit i Firefox (1440, 390, PL/EN): sekwencja kończy się, bez błędów i poziomego scrolla.
- Obrót telefonu w trakcie sekwencji kończy ją poprawnie, bez błędów.
- Reduced-motion: brak pinu.

Do potwierdzenia na prawdziwym iPhonie: płynność scrubu przy bezwładności oraz zachowanie przy chowaniu paska adresu.
