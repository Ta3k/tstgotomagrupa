# Hero v2: laboratorium koncepcji

Trzy działające prototypy nowego hero, PL i EN, desktop i mobile. Są to tymczasowe podstrony poza nawigacją i sitemapą, z `noindex`: `head.html` wstawia go na sztywno, zgodnie z D8. Pod każdym hero jest prawdziwa sekcja „Jak to działa?” i karty marek, więc widać przejście. W prawym dolnym rogu jest pasek labu (Obecne / A / B / C, PL / EN).

| | PL | EN |
|---|---|---|
| Obecne hero (kontrola, te same sekcje poniżej) | http://localhost:6060/hero-lab/0/ | http://localhost:6060/en/hero-lab/0/ |
| A „Zaćmienie” | http://localhost:6060/hero-lab/a/ | http://localhost:6060/en/hero-lab/a/ |
| B „Ekosystem” | http://localhost:6060/hero-lab/b/ | http://localhost:6060/en/hero-lab/b/ |
| B+ „Diagram jako hero” | http://localhost:6060/hero-lab/d/ | http://localhost:6060/en/hero-lab/d/ |
| C „Płynne złoto” (v2) | http://localhost:6060/hero-lab/c/ | http://localhost:6060/en/hero-lab/c/ |

Serwer dev uruchamia się przez `npm start`. Po deployu na stage te same ścieżki będą działać pod adresem zwieksz-sprzedaz-online.pl.

**Wspólne dla A, B i C:**
- Teksty są 1:1 z obecnej strony głównej (tytuł, lead, CTA, „Jak to działa?”). Zmieniłem tylko podział tytułu na linie. Żadna koncepcja nie wymaga zmiany tekstów.
- Nagłówek h1 jest elementem LCP i renderuje się bez JS. Brak nowych obrazów i requestów.
- Poppins 400 ma w labie `font-display: swap`, co naprawia Arial przy pierwszej wizycie (AUDIT §0.6).
- Hero wsuwa się pod header, a dolna krawędź wygasza się w czerń sekcji diagramu.
- Scroll ustawia `--hl-p` przez rAF, tylko gdy hero jest widoczne. Poza ekranem animacje CSS są pauzowane.
- Reduced motion daje statyczny, pełny kadr.

Kod: `site/_includes/hero-lab/{copy,base,bar,a,b,c}.html`, strony `site/collections/_pages/hero-lab-*.html`. Jedyna zmiana poza labem to flaga `homepage_runtime` w `site/_includes/runtime-scripts.html`: lab ładuje JS tak jak strona główna (po `load`), żeby pomiary były porównywalne.

---

## A. „Zaćmienie” (diamentowy pierścień)

**Idea.**
- Monumentalne złote zaćmienie: czarny dysk z koroną światła i rozbłyskiem „diamentowego pierścienia” z anamorficzną smugą.
- Nagłówek leży na czarnym dysku, co daje maksymalny kontrast i skupia uwagę.
- W pierwszej sekundzie obręcz się „zapala”, a przy scrollu zaćmienie zachodzi. Złota nić z dołu prowadzi do diagramu.

**Technika.**
- Czysty CSS: gradienty radialne i stożkowe, maski pierścienia, animacje wyłącznie `transform`/`opacity`.
- JS około 40 linii, tylko postęp scrolla i delikatna paralaksa kursora (desktop).
- Mobile ma własną kompozycję: łuk zaćmienia u góry, tekst w cieniu dysku, bez obrotu smug.

**Koszt.**
- ~5,5 KB gzip (z bazą), 0 requestów.
- Lighthouse mobile (mediana ×3): PL 89 / EN 88, kontrola 90 / 90. LCP 3,71 / 3,88 s (kontrola 3,56 / 3,62 s), TBT 0 / 44 ms, CLS 0.
- W spoczynku (mobile, CPU ×4): ~+150 ms/s pracy wątku głównego ponad kontrolę. Na desktopie ~+35 ms/s.

**Ryzyka na iOS Safari.**
- Duże warstwy z `mask-image` (prefiks `-webkit-` jest dodany) mogą zużywać pamięć GPU. Na telefonie wyłączyłem stały obrót smug.
- `svh` wymaga iOS 15.4+ (fallback to `vh`).
- Niskie ryzyko ogólnie: brak WebGL, brak `offset-path`.

## B. „Ekosystem” (złota płytka)

**Idea.**
- Hero od razu zapowiada diagram: złota „płytka” w perspektywie z 12 obszarami. Nazwy pochodzą z danych diagramu. Obszary łączą ścieżki takie jak w diagramie, a po nich płyną impulsy światła i kolejne obszary się podświetlają.
- Przy scrollu płytka się prostuje i powiększa, przechodząc w prawdziwy diagram poniżej. Najmocniejsza narracja „wszystko połączone”.

**Technika.**
- HTML i inline SVG (ścieżki), CSS 3D (`rotateX`/`rotateZ` jednej warstwy), impulsy przez CSS `offset-path`, sekwencyjne podświetlenia przez `opacity`.
- JS tylko postęp scrolla.
- Mobile: płytka niżej i mocniej przycięta, 2 impulsy zamiast 4.

**Koszt.**
- ~6 KB gzip, 0 requestów.
- Lighthouse: PL 89 / EN 88, LCP 3,72 / 3,84 s, TBT 4 / 67 ms, CLS 0.
- **W spoczynku najdroższa: ~+450 ms/s** (mobile, CPU ×4), ~+85 ms/s na desktopie.
- Przyczyna: każda animacja wewnątrz dużej, przekształconej w 3D i maskowanej płytki wymusza przemalowanie całej warstwy (sprawdzone przez wyłączanie animacji po kolei).
- Wersja produkcyjna wymagałaby statycznej płytki (jedna warstwa) i osobnej, lekkiej warstwy animacji (canvas 2D albo osobny element z tym samym transformem).

**Ryzyka na iOS Safari.**
- Tekst na warstwie 3D może być rastrowany w niskiej rozdzielczości i lekko rozmyty.
- `offset-path` wymaga iOS 16+. Starsze wersje nie pokażą impulsów (`@supports`).
- Koszt malowania na starszych iPhone'ach.

## C. „Płynne złoto” (v2, po rozmowie 2026-09-23)

Pierwsza wersja C („złote morze o zachodzie”) czytała się jak pejzaż morski, a nie płynne złoto, i trudno ją było powiązać z grupą technologiczną. Została zastąpiona; stara wersja jest w historii (commit `da2a5f6`).

**Idea.**
- Zbliżenie na strugę ciężkiego, polerowanego złota, która wyłania się z ciemności po prawej stronie i powoli spływa w dół szerokimi fałdami. Nagłówek jest na czerni po lewej.
- Światło jest studyjne: softboxy, szerokie pasma połysku i nasycone cienie, więc materiał czyta się jako metal, nie woda. Refleksy przesuwają się za kursorem.
- **Przy scrollu** złoto spływa w dół: struga przyspiesza, zwęża się i przesuwa do środka, a pod hero przechodzi w złotą nić wchodzącą w ramkę diagramu.

**Technika.**
- Surowy WebGL1 bez bibliotek, jeden fragment shader.
- Powierzchnia to pole wysokości: szum z zawinięciem domeny, wydłużony w pionie, plus zaokrąglony przekrój strugi. Normalne liczone z różnic skończonych, fresnel Schlicka dla złota, proceduralne studio i tone mapping ACES.
- Przepływ jest całkowany w czasie, więc przyspieszenie przy scrollu nie powoduje skoków. Nić pod hero to element CSS sterowany postępem scrolla.
- Start zaraz po załadowaniu („najlepszy efekt”, zgodnie z decyzją właściciela), rozdzielczość do 1× DPR.
- Zostają: statyczna struga w CSS jako fallback, wykrywanie renderera programowego, pauza poza ekranem i jedna klatka przy reduced-motion.
- Mobile: węższa struga u dołu pod CTA, ta sama mechanika spływania.

**Koszt.** Na tym etapie celowo nie mierzony (decyzja właściciela: najpierw efekt). Wiadomo z v1:
- start od razu po `load` może podbić TBT w Lighthouse (v1: 400–1260 ms);
- możliwe środki zaradcze to start przy interakcji (v1: TBT 0), niższa rozdzielczość i limit 30 fps na telefonach.

Do zmierzenia po akceptacji efektu.

**Ryzyka na iOS Safari.** Jak w v1: Low Power Mode (30 fps), nagrzewanie przy długim oglądaniu, utrata kontekstu po zejściu do tła (zostaje wersja CSS). Do sprawdzenia na prawdziwym iPhonie.

## B+ (propozycja): prawdziwy diagram w 3D zamiast płytki. Ocena wykonalności

Pytanie właściciela: czy diagram może faktycznie przechodzić z półpłaskiej perspektywy pod kątem do diagramu, który jest widoczny w sekcji „Jak to działa?”. Niczego nie wdrażałem, zrobiłem tylko test techniczny.

**Test (Chromium z GPU, 1440×900).**
- Prawdziwy DOM diagramu (`.scheme-desktop .scheme-diagram`: 1024×768, 107 elementów, 15 z `filter: drop-shadow`) pochylony CSS 3D (`perspective(1600px) rotateX(52°) rotateZ(−30°)`) renderuje się ostro: napisy czytelne, świecące linie i kolory obszarów zostają.
- Animacja 52° → 0° w 1,2 s: 57–60 fps, ~115 ms pracy wątku głównego łącznie.
- Filtry `drop-shadow` dają jedno przycięcie ~83 ms przy pierwszym rastrze. Bez filtrów najgorsza klatka ma 17 ms.
- WebKit w Playwright na Windows renderuje programowo (12 fps), więc nie jest miarodajny dla iPhone'a.

**Jak by to działało.**
1. Hero i diagram tworzą jedną przypiętą scenę. Na starcie diagram leży po prawej, pochylony ~50° i oświetlony złotem (złota nakładka `mix-blend-mode: color`), a po lewej jest nagłówek hero.
2. **Faza 1** (~0,6–0,8 vh): tekst hero znika, diagram obraca się do płaskiego, przesuwa na środek i dochodzi do swojej docelowej skali. Złoto ustępuje prawdziwym kolorom obszarów, pojawia się „Jak to działa?”.
3. **Faza 2:** obecna sekwencja 2 kroków (Finansowanie → Sklepy).
4. **Faza 3:** jednorazowe zwolnienie pinu (D2), dalej statyczny, interaktywny diagram.

Technicznie nie koliduje to z obecnym kodem: nowa zewnętrzna warstwa robi pochylenie 3D, a `.scheme-diagram` wewnątrz zachowuje dotychczasowe transformacje przybliżeń.

**Wykonalność: wysoka.** Warunki i ryzyka:
- **Tempo:** pin rośnie do ~2,3–2,6 vh, a droga do kart do ~4,2–4,5 vh (1440). To powyżej naszego celu D1 (≤ 4,0 vh), ale w limicie Briefu (≤ 6). Ewentualnie trzeba skrócić kroki.
- **Pierwszy ekran:** diagram (107 elementów z poświatami) trafia do pierwszego widoku, więc pierwsze malowanie jest cięższe. LCP powinien zostać na h1, ale to trzeba zmierzyć. Poświaty (`drop-shadow`) należy wyłączyć na czas obrotu albo zastąpić wypieczonymi.
- **Złoty klimat:** diagram jest wielokolorowy (magenta, niebieski, pomarańcz, zieleń, czerwona rama), więc w hero trzeba go „pozłocić” nakładką. Przejście złoto → kolory może być osobnym akcentem narracji.
- **iOS Safari:** warstwa 3D z tekstem bywa rozmyta w trakcie animacji (ostrzy się po zatrzymaniu), a filtry są drogie. Wymaga testu na prawdziwym iPhonie.
- **Mobile:** osobny, pionowy diagram (382×1210) słabo nadaje się do mocnego pochylenia. Propozycja: łagodna wersja (~25–30°, tylko faza 1) albo obecne zachowanie mobile bez zmian.
- **Struktura:** hero i diagram stają się jedną sceną w szablonie (`index.html`, `home_en.html`, komponent hero lub how-it-works). Anchory i kolejność fokusu trzeba zaplanować razem (pin tworzony od razu, zgodnie z PLAN).
- **Nakład pracy:** mniej więcej zakres Etapu 4 (diagram) plus 30–50% na scalenie z hero i wersję mobile.

**Wybór:** B+ i C to dwa różne pomysły na hero. B+ opiera się na prawdziwym diagramie w 3D jako obiekcie, C na złotej strudze, która zamienia się w nić prowadzącą do diagramu. Łączenie obu w jednym hero byłoby przeładowane.

## B+ „Diagram jako hero” (prototyp, 2026-09-23)

Adresy: http://localhost:6060/hero-lab/d/ · http://localhost:6060/en/hero-lab/d/ (w pasku labu: „B+”).

**Idea.** Obiektem hero jest prawdziwy diagram „Jak to działa?”, w obecnych kolorach, bez złocenia (zgoda właściciela). Na starcie leży po prawej, pochylony w 3D, delikatnie „pływa” i przesuwa się po nim pasmo światła. Przy scrollu obraca się do widoku płaskiego i dojeżdża na swoje miejsce w sekcji, dokładnie pod nagłówek „Jak to działa?”, który pojawia się na końcu przejścia. Dalej jest zwykły scroll.

**Technika.**
- Diagram zostaje w swojej sekcji w DOM.
- Skrypt labu (`site/_includes/hero-lab/d.html`) liczy jego naturalne położenie i nakłada jeden transform (`translate3d` + `perspective` + `rotateX/Z` + `scale`) zależny od scrolla. Bez pinu i bez GSAP.
- Hero jest przezroczyste i leży nad sekcją, więc diagram przejeżdża pod tekstem hero.
- Desktop: przelot z prawej części hero do kadru „nagłówek + diagram”, ok. 1 wysokość ekranu scrolla.
- Mobile: łagodna wersja. Diagram jedzie w normalnym przepływie pod nagłówkiem i tylko prostuje się (34° → 0°), gdy wjeżdża na ekran. Na telefonie hero pokazuje sam tekst i złotą poświatę.

**Uproszczenia prototypu (do rozwiązania przy wdrożeniu).**
- Obecna 2-krokowa sekwencja (Finansowanie → Sklepy) jest na tej stronie wyłączona, a pod diagramem widać statyczną listę opisów. We wdrożeniu sekwencja startowałaby po wylądowaniu diagramu (plan z oceny wykonalności B+).
- Wydajność niemierzona (decyzja właściciela).

**Sprawdzone.** Chromium z GPU: 1440, 1920, 390 (PL/EN), kadry sekwencji scrolla. Chromium, WebKit i Firefox: brak błędów konsoli i poziomego scrolla.

---

## Weryfikacja (wykonana)

- **Chromium i WebKit:** 1440, 1920, 390, 360 × PL/EN × A/B/C plus kontrola. Brak poziomego scrolla i błędów konsoli.
- **Firefox:** brak błędów. Jedyne ostrzeżenie „scroll-linked effect” dotyczy obecnego hero (pin GSAP).
- **Przejście do diagramu:** kadry przy 35%, 80% i 115% wysokości hero we wszystkich trzech koncepcjach.
- **Reduced motion:** PL/EN, 1440 i 390, we wszystkich trzech koncepcjach.
- **Pomiary:**
  - Lighthouse mobile ×3 na buildzie produkcyjnym: `docs/homepage-v2/hero-lab/lighthouse-*.json`.
  - Koszt w spoczynku: CDP `Performance.getMetrics`, 6 s po załadowaniu, z zablokowanym `common.min.js`, żeby mierzyć samo hero. Skrypt `docs/homepage-v2/hero-lab/idle.mjs`.

Uwaga do porównania z bazą z Etapu 1: strony labu mają tylko diagram i karty marek, więc ich wynik (~90) nie jest porównywalny z wynikiem całej strony głównej (83–85). Punktem odniesienia jest strona kontrolna `/hero-lab/0/`.

## Rekomendacja (aktualizacja po rozmowie 2026-09-23)

Pierwotna rekomendacja (C v1) jest nieaktualna: C v1 okazało się pejzażem morskim, nie płynnym złotem. Na teraz:

- **C v2 „Płynne złoto”** jest do oceny przez właściciela jako efekt. Wydajność zmierzę dopiero po akceptacji wyglądu, razem z ewentualnymi środkami zaradczymi.
- **B+ (prawdziwy diagram w 3D)** jest wykonalne z wysokim prawdopodobieństwem (test powyżej). Daje najmocniejsze powiązanie hero z diagramem, kosztem dłuższego pinu (~+0,7 vh) i scalenia hero z sekcją diagramu.
- **A** zostaje najbezpieczniejszą alternatywą: czysty CSS, „wow” od pierwszej sekundy na każdym urządzeniu.
- **B** (złota płytka jako osobna grafika) jest zastąpione przez propozycję B+.

Po wyborze wybrana koncepcja zastąpi komponent `hero` na stronie głównej (PL i EN). Lab (`/hero-lab/*`, `site/_includes/hero-lab/`, flagę `homepage_runtime`) usunę po wdrożeniu.
