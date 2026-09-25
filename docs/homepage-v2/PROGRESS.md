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

### Przygotowanie do deployu: GSAP w repo, linki D6, teksty D7 (2026-09-24)

- `.gitignore`: wyjątek `!site/js/vendor/`. GSAP 3.12.5, ScrollTrigger i cookiedialog są teraz w repozytorium, więc build w CI (GitHub Pages) ma animacje, menu mobilne i diagram.
- D6:
  - GOTOMA General wszędzie `gotomageneral.com` (także w nagłówku);
  - EN `main.pl/en/` (bez podwójnego ukośnika);
  - softlike wszędzie `softlike.pl`;
  - PL „Aplikacje custom” → GOTOMA S.H. `https://www.gotoma.pl/` (był pusty link).
- D7 w diagramie:
  - ikony obok nazw obszarów oznaczone jako dekoracyjne (`alt=""`, zamiast polskich altów w EN);
  - `aria-label` zamknięcia arkusza „Close” w EN;
  - fallback etykiety partnerów z danych językowych.

### Etap 5–6: karty marek i dolne sekcje strony głównej w złotym stylu (2026-09-24)

- Nowe szablony z własnymi klasami BEM:
  - `blog-section` → `c-brands`;
  - `projects-section` → `c-proof` + `c-banner`;
  - `partners-section` → `c-partners`;
  - `solutions-section` → `c-solutions`.
- Style: `3-modules/_home-sections.scss`, karta marki: `blog-card.scss`. Teksty, dane, linki i kotwice (`#dowiedz-sie-wiecej`, `#o-grupie`, `#partners`, `#solutions` i EN) bez zmian.
- **Karty marek:** pełne zdjęcie z gradientem, logo, tytuł, opis i złoty przycisk. Jeden link na kartę (rozciągnięty tytuł, wcześniej 4 przystanki Tab), złota obwódka i powiększenie zdjęcia przy hover/focus. Nagłówek karty zmieniony na h3.
- **Liczby:** złote cyfry w kartach z odliczaniem przy wejściu (wartość jest w HTML od początku, kończy dokładnie na 13+ / 300+ / 70+).
- **Klienci:** siatka 6×2 z liniami, białe logotypy rozjaśniające się przy hover.
- **Partnerstwa:** 3 złote karty zamiast „schodków” (przy okazji poprawiony niepoprawny HTML ze `<span href>`).
- **Partnerzy:** pasek z wygaszanymi krawędziami. Logotypy z nieprzezroczystym tłem w oryginalnych kolorach, druga kopia listy ukryta przed czytnikami i Tabem. Przy reduced-motion jest statyczna siatka.
- **Rozwiązania:** karty w stylu stron usług.
- **Animacje w `common.js`:** usunięte animacje sprzężone ze scrollem (przez nie treść była przyciemniona do 0,18 i nachodziła na siebie), w ich miejsce jednorazowe, kaskadowe wejścia (`[data-reveal]`, `[data-reveal-group]`). Znika też poziomy scroll przy 1280 px.
- **Diagram:** sekwencja tworzona przy pierwszej interakcji, a nie od razu po załadowaniu. Usunęło to długie zadanie GSAP (~250 ms) z okna ładowania. Przełączenie przy końcu sekwencji nadal daje 0 px przesunięcia (desktop i mobile).

Wyniki:
- Lighthouse mobile ×3 (PL/EN): 88/89 (baza 83/85), LCP 3,86/3,70 s (baza 4,33/4,17), TBT 47/9 ms (baza 19/16; przebiegi PL 22–54 ms), CLS 0. Dane w `docs/homepage-v2/lower-sections/`.
- Chromium, WebKit i Firefox; 1440, 1280, 390; PL i EN: brak poziomego scrolla i błędów, wszystkie elementy widoczne po przewinięciu, odliczanie działa. Reduced-motion: wszystko widoczne od razu, pasek statyczny.
- Stare reguły tych sekcji w `_sections.scss` są już nieużywane. Do usunięcia przy porządkach (Etap 7).

### Poprawki: diagram na mobile i karty marek (2026-09-24)

- **Diagram (mobile):** zbliżenie w sekwencji scrolla nie ucina już prawej kolumny. Skala jest ograniczona do szerokości ramki diagramu (x 22–360 w układzie 382), a przesunięcie trzyma ramkę w ekranie z marginesem 10 px (`getFocus` w `common.js`). Sprawdzone przy 390 i 360 px.
- **Karty marek:**
  - zdjęcie nad treścią, logo, tytuł i pełny opis na ciemnym panelu, a nie na zdjęciu (wcześniej logo nachodziło na zrzuty ekranu, a opis był ucinany do 4 linii);
  - przyciski wyrównane do dołu, więc w rzędzie leżą na jednej linii;
  - kadr zdjęcia dobrany do każdej marki (`c-blog-card--{idHref}`);
  - tablet (577–1024): jedna karta w rzędzie, zdjęcie obok treści (wcześniej trzecia karta zostawała sama w rzędzie).
- Sprawdzone: 360, 390, 820, 1024 i 1440 px; PL, EN i blog. Brak poziomego scrolla i błędów w konsoli.

### Karty członkostw w hero i czwarta karta marki (ERP Factory) (2026-09-25)

- **Hero:** pod przyciskami dwie karty-linki, Evoluma (profil członka klastra) i enova365 (gotomageneral.com), PL/EN, otwierane w nowej karcie. Dane są we front matter strony (`badges`, edytowalne w CMS).
  - Desktop: lista ma zerową wysokość, więc nie przesuwa treści hero; na niskich ekranach lekko wystaje pod hero.
  - Mobile: karty jedna pod drugą, hero wydłuża się o ich wysokość.
  - Karty nie wygasają przy scrollu razem z treścią hero.
  - `overflow: hidden` przeniesiony z `.c-hero` na `.c-hero__sky`.
- **„Wybierz czego potrzebujesz”:**
  - 4. karta ERP Factory: posty `2018-11-10-erp-factory-pl/en`, grafika `erpfactory_obrazek`;
  - siatka 2×2 na desktopie (`col-6`), zdjęcie w proporcji 4:3; tablet i mobile bez zmian;
  - poprawka: `blog-section` najpierw filtruje posty po języku, a dopiero potem stosuje `limit:6`. Wcześniej limit liczył posty obu języków i czwarta karta PL w ogóle by się nie pokazała.
- **Karty marek, hover:** w trakcie animacji po najechaniu migała jasna linia na styku zdjęcia z treścią (ostatni rząd pikseli zdjęcia spod gradientu). Przyczyną było uniesienie karty przez `transform`, bo warstwa lądowała na ułamkowych pikselach. Teraz uniesienie idzie przez `top`, a zoom zdjęcia przez wymiary zamiast `scale()`. Sprawdzone klatka po klatce w Chromium, WebKit i Firefox, dla 4 kart, przy najechaniu i zjechaniu.
- Złote kropki diagramu odłożone na branch `feature/diagram-gold-dots`.

### Menu, przewijanie do sekcji, błysk liczb, ukryte banery (2026-09-25)

- **Menu:**
  - „O grupie” / „About us” prowadzi na stronę główną (`/`, `/en/`); na stronie głównej przewija na górę bez przeładowania.
  - „Nasze firmy” / „Our companies” to link do sekcji marek (`/#dowiedz-sie-wiecej`, `/en/#choose-what-you-need`). Podmenu dalej otwiera się na hover/focus; w `header.html` pozycja z podmenu może mieć własny `url`.
- **Naprawiony błąd przewijania do sekcji za diagramem** (dotyczył też przycisku „Dowiedz się więcej” w hero):
  - pierwsze kliknięcie nie przewijało (desktop i mobile), bo tworzenie sekwencji diagramu przy pierwszej interakcji odświeżało ScrollTrigger i przerywało przewijanie;
  - jeśli sekwencja już istniała, zdjęcie pinu w trakcie przewijania dawało lądowanie obok celu;
  - wejście z podstrony z kotwicą lądowało ok. 2000 px za nisko.
  - Teraz `scrollToSection` w `common.js` przy celu za diagramem tworzy i od razu kończy sekwencję (zdjęcie pinu), a dopiero potem przewija. Zwykłe przewijanie nadal odtwarza sekwencję.
  - Sprawdzone: desktop/mobile × PL/EN × strona główna/podstrona; sekcja zawsze ląduje 32 px od góry.
- **Liczby (13+, 300+, 70+):** ten sam przebłysk co na kartach członkostw w hero, kafelki po kolei (co 0,4 s); przy reduced-motion wyłączony.
- **Banery enova365 / Evoluma / ERP Factory** w sekcji liczb są ukryte (treści są już w hero i w karcie ERP Factory), ale zostają w kodzie. Włączenie: `show_banners: true` w bloku `projects-section`, przełącznik w CMS.

### Laboratorium kolejności firm (2026-09-25)

- Przełącznik do pokazania CEO różnych kolejności firm. Działa na stronie głównej z parametrem: `/?kolejnosc` (EN: `/en/?kolejnosc`). Bez parametru strona jest bez zmian.
- Zmienia naraz: logo w nagłówku, kafelki „Wybierz czego potrzebujesz” i podmenu „Nasze firmy”.
- Pasek w lewym dolnym rogu:
  - presety z `site/_data/order_lab.yml`;
  - strzałki ‹ › przy każdej firmie;
  - „Kopiuj link” (kolejność jest w adresie, np. `/?kolejnosc=cod-erp-gsh-gg`);
  - „Ukryj”.
- Przełączenie PL/EN zachowuje kolejność.
- Kody firm: `gg` GOTOMA General, `gsh` GOTOMA Software House, `cod` Codarius, `erp` ERP Factory.
- Pliki: `site/_includes/order-lab.html` (dołączony w `default.html`), `site/_data/order_lab.yml`, atrybuty `data-brand` na logo w `header.html`. Do usunięcia po decyzji. Docelową kolejność wprowadza się w `header.html` (kolejność logo), w datach postów marek (kafelki) i w `navigation.yml` (podmenu).
- Przy okazji: z `erpfactory.png` i `.webp` przycięty przezroczysty margines z prawej (35 px z 118). Przy ERP Factory w innym miejscu niż na końcu robił nierówną przerwę w nagłówku.
- Uwaga: dotąd kolejność w nagłówku (GG, GSH, Codarius, ERP) i w kafelkach (Codarius, GSH, GG, ERP) była różna.

### Formularz Konsultacji 360° wysyłany przez gotoma.pl/kontakt (2026-09-25)

- Formularz (PL/EN) wysyła zgłoszenie w tle na formularz kontaktowy gotoma.pl (Contact Form 7 nr 6, REST `wp-json/contact-form-7/v1/contact-forms/6/feedback`). Konfiguracja w `site/_data/contact_form.yml`.
- Mapowanie pól:
  - imię i nazwisko → `your-name`, firma → `your-company`, e-mail → `your-email`, zgoda → `acceptance`;
  - pozostałe pola trafiają jako zestawienie w `your-message` z nagłówkiem „[Strona Grupy GOTOMA – Konsultacja 360°]” i adresem strony. Opis ma limit 1400 znaków, bo `your-message` na gotoma.pl ma maksymalnie 2000.
- Komunikaty PL/EN: wysyłanie, sukces, błędne pole (zaznaczane), antyspam, błąd sieci/serwera (z linkiem do gotoma.pl/kontakt). Honeypot bez wysyłki.
- reCAPTCHA v3 z gotoma.pl ładowana przy pierwszym kontakcie z formularzem. Usunięte pole `_to`.
- CORS: endpoint gotoma.pl zwraca `Access-Control-Allow-Origin` dla stage.
- **Wymaga jeszcze:** dopisania domeny stage (i docelowej domeny grupy) do klucza reCAPTCHA gotoma.pl w konsoli Google. Teraz Google zwraca „Invalid domain for site key”, więc CF7 odrzuci zgłoszenie jako spam.
- Testy:
  - scenariusze z atrapą endpointu;
  - prawdziwy endpoint z celowo błędnym e-mailem: `validation_failed` tylko na `your-email`, bez wysyłki maila.

### Diagram mobile: układ statyczny na wąskich ekranach (2026-09-25)

- **Problem (zgłoszenie z Galaxy S22, 360 px):** po przejściu sekwencji karty diagramu nachodziły na siebie. Nagłówek „GOTOMA GENERAL…” zawijał się do 3–4 linii i wchodził na „Cyberbezpieczeństwo” o 32 px (przy 390 px o 4 px), a „Finansowanie” rozjeżdżało się. Przyczyna: w widoku statycznym diagram miał szerokość procentową, a tekst stały rozmiar w px.
- **Poprawka:**
  - widok statyczny ma rozmiar projektowy 382 px pomniejszony jednolicie przez CSS `zoom` (klasa `is-fit`, `fitMobileDiagram()` w `common.js`, przeliczane przy zmianie rozmiaru i przed pomiarem naturalnego układu sekwencji);
  - w trybie sekwencji `zoom: 1`, bo skaluje transform;
  - tablet bez zmian (`zoom` 1).
- Efekt uboczny: koniec sekwencji trafia teraz dokładnie w widok statyczny (0 px przesunięcia przy zdjęciu pinu).
- Sprawdzone: Chromium 360/390/412, WebKit 375 i 820, Firefox 360, reduced-motion. Nic nie wystaje z kart, dotknięcie karty otwiera arkusz, brak poziomego scrolla.

### Formularz: pola w stylistyce strony (2026-09-25)

- **Pola wyboru** („Rodzaj danych”, „Preferowana forma”):
  - zamknięte pole ze złotą strzałką (bez systemowej), tej samej wysokości co pozostałe;
  - na komputerze (mysz/trackpad) własna lista w złotym stylu zamiast systemowej z niebieskim podświetleniem. Natywny `<select>` zostaje pod spodem i trzyma wartość;
  - obsługa klawiatury: strzałki, Home/End, Enter/Spacja, Esc, Tab, wpisywanie liter; kliknięcie poza listę ją zamyka; etykieta otwiera listę; reset formularza czyści wybór;
  - na urządzeniach dotykowych zostaje systemowy wybór.
- **Checkboxy:** ciemny kwadrat ze złotą obwódką, zaznaczony złoty z ciemnym ptaszkiem, fokus złoty, wyrównanie do pierwszej linii tekstu.
- **Liczba osób:** bez systemowych strzałek (`inputmode="numeric"`).
- Sprawdzone w Chromium, WebKit i Firefox (desktop) oraz na mobile; wartości z list trafiają do treści zgłoszenia.
- **Walidacja formularza w języku strony** zamiast dymków przeglądarki (były w języku przeglądarki, np. „Please fill out this field.” na stronie PL):
  - komunikaty PL/EN pod polem, w stylu strony, z czerwoną obwódką pola;
  - fokus na pierwszym błędnym polu, błąd znika po poprawieniu, zły e-mail wykrywany po wyjściu z pola;
  - sprawdzane: opis, imię i nazwisko, firma, e-mail (wymagany + format), zgoda, liczba osób (liczba całkowita ≥ 1);
  - błędy zwrócone przez CF7 pokazywane tak samo;
  - poprawiony błąd: komunikat o e-mailu pojawiający się w trakcie dotknięcia „Wyślij” przesuwał przycisk i dotknięcie trafiało obok (mobile). Teraz komunikat pokazuje się po puszczeniu.

### Eksperyment „złoty diagram” (/?diagram=zloty) (2026-09-25)

- Wariant sekcji „Jak to działa?” włączany parametrem `?diagram=zloty` (`?diagram=obecny` pokazuje obecny wygląd z paskiem do porównania). Bez parametru strona bez zmian.
- Pliki: `site/_includes/diagram-lab.html` (dołączony w `default.html`), `3-modules/_theme-diagram-gold.scss` (wszystko pod `.scheme-gold`).
- **Kropki:** nowy canvas na cały panel diagramu (desktop), na całą szerokość ekranu (mobile). Przygaszone złoto, dwie wolno wędrujące plamy światła, rzadkie rozbłyski, rozświetlenie pod kursorem. Warstwa bazowa jest rysowana raz; mobile 30 fps; poza ekranem pauza; reduced-motion: statycznie. Stare kropki (`.dotsTest`) są w wariancie usuwane.
- **Złoto:**
  - panel ze złotą obwódką i poświatą;
  - złote ramki i gradient tytułu w nagłówku „GOTOMA GENERAL” i w pasku integracji;
  - „Finansowanie” w złocie;
  - złota linia u góry kart;
  - złoty pasek postępu w sekwencji.
  - Kolory kategorii (linie, poświaty kart) zostają.
- **Animacje:**
  - złote impulsy światła biegnące po liniach połączeń;
  - dymki (desktop) wchodzą sprężyście z rozmyciem, z przebłyskiem światła i kaskadą treści (nagłówek, linia, partnerzy);
  - karta z otwartym dymkiem ma rozchodzący się złoty pierścień;
  - arkusze (mobile): złota obwódka, sprężysty wjazd, przebłysk, kaskada treści.
- Przy okazji `order-lab.html` zachowuje inne parametry w adresie, więc oba eksperymenty mogą działać razem.

