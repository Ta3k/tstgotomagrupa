# Hero v2: laboratorium koncepcji

Trzy działające prototypy nowego hero, PL i EN, desktop i mobile. Są to tymczasowe podstrony poza nawigacją i sitemapą, z `noindex`: `head.html` wstawia go na sztywno, zgodnie z D8. Pod każdym hero jest prawdziwa sekcja „Jak to działa?” i karty marek, więc widać przejście. W prawym dolnym rogu jest pasek labu (Obecne / A / B / C, PL / EN).

| | PL | EN |
|---|---|---|
| Obecne hero (kontrola, te same sekcje poniżej) | http://localhost:6060/hero-lab/0/ | http://localhost:6060/en/hero-lab/0/ |
| A „Zaćmienie” | http://localhost:6060/hero-lab/a/ | http://localhost:6060/en/hero-lab/a/ |
| B „Ekosystem” | http://localhost:6060/hero-lab/b/ | http://localhost:6060/en/hero-lab/b/ |
| C „Płynne złoto” | http://localhost:6060/hero-lab/c/ | http://localhost:6060/en/hero-lab/c/ |

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

## C. „Płynne złoto” (nocne morze złota)

**Idea.**
- Nocne morze płynnego złota z perspektywą: gęsta, lśniąca tafla, niskie słońce i świetlna ścieżka na falach. Nagłówek na czarnym niebie nad horyzontem.
- Efekt „premium” wynika z materiału i światła, nie z liczby efektów. To najsilniejsze „wow”.
- Przy scrollu kamera pochyla się w złoto, które potem gaśnie w czerń sekcji diagramu.

**Technika.**
- Surowy WebGL1 bez bibliotek: jeden trójkąt, fragment shader ~40 linii. Szum wartości z analitycznymi pochodnymi daje normalne bez dodatkowych próbek. Odbicie środowiska ze słońcem, fresnel i mgła przy horyzoncie.
- Rozdzielczość: 0,6 DPR na desktopie, budżet 260 tys. px na telefonie, 30 fps na urządzeniach dotykowych.
- Adaptacyjna jakość: przy wolnych klatkach rozdzielczość spada, maksymalnie trzykrotnie. W programowym WebKit spadła do ~25%.
- Kompilacja przez `KHR_parallel_shader_compile`. Pauza poza ekranem i na ukrytej karcie.
- **Start przy pierwszej interakcji** (ruch myszy, dotyk, scroll, klawisz), tak jak obecna klasa `hero-motion-active`. Do tego czasu i zawsze na słabszych urządzeniach widać statyczną wersję CSS: horyzont, tafla i migocząca ścieżka światła. Słabsze urządzenia to: renderer programowy, Save-Data, ≤ 2 GB RAM, ≤ 2 rdzenie.
- Reduced motion: jedna nieruchoma klatka shadera.

**Koszt.**
- ~8 KB gzip, 0 requestów.
- Lighthouse ze startem przy interakcji: PL 90 / EN 90, LCP 3,55 / 3,54 s, TBT 0 / 0 ms, CLS 0 (jak kontrola).
- **Ze startem od razu po `load`: PL 64–78, TBT 400–1260 ms (poza limitem Briefu).** Tworzenie kontekstu WebGL to ~140 ms przy CPU ×4, czyli ~35 ms na średnim telefonie, a pętla renderu konkuruje ze skryptami w oknie pomiaru.
- W spoczynku z działającym shaderem (mobile, CPU ×4): **~+100 ms/s, najmniej z trzech**, bo pracę wykonuje GPU. Na desktopie ~+10 ms/s.

**Ryzyka na iOS Safari.**
- WebGL działa, ale w trybie Low Power Mode rAF spada do 30 fps. Długie oglądanie grzeje telefon i zużywa baterię (łagodzą to pauza poza ekranem i limit 30 fps).
- Utrata kontekstu po zejściu do tła: zostaje wersja CSS.
- `requestIdleCallback` nie istnieje w Safari (jest fallback). Zmiany paska adresu: canvas przelicza rozmiar tylko przy `resize`.
- Zrzuty Playwright WebKit na Windows nie pokazują canvasu WebGL, ale odczyt pikseli potwierdził poprawny render w WebKit.
- **Trzeba potwierdzić na prawdziwym iPhonie:** płynność, temperaturę i wygląd przejścia CSS → shader.

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

## Rekomendacja

**C „Płynne złoto”**, z A jako bezpieczną alternatywą.

- **Za C:**
  - Robi największe wrażenie i najbardziej oddaje „złoty klimat premium”. Wygląda jak realizacja, nie szablon.
  - W Lighthouse jest na poziomie obecnego hero, a po starcie najmniej obciąża wątek główny.
  - Horyzont i złoto naturalnie „przelewają się” w sekcję diagramu.
  - Ma trzy poziomy jakości: shader, statyczny CSS i reduced-motion.
- **Kompromis C, do Twojej decyzji:**
  - Ruch złota zaczyna się przy pierwszej interakcji. Na desktopie to praktycznie od razu, na telefonie przy pierwszym dotyku lub scrollu. Pierwsza sekunda na telefonie to statyczny, ale efektowny kadr.
  - Start bez interakcji łamie limit TBT z Briefu.
  - Wymaga testu na prawdziwym iPhonie.
- **A** daje „wow” animacją zapłonu w pierwszej sekundzie na każdym urządzeniu, jest czystym CSS i ma najmniejsze ryzyko. Wybrałbym ją, jeśli ruch od pierwszej chwili na telefonie jest ważniejszy niż efekt materiału.
- **B** ma najlepszą narrację (zapowiedź diagramu), ale jest najbardziej „zajęta” i najdroższa w spoczynku. Wymagałaby przebudowy animacji. Nie rekomenduję jako hero; motyw płytki można ewentualnie wykorzystać w samym diagramie.

Po Twoim wyborze wybrana koncepcja zastąpi komponent `hero` na stronie głównej (PL i EN). Lab (`/hero-lab/*`, `site/_includes/hero-lab/`, flagę `homepage_runtime`) usunę po wdrożeniu.
