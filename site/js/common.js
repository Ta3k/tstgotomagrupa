let APP;

function initializeCommon() {
  'use strict';

  class App {
    constructor (canvas) {
      this.canvas = canvas;
      this.context = this.canvas.getContext('2d');
      this.canvas.width = this.width = 1024;// window.innerWidth;
      this.canvas.height = this.height = 768;// window.innerHeight;

      this.setupDots();

      this.resize = this.resize.bind(this);
      this.mousemoveHandler = this.mousemoveHandler.bind(this);
      this.mouseleaveHandler = this.mouseleaveHandler.bind(this);
    }

    setupDots () {
      this.dots = [];
      this.scl = 24;
      this.cols = Math.ceil(this.width / this.scl);
      this.rows = Math.ceil(this.height / this.scl);

      // The grid starts flush at (0, 0) and steps by `scl`, so the last
      // column/row lands short of the canvas's right/bottom edge (e.g. 1024/24
      // leaves a 16px gap on the right but none on the left). Centering the
      // whole grid in the leftover space spreads that gap evenly on both
      // sides so the dots visually fill the container instead of looking
      // flush-left/top with a gap bottom-right.
      const offsetX = (this.width - (this.cols - 1) * this.scl) / 2;
      const offsetY = (this.height - (this.rows - 1) * this.scl) / 2;

      let id = 0;

      for (let x = 0; x < this.cols; x += 1) {
        for (let y = 0; y < this.rows; y += 1) {
          this.dots.push(
            new Dot(id, offsetX + x * this.scl, offsetY + y * this.scl, this.context, this.scl)
          );
          id += 1;
        }
      }
    }

    resize () {
      this.canvas.width = this.width = 1024;//window.innerWidth;
      this.canvas.height = this.height = 768;// window.innerHeight;
      this.setupDots();
    }

    mousemoveHandler (event) {
      const rect = this.canvas.getBoundingClientRect();

      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      const mouse = {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };

      this.dots.forEach(d => d.mousemove(mouse));
    }

    mouseleaveHandler () {
      this.dots.forEach(d => {
        d.isHover = false;
        d.targetRadius = 3;
      });
    }

    render () {
      this.context.clearRect(0, 0, this.width, this.height);

      this.dots.forEach(d => {
        d.render();
      });
    }
  }

  class Dot {
    constructor (id, x, y, context, scl) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.new = {
        x: x,
        y: y,
        radius: 2,
        color: 'rgba(162, 162, 167, 0.81)'
      };

      this.context = context;
      this.scl = scl;
      this.isHover = false;
      this.isAnimated = false;
      this.targetRadius = 2;
    }

    mousemove (mouse) {
      const x = mouse.x;
      const y = mouse.y;

      this.isHover =
        Math.abs(this.x - x) < this.scl / 4 * 9 &&
        Math.abs(this.y - y) < this.scl / 4 * 9;

      this.isCenter =
        Math.abs(this.x - x) < this.scl / 4 * 5 &&
        Math.abs(this.y - y) < this.scl / 4 * 5;

      this.isClosest =
        Math.abs(this.x - x) < this.scl / 4 * 2 &&
        Math.abs(this.y - y) < this.scl / 4 * 2;

      if (this.isHover && !this.isCenter && !this.isClosest) {
        this.targetRadius = 5;
      } else if (this.isHover && this.isCenter) {
        this.targetRadius = this.isClosest ? 9 : 6;
      } else {
        this.targetRadius = 3;
      }
    }

    render () {
      this.new.radius += (this.targetRadius - this.new.radius) * .18;
      this.context.beginPath();
      this.context.arc(this.new.x, this.new.y, this.new.radius, 0, 2 * Math.PI, false);
      this.context.fillStyle = this.new.color;
      this.context.fill();
    }
  }

  let canvasFrame = 0;

  function init () {
    const canvas = document.querySelector('.dotsTest canvas');

    if (!canvas) {
      return;
    }

    const section = canvas.closest('.stats-how-it-works') || canvas;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const activate = () => {
      if (!APP) {
        APP = new App(canvas);
        events();
      }

      APP.isActive = true;

      if (reduceMotion) {
        APP.render();
      } else if (!canvasFrame) {
        canvasFrame = requestAnimationFrame(loop);
      }
    };

    const deactivate = () => {
      if (APP) {
        APP.isActive = false;
      }

      if (canvasFrame) {
        cancelAnimationFrame(canvasFrame);
        canvasFrame = 0;
      }
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          activate();
        } else {
          deactivate();
        }
      }, { rootMargin: '240px 0px' });

      observer.observe(section);
    } else {
      activate();
    }
  }

  function loop () {
    if (!APP || !APP.isActive) {
      canvasFrame = 0;
      return;
    }

    APP.render();
    canvasFrame = requestAnimationFrame(loop);
  }

  function events () {
    APP.canvas.addEventListener('mousemove', APP.mousemoveHandler, { passive: true });
    APP.canvas.addEventListener('mouseleave', APP.mouseleaveHandler, false);
    window.addEventListener('resize', APP.resize, false);
  }

  init();

  /* =======================
  // Menu
  ======================= */
  var menuOpenIcon = document.querySelector(".nav__icon-menu"),
  menuCloseIcon = document.querySelector(".nav__icon-close"),
  menuItems = document.querySelectorAll(".nav__item"),
  menuList = document.querySelector(".main-nav");

  menuOpenIcon.addEventListener("click", () => {
    menuOpen();
  });

  menuCloseIcon.addEventListener("click", () => {
    menuClose();
  });

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      menuClose();
    });
  });

  function menuOpen() {
    menuList.classList.add("is-open");
  }

  function menuClose() {
    menuList.classList.remove("is-open");
  }

  /* ==================================
  // Stop Animations After All Have Run
  ================================== */
  setTimeout(function(){
    document.body.classList.add("stop-animations");
  },1500)

  /* ======================================
  // Stop Animations During Window Resizing
  ====================================== */
  let resizeTimer;
  window.addEventListener("resize", () => {
    document.body.classList.add("resize-animation-stopper");
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.body.classList.remove("resize-animation-stopper");
    }, 300);
  });


  /* =======================
  // Responsive Videos
  ======================= */
  if (typeof reframe === "function") {
    reframe(".post__content iframe:not(.reframe-off), .page__content iframe:not(.reframe-off)");
  }


  /* =======================
  // Zoom Image
  ======================= */
  const lightense = document.querySelector(".page img, .post img"),
  imageLink = document.querySelectorAll(".page a img, .post a img");

  if (imageLink) {
    for (var i = 0; i < imageLink.length; i++) imageLink[i].parentNode.classList.add("image-link");
    for (var i = 0; i < imageLink.length; i++) imageLink[i].classList.add("no-lightense");
  }

  if (lightense) {
    Lightense(".page img:not(.no-lightense), .post img:not(.no-lightense)", {
    padding: 60,
    offset: 30
    });
  }

  /* ============================
  // Testimonials Slider
  ============================ */
  if (document.querySelector(".my-slider")) {
    var slider = tns({
      container: ".my-slider",
      items: 3,
      slideBy: 1,
      gutter: 20,
      nav: false,
      mouseDrag: true,
      autoplay: false,
      controlsContainer: "#customize-controls",
      responsive: {
        1024: {
          items: 3,
        },
        768: {
          items: 2,
        },
        0: {
          items: 1,
        }
      }
    });
  }


  /* ============================
  // iTyped
  ============================ */
  if (document.querySelector(".c-subscribe")) {
    var options = {
      strings: itype_text,
      typeSpeed: 100,
      backSpeed: 50,
      startDelay: 200,
      backDelay: 1500,
      loop: true,
      showCursor: true,
      cursorChar: "|",
      onFinished: function(){}
    }

    ityped.init('#ityped', options);
  }


  /* ============================
  // Scroll to top
  ============================ */
  const btnScrollToTop = document.querySelector(".top");
  const pageHeader = document.querySelector(".c-header");

  if (btnScrollToTop) {
    const updateScrollToTop = () => {
      const hasPassedHeader = pageHeader
        ? pageHeader.getBoundingClientRect().bottom <= 0
        : window.scrollY > window.innerHeight * .5;

      btnScrollToTop.classList.toggle("is-active", hasPassedHeader);
    };

    window.addEventListener("scroll", updateScrollToTop, { passive: true });
    updateScrollToTop();

    btnScrollToTop.addEventListener("click", function (event) {
      event.preventDefault();

      if (window.scrollY !== 0) {
        window.dispatchEvent(new CustomEvent("page:instant-scroll"));

        const root = document.documentElement;
        const previousScrollBehavior = root.style.scrollBehavior;

        root.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);

        if (typeof ScrollTrigger !== "undefined") {
          ScrollTrigger.update(true);
        }

        requestAnimationFrame(() => {
          root.style.scrollBehavior = previousScrollBehavior;
          updateScrollToTop();

          if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.update(true);
          }
        });
      }
    });
  }

  /* =================================
  // Whole-page scroll choreography
  ================================= */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    const pageEffectsMedia = gsap.matchMedia();

    pageEffectsMedia.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        // Note: we intentionally do NOT enable the global CSS
        // `scroll-behavior: smooth` here. It fights with ScrollTrigger's
        // pin/scrub math (the browser eases scrollTop over ~300-500ms on every
        // wheel tick, so ScrollTrigger reads a laggy scrollY), which is what
        // caused pinned sections (the hero collapse, the "Jak to dziala"
        // diagram) to feel like they jitter/slip instead of staying locked in
        // place while scrolling through them. Anchor-nav clicks get their own
        // explicit smooth scroll below instead, which doesn't have this problem
        // since it's a one-off jump rather than a persistent property that
        // intercepts every scroll input.
        document.querySelectorAll('a[href^="#"]').forEach(link => {
          const id = link.getAttribute("href").slice(1);

          if (!id) {
            return;
          }

          link.addEventListener("click", event => {
            const target = document.getElementById(id);

            if (!target) {
              return;
            }

            event.preventDefault();
            const headerOffset = 32;
            const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top, behavior: "smooth" });
          });
        });

        // Dolne sekcje strony głównej: jednorazowe, kaskadowe wejścia (zamiast animacji sprzężonych ze scrollem,
        // przez które treść była przyciemniona i nachodziła na siebie) + odliczanie liczb w statystykach.
        const root = document.documentElement;
        const revealTargets = [];
        document.querySelectorAll("[data-reveal]").forEach(element => revealTargets.push(element));
        document.querySelectorAll("[data-reveal-group]").forEach(group => {
          Array.prototype.forEach.call(group.children, (child, index) => {
            child.style.setProperty("--i", Math.min(index, 8));
            revealTargets.push(child);
          });
        });

        const countUp = element => {
          const match = element.textContent.trim().match(/^(\D*)(\d+)(.*)$/);
          if (!match) {
            return;
          }
          const [, prefix, digits, suffix] = match;
          const target = parseInt(digits, 10);
          const duration = 1400;
          const startTime = performance.now();
          const step = now => {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            element.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
            if (t < 1) {
              requestAnimationFrame(step);
            } else {
              element.textContent = `${prefix}${digits}${suffix}`;
            }
          };
          requestAnimationFrame(step);
        };

        let revealObserver = null;
        if (revealTargets.length && "IntersectionObserver" in window) {
          root.classList.add("home-reveal-ready");
          revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (!entry.isIntersecting) {
                return;
              }
              entry.target.classList.add("is-in");
              entry.target.querySelectorAll("[data-count]").forEach(countUp);
              revealObserver.unobserve(entry.target);
            });
          }, { rootMargin: "0px 0px -8% 0px", threshold: .1 });

          revealTargets.forEach(element => {
            // elementy widoczne już przy starcie: bez animacji (nie migają)
            if (element.getBoundingClientRect().top < window.innerHeight * .9) {
              element.classList.add("is-in");
              return;
            }
            revealObserver.observe(element);
          });
        }

        return () => {
          revealObserver?.disconnect();
          root.classList.remove("home-reveal-ready");
          document.querySelectorAll("[data-reveal], [data-reveal-group] > *").forEach(element => element.classList.add("is-in"));
        };
      }
    );
  }




  const initializeWhenNear = (selector, setup) => {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setup();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) {
        return;
      }

      observer.disconnect();
      setup();
    }, { rootMargin: "-20% 0px" });

    observer.observe(element);
  };

  /* Sekwencje diagramu tworzymy przy pierwszej interakcji (scroll, dotyk, klawisz, kliknięcie);
     żeby dojść do diagramu i tak trzeba przewinąć stronę. Sekcja leży pod pełnoekranowym hero, więc w tym momencie jest jeszcze poza ekranem:
     zmiana układu i wstawienie pin-spacera są niewidoczne, a ciężka konfiguracja (~200 ms) nie blokuje ładowania. */
  const storySetups = [];
  let storiesStarted = false;
  const startStories = () => {
    if (storiesStarted) {
      return;
    }
    storiesStarted = true;
    ["scroll", "wheel", "touchstart", "keydown", "pointerdown"].forEach(type => window.removeEventListener(type, startStories));
    storySetups.forEach(setup => setup());
  };
  if (document.querySelector(".stats-how-it-works")) {
    ["scroll", "wheel", "touchstart", "keydown", "pointerdown"].forEach(type => {
      window.addEventListener(type, startStories, { passive: true });
    });
    // strona otwarta od razu niżej (odświeżenie w połowie, kotwica): nie czekamy
    if (window.scrollY > window.innerHeight * .5) {
      requestAnimationFrame(startStories);
    }
  }
  const initializeStoryNow = setup => {
    if (document.querySelector(".stats-how-it-works")) {
      storySetups.push(setup);
    }
  };

  /* Zdjęcie pinu po jednorazowej sekwencji bez skoku: sekcja zostaje w tym samym miejscu okna,
     a scrollY koryguje się o wysokość usuniętego pin-spacera (i ewentualną zmianę układu). */
  const releaseStoryPin = (trigger, section, applyStaticLayout) => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const topBefore = section.getBoundingClientRect().top;

    root.style.scrollBehavior = "auto";
    trigger.kill(true);
    applyStaticLayout();
    const topAfter = section.getBoundingClientRect().top;
    window.scrollTo(0, window.scrollY + (topAfter - topBefore));
    ScrollTrigger.refresh();
    root.style.scrollBehavior = previousScrollBehavior;
  };

  /* ==================================
  // Desktop diagram scroll experience
  ================================== */
  initializeStoryNow(() => {
   if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    const storyMedia = gsap.matchMedia();

    storyMedia.add("(min-width: 1024px)", () => {
      const section = document.querySelector(".stats-how-it-works");
      const desktop = section?.querySelector(".scheme-desktop");
      const story = section?.querySelector(".scheme-story");
      const visual = story?.querySelector(".scheme-story__visual");
      const diagram = visual?.querySelector(".scheme-diagram");
      const header = desktop?.querySelector(".header-card-partners");
      const content = story?.querySelector(".scheme-story__content");
      const eyebrow = content?.querySelector(".scheme-story__eyebrow");
      const stepCounter = content?.querySelector(".scheme-story__step");
      const progress = content?.querySelector(".scheme-story__progress i");
      const total = content?.querySelector(".scheme-story__total");
      const tooltips = content ? Array.from(content.querySelectorAll("[data-scheme-tooltip]")) : [];

      if (!section || !desktop || !story || !visual || !diagram || !header || !content || !tooltips.length) {
        return;
      }

      if (section.dataset.scrollStoryCompleted === "true") {
        section.classList.add("scheme-scroll-story", "scheme-scroll-story-complete");
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent("scheme:desktop-interactive", {
            detail: { diagram }
          }));
        });

        return () => {
          section.classList.remove("scheme-scroll-story", "scheme-scroll-story-complete");
        };
      }

      const storyKeys = ["finance", "shops"];
      const steps = storyKeys.map(key => {
        const tooltip = tooltips.find(item => item.dataset.schemeTooltip === key);
        return {
          key,
          tooltip,
          node: diagram.querySelector(`[data-tooltip="${key}"]`)
        };
      }).filter(step => step.node && step.tooltip);

      if (steps.length !== storyKeys.length) {
        return;
      }

      const stepTooltips = steps.map(step => step.tooltip);
      if (total) {
        total.textContent = String(steps.length).padStart(2, "0");
      }
      section.classList.add("scheme-scroll-story");
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });

      const svgNamespace = "http://www.w3.org/2000/svg";
      const routeSvg = document.createElementNS(svgNamespace, "svg");
      routeSvg.setAttribute("class", "scheme-story-route");
      routeSvg.setAttribute("viewBox", "0 0 1024 768");
      routeSvg.setAttribute("aria-hidden", "true");
      diagram.appendChild(routeSvg);

      const diagramRect = diagram.getBoundingClientRect();
      const coordinateScaleX = 1024 / diagramRect.width;
      const coordinateScaleY = 768 / diagramRect.height;
      const centers = steps.map(({ node }) => {
        const nodeRect = node.getBoundingClientRect();
        return {
          x: (nodeRect.left - diagramRect.left + nodeRect.width / 2) * coordinateScaleX,
          y: (nodeRect.top - diagramRect.top + nodeRect.height / 2) * coordinateScaleY
        };
      });

      const routes = centers.slice(0, -1).map((start, index) => {
        const end = centers[index + 1];
        const direction = end.x >= start.x ? 1 : -1;
        const bend = Math.max(70, Math.abs(end.x - start.x) * .42);
        const path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("class", "scheme-story-route__path");
        path.setAttribute(
          "d",
          `M ${start.x} ${start.y} C ${start.x + bend * direction} ${start.y}, ${end.x - bend * direction} ${end.y}, ${end.x} ${end.y}`
        );
        routeSvg.appendChild(path);

        const length = path.getTotalLength();
        gsap.set(path, {
          autoAlpha: 0,
          strokeDasharray: length,
          strokeDashoffset: length
        });
        return path;
      });

      const nodes = steps.map(step => step.node);
      const getLayout = () => {
        const storyRect = story.getBoundingClientRect();
        const visualRect = visual.getBoundingClientRect();
        const fullScale = Math.min(
          (storyRect.width - 16) / 1024,
          (window.innerHeight - 180) / 768,
          .98
        );
        const zoomScale = Math.min(Math.max(fullScale * 1.62, 1.08), 1.55);

        return {
          storyRect,
          visualRect,
          full: {
            scale: fullScale,
            x: (storyRect.width - 1024 * fullScale) / 2 - (visualRect.left - storyRect.left),
            y: (visualRect.height - 768 * fullScale) / 2
          },
          zoomScale
        };
      };

      const getFocus = index => {
        const layout = getLayout();
        const center = centers[index];
        const focusWidth = layout.storyRect.width * .64;
        return {
          scale: layout.zoomScale,
          x: focusWidth * .48 - center.x * layout.zoomScale,
          y: layout.visualRect.height * .5 - center.y * layout.zoomScale
        };
      };

      const getFull = property => getLayout().full[property];
      const stepDigits = index => ({
        "data-tens": Math.floor((index + 1) / 10),
        "data-ones": (index + 1) % 10
      });
      const setDesktopStoryActive = active => {
        section.classList.toggle("scheme-scroll-story-active", active);

        if (active) {
          diagram.querySelectorAll("[data-tooltip].is-active").forEach(node => {
            node.classList.remove("is-active");
          });
          tooltips.forEach(tooltip => tooltip.classList.remove("is-active"));
        }
      };

      gsap.set(diagram, {
        x: () => getFull("x"),
        y: () => getFull("y"),
        scale: () => getFull("scale")
      });
      gsap.set(tooltips, { autoAlpha: 0, y: 30, pointerEvents: "none" });
      gsap.set(eyebrow, { autoAlpha: 0, y: 12 });
      gsap.set(progress, { scaleX: 0 });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        section.dataset.scrollStoryCompleted = "true";
        section.classList.add("scheme-scroll-story-complete");
        document.dispatchEvent(new CustomEvent("scheme:desktop-interactive", {
          detail: { diagram }
        }));

        return () => {
          section.classList.remove("scheme-scroll-story", "scheme-scroll-story-complete");
          routeSvg.remove();
          gsap.set([visual, eyebrow, progress], { clearProps: "all" });
          gsap.set(diagram, { clearProps: "transform" });
          gsap.set(tooltips, { clearProps: "opacity,visibility,transform,pointerEvents" });
        };
      }

      let completeDesktopStory = () => {};
      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
          pin: true,
          scrub: .6,
          anticipatePin: 1,
          refreshPriority: 10,
          invalidateOnRefresh: true,
          onEnter: () => setDesktopStoryActive(true),
          onEnterBack: () => setDesktopStoryActive(true),
          onLeaveBack: () => setDesktopStoryActive(false)
        }
      });

      const storyTrigger = timeline.scrollTrigger;
      // Jednorazowe zakończenie: odpala się, gdy animacja (po wygładzeniu scrub) faktycznie dojdzie do końca.
      // Ostatnia klatka osi czasu = stan statyczny sekcji, więc zdjęcie pinu jest niewidoczne.
      let desktopCompletionScheduled = false;
      completeDesktopStory = () => {
        if (desktopCompletionScheduled || section.dataset.scrollStoryCompleted === "true") {
          return;
        }

        desktopCompletionScheduled = true;

        requestAnimationFrame(() => {
          section.dataset.scrollStoryCompleted = "true";

          releaseStoryPin(storyTrigger, section, () => {
            timeline.kill();
            routeSvg.remove();
            section.classList.add("scheme-scroll-story-complete");
            section.classList.remove("scheme-scroll-story-active");
            gsap.set([desktop, header, visual, eyebrow, progress], { clearProps: "all" });
            gsap.set(nodes, { clearProps: "opacity,transform,filter,visibility" });
            gsap.set(tooltips, { clearProps: "opacity,visibility,transform,pointerEvents" });
            gsap.set(diagram, {
              x: () => getFull("x"),
              y: () => getFull("y"),
              scale: () => getFull("scale")
            });
          });

          document.dispatchEvent(new CustomEvent("scheme:desktop-interactive", {
            detail: { diagram }
          }));
        });
      };
      timeline.eventCallback("onComplete", completeDesktopStory);

      timeline
        .to(header, { autoAlpha: 0, y: -32, duration: .55 })
        .to(visual, { width: "64%", clipPath: "inset(0px round 24px)", duration: .9 }, "<")
        .to(nodes, { opacity: .68, duration: .55 }, "<")
        .to(diagram, {
          x: () => getFocus(0).x,
          y: () => getFocus(0).y,
          scale: () => getFocus(0).scale,
          duration: .9
        }, 0)
        .to(nodes[0], { opacity: 1, scale: 1.06, duration: .45 }, "<+.35")
        .set(stepCounter, { attr: stepDigits(0) }, "<")
        .to(eyebrow, { autoAlpha: 1, y: 0, duration: .35 }, "<")
        .to(progress, { scaleX: 1 / steps.length, duration: .45 }, "<")
        .to(stepTooltips[0], { autoAlpha: 1, y: 0, pointerEvents: "auto", duration: .55 }, "<+.05")
        .to({}, { duration: 1.25 });

      for (let index = 1; index < steps.length; index += 1) {
        const previous = index - 1;

        timeline
          .addLabel(`step-${index + 1}`)
          .to(stepTooltips[previous], {
            autoAlpha: 0,
            y: -24,
            pointerEvents: "none",
            duration: .3
          })
          .to(nodes[previous], { opacity: .68, scale: 1, duration: .3 }, "<")
          .to(routes[previous], {
            autoAlpha: 1,
            strokeDashoffset: 0,
            duration: .8,
            ease: "power1.inOut"
          }, "<")
          .to(diagram, {
            x: () => getFocus(index).x,
            y: () => getFocus(index).y,
            scale: () => getFocus(index).scale,
            duration: 1
          }, "<+.12")
          .to(routes[previous], { autoAlpha: 0, duration: .24 })
          .to(nodes[index], { opacity: 1, scale: 1.06, duration: .35 }, "<")
          .set(stepCounter, { attr: stepDigits(index) }, "<")
          .to(progress, { scaleX: (index + 1) / steps.length, duration: .35 }, "<")
          .to(stepTooltips[index], {
            autoAlpha: 1,
            y: 0,
            pointerEvents: "auto",
            duration: .5
          }, "<+.04")
          .to({}, { duration: 1.25 });
      }

      timeline
        .to(stepTooltips[stepTooltips.length - 1], {
          autoAlpha: 0,
          y: -24,
          pointerEvents: "none",
          duration: .35
        })
        .to(nodes, { opacity: 1, scale: 1, duration: .5 }, "<")
        .to(eyebrow, { autoAlpha: 0, y: -12, duration: .35 }, "<")
        .to(diagram, {
          x: () => getFull("x"),
          y: () => getFull("y"),
          scale: () => getFull("scale"),
          duration: 1.05
        })
        .to(visual, { width: "100%", clipPath: "inset(-100vw)", duration: .85 }, "<")
        .to(header, { autoAlpha: 1, y: 0, duration: .5 }, "<+.35");

      requestAnimationFrame(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        section.classList.remove(
          "scheme-scroll-story",
          "scheme-scroll-story-active",
          "scheme-scroll-story-complete"
        );
        routeSvg.remove();
        stepCounter.setAttribute("data-tens", "0");
        stepCounter.setAttribute("data-ones", "1");
        gsap.set([desktop, header, visual, eyebrow, progress], { clearProps: "all" });
        gsap.set(diagram, { clearProps: "transform" });
        gsap.set(nodes, { clearProps: "opacity,transform,filter,visibility" });
        gsap.set(tooltips, { clearProps: "opacity,visibility,transform,pointerEvents" });
      };
    });
  }
  });

  /* =================================
  // Mobile diagram scroll experience
  ================================= */
  initializeStoryNow(() => {
   if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    const mobileStoryMedia = gsap.matchMedia();

    mobileStoryMedia.add(
      "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
      () => {
        const section = document.querySelector(".stats-how-it-works");
        const mobile = section?.querySelector(".scheme-mobile");
        const diagram = mobile?.querySelector(".scheme-mobile-diagram");
        const header = mobile?.querySelector(":scope > .header-card-partners");
        const sheets = mobile ? Array.from(mobile.querySelectorAll("[data-mobile-tooltip]")) : [];
        const backdrop = mobile?.querySelector("[data-mobile-tooltip-backdrop]");

        if (!section || !mobile || !diagram || !header || !sheets.length) {
          return;
        }

        if (section.dataset.scrollStoryCompleted === "true") {
          return;
        }

        const storyKeys = ["finance", "shops"];
        const steps = storyKeys.map(key => {
          const sheet = sheets.find(item => item.dataset.mobileTooltip === key);
          return {
            key,
            sheet,
            node: diagram.querySelector(`[data-mobile-tooltip-trigger="${key}"]`)
          };
        }).filter(step => step.node && step.sheet);

        if (steps.length !== storyKeys.length) {
          return;
        }

        const stepSheets = steps.map(step => step.sheet);

        // Naturalny (statyczny) układ nagłówka i diagramu względem sekcji. Ostatnia klatka sekwencji
        // ustawia je dokładnie tak, więc po zdjęciu pinu i powrocie do zwykłego układu nic nie przeskakuje.
        const natural = { headerX: 0, headerY: 0, x: 0, y: 0, scale: 1, sectionHeight: 0 };
        const measureNatural = () => {
          const wasStory = section.classList.contains("scheme-mobile-scroll-story");
          const diagramTransform = diagram.style.transform;
          const headerTransform = header.style.transform;
          diagram.style.transform = "none";
          header.style.transform = "none";
          mobile.style.height = "";
          // ScrollTrigger w trakcie pinu wpisuje sekcji inline padding: 0 i stałe wymiary; do pomiaru je zdejmujemy
          const sectionCss = section.style.cssText;
          ["padding", "height", "max-height", "width", "max-width"].forEach(prop => section.style.removeProperty(prop));

          section.classList.remove("scheme-mobile-scroll-story");
          const sectionRect = section.getBoundingClientRect();
          const headerRect = header.getBoundingClientRect();
          const diagramRect = diagram.getBoundingClientRect();

          section.classList.add("scheme-mobile-scroll-story");
          const storySectionRect = section.getBoundingClientRect();
          const storyHeaderRect = header.getBoundingClientRect();
          const storyDiagramRect = diagram.getBoundingClientRect();

          natural.headerX = (headerRect.left - sectionRect.left) - (storyHeaderRect.left - storySectionRect.left);
          natural.headerY = (headerRect.top - sectionRect.top) - (storyHeaderRect.top - storySectionRect.top);
          natural.x = (diagramRect.left - sectionRect.left) - (storyDiagramRect.left - storySectionRect.left);
          natural.y = (diagramRect.top - sectionRect.top) - (storyDiagramRect.top - storySectionRect.top);
          natural.scale = diagramRect.width / 382;
          natural.sectionHeight = sectionRect.height;

          // Scena sekwencji ma tę samą wysokość co sekcja w zwykłym układzie: po zdjęciu pinu
          // nic pod sekcją się nie przesuwa. Animacja dzieje się w górnym ekranie sceny,
          // a arkusze opisów są kotwiczone do dołu ekranu (--story-extra).
          mobile.style.height = `${Math.round(natural.sectionHeight)}px`;
          section.style.setProperty("--story-extra", `${Math.max(0, Math.round(natural.sectionHeight - window.innerHeight))}px`);

          if (!wasStory) {
            section.classList.remove("scheme-mobile-scroll-story");
          }
          const storyExtra = section.style.getPropertyValue("--story-extra");
          section.style.cssText = sectionCss;
          section.style.setProperty("--story-extra", storyExtra);
          diagram.style.transform = diagramTransform;
          header.style.transform = headerTransform;
        };
        measureNatural();
        section.classList.add("scheme-mobile-scroll-story");
        document.body.classList.remove("scheme-mobile-tooltip-open");
        backdrop?.classList.remove("is-active");
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });

        const svgNamespace = "http://www.w3.org/2000/svg";
        const routeSvg = document.createElementNS(svgNamespace, "svg");
        routeSvg.setAttribute("class", "scheme-mobile-story-route");
        routeSvg.setAttribute("viewBox", "0 0 382 1210");
        routeSvg.setAttribute("aria-hidden", "true");
        diagram.appendChild(routeSvg);

        const diagramRect = diagram.getBoundingClientRect();
        const coordinateScaleX = 382 / diagramRect.width;
        const coordinateScaleY = 1210 / diagramRect.height;
        const centers = steps.map(({ node }) => {
          const nodeRect = node.getBoundingClientRect();
          return {
            x: (nodeRect.left - diagramRect.left + nodeRect.width / 2) * coordinateScaleX,
            y: (nodeRect.top - diagramRect.top + nodeRect.height / 2) * coordinateScaleY
          };
        });

        const routes = centers.slice(0, -1).map((start, index) => {
          const end = centers[index + 1];
          const direction = end.x >= start.x ? 1 : -1;
          const bend = Math.max(34, Math.abs(end.x - start.x) * .46);
          const path = document.createElementNS(svgNamespace, "path");
          path.setAttribute("class", "scheme-mobile-story-route__path");
          path.setAttribute(
            "d",
            `M ${start.x} ${start.y} C ${start.x + bend * direction} ${start.y}, ${end.x - bend * direction} ${end.y}, ${end.x} ${end.y}`
          );
          routeSvg.appendChild(path);

          const length = path.getTotalLength();
          gsap.set(path, {
            autoAlpha: 0,
            strokeDasharray: length,
            strokeDashoffset: length
          });
          return path;
        });

        const nodes = steps.map(step => step.node);
        const getLayout = () => {
          const stageRect = mobile.getBoundingClientRect();
          const visibleHeight = Math.min(stageRect.height, window.innerHeight);
          const isTablet = window.matchMedia("(min-width: 577px)").matches;
          const topInset = Math.max(
            isTablet ? 120 : 140,
            header.offsetHeight + (isTablet ? 48 : 40)
          );
          const bottomInset = isTablet ? 24 : 16;
          const fullScale = Math.min(
            (stageRect.width - 30) / 382,
            (visibleHeight - topInset - bottomInset) / 1210,
            .78
          );
          const zoomScale = Math.min(Math.max(fullScale * 1.75, 1.05), 1.25);
          const fullHeight = 1210 * fullScale;

          return {
            stageRect,
            full: {
              scale: fullScale,
              x: (stageRect.width - 382 * fullScale) / 2,
              y: topInset + Math.max(0, (visibleHeight - topInset - bottomInset - fullHeight) / 2)
            },
            visibleHeight,
            zoomScale
          };
        };

        const getFocus = index => {
          const layout = getLayout();
          const center = centers[index];
          return {
            scale: layout.zoomScale,
            x: layout.stageRect.width / 2 - center.x * layout.zoomScale,
            y: Math.min(layout.visibleHeight * .3, 250) - center.y * layout.zoomScale
          };
        };

        const getFull = property => getLayout().full[property];
        gsap.set(diagram, {
          x: () => getFull("x"),
          y: () => getFull("y"),
          scale: () => getFull("scale")
        });
        gsap.set(sheets, {
          autoAlpha: 0,
          yPercent: 120,
          pointerEvents: "none"
        });
        sheets.forEach(sheet => {
          sheet.classList.remove("is-active");
          sheet.setAttribute("aria-hidden", "true");
        });

        const syncSheetAccessibility = () => {
          sheets.forEach(sheet => {
            const isVisible = Number(gsap.getProperty(sheet, "opacity")) > .5;
            sheet.setAttribute("aria-hidden", isVisible ? "false" : "true");
          });
        };

        let completeMobileStory = () => {};
        const timeline = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          onUpdate: syncSheetAccessibility,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 2.6)}`,
            pin: true,
            scrub: .4,
            anticipatePin: 1,
            refreshPriority: 10,
            invalidateOnRefresh: true
          }
        });

        const mobileStoryTrigger = timeline.scrollTrigger;
        let mobileCompletionScheduled = false;
        completeMobileStory = () => {
          if (mobileCompletionScheduled || section.dataset.scrollStoryCompleted === "true") {
            return;
          }

          mobileCompletionScheduled = true;

          requestAnimationFrame(() => {
            section.dataset.scrollStoryCompleted = "true";
            ScrollTrigger.removeEventListener("refreshInit", measureNatural);

            releaseStoryPin(mobileStoryTrigger, section, () => {
              timeline.kill();
              routeSvg.remove();
              section.classList.remove("scheme-mobile-scroll-story");
              section.style.removeProperty("--story-extra");
              gsap.set([mobile, header, ...sheets], { clearProps: "all" });
              gsap.set(diagram, { clearProps: "transform" });
              gsap.set(nodes, { clearProps: "opacity,transform,filter,visibility" });
              sheets.forEach(sheet => {
                sheet.classList.remove("is-active");
                sheet.setAttribute("aria-hidden", "true");
              });
              backdrop?.classList.remove("is-active");
              document.body.classList.remove("scheme-mobile-tooltip-open");
            });
          });
        };
        timeline.eventCallback("onComplete", completeMobileStory);

        timeline
          .to(header, { autoAlpha: 0, y: -24, duration: .5 })
          .to(nodes, { opacity: .68, duration: .5 }, "<")
          .to(diagram, {
            x: () => getFocus(0).x,
            y: () => getFocus(0).y,
            scale: () => getFocus(0).scale,
            duration: 1.05
          }, "<")
          .to(nodes[0], { opacity: 1, scale: 1.05, duration: .4 }, "<+.3")
          .to(stepSheets[0], {
            autoAlpha: 1,
            yPercent: 0,
            pointerEvents: "auto",
            duration: .5
          }, "<+.05")
          .to({}, { duration: 1 });

        for (let index = 1; index < steps.length; index += 1) {
          const previous = index - 1;

          timeline
            .to(stepSheets[previous], {
              autoAlpha: 0,
              yPercent: 120,
              pointerEvents: "none",
              duration: .32
            })
            .to(nodes[previous], { opacity: .68, scale: 1, duration: .28 }, "<")
            .to(routes[previous], {
              autoAlpha: 1,
              strokeDashoffset: 0,
              duration: .72,
              ease: "power1.inOut"
            }, "<")
            .to(diagram, {
              x: () => getFocus(index).x,
              y: () => getFocus(index).y,
              scale: () => getFocus(index).scale,
              duration: .92
            }, "<+.1")
            .to(routes[previous], { autoAlpha: 0, duration: .22 })
            .to(nodes[index], { opacity: 1, scale: 1.05, duration: .32 }, "<")
            .to(stepSheets[index], {
              autoAlpha: 1,
              yPercent: 0,
              pointerEvents: "auto",
              duration: .48
            }, "<+.03")
            .to({}, { duration: 1 });
        }

        timeline
          .to(stepSheets[stepSheets.length - 1], {
            autoAlpha: 0,
            yPercent: 120,
            pointerEvents: "none",
            duration: .22
          })
          .to(nodes, { opacity: 1, scale: 1, duration: .25 }, "<")
          .to(diagram, {
            x: () => natural.x,
            y: () => natural.y,
            scale: () => natural.scale,
            duration: .7
          })
          .to(header, {
            autoAlpha: 1,
            x: () => natural.headerX,
            y: () => natural.headerY,
            duration: .45
          }, "<+.2");

        ScrollTrigger.addEventListener("refreshInit", measureNatural);

        requestAnimationFrame(() => {
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", measureNatural);
          timeline.scrollTrigger?.kill();
          timeline.kill();
          section.classList.remove("scheme-mobile-scroll-story");
          section.style.removeProperty("--story-extra");
          routeSvg.remove();
          gsap.set([mobile, header, ...sheets], { clearProps: "all" });
          gsap.set(diagram, { clearProps: "transform" });
          gsap.set(nodes, { clearProps: "opacity,transform,filter,visibility" });
          sheets.forEach(sheet => sheet.setAttribute("aria-hidden", "true"));
        };
      }
    );
  }
  });

  function enableDesktopSchemeTooltips(diagram) {
    if (!diagram || diagram.dataset.desktopTooltipsEnabled === "true") {
      return;
    }

    const storySection = diagram.closest(".stats-how-it-works");

    const tooltipScope = diagram.closest(".scheme-story") || storySection;
    const nodes = diagram.querySelectorAll("[data-tooltip]");
    const tooltips = tooltipScope?.querySelectorAll("[data-scheme-tooltip]") || [];

    if (!nodes.length || !tooltips.length) {
      return;
    }

    diagram.dataset.desktopTooltipsEnabled = "true";
    let hideTimer = null;
    let activeKey = null;

    function clearTooltips() {
      activeKey = null;
      nodes.forEach(node => node.classList.remove("is-active"));
      tooltips.forEach(tooltip => tooltip.classList.remove("is-active"));
    }

    function positionTooltip(tooltip) {
      const container = diagram.closest(".scheme-story") || storySection;

      if (!container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const diagramRect = diagram.getBoundingClientRect();
      const tooltipStyle = getComputedStyle(tooltip);
      const canvasWidth = parseFloat(getComputedStyle(diagram).getPropertyValue("--canvas-w")) || 1024;
      const canvasHeight = parseFloat(getComputedStyle(diagram).getPropertyValue("--canvas-h")) || 768;
      const coordinateX = parseFloat(tooltipStyle.getPropertyValue("--tx")) || 0;
      const coordinateY = parseFloat(tooltipStyle.getPropertyValue("--ty")) || 0;
      const left = diagramRect.left - containerRect.left
        + coordinateX * (diagramRect.width / canvasWidth);
      const top = diagramRect.top - containerRect.top
        + coordinateY * (diagramRect.height / canvasHeight);

      tooltip.style.setProperty("--scheme-tooltip-x", `${Math.round(left)}px`);
      tooltip.style.setProperty("--scheme-tooltip-y", `${Math.round(top)}px`);
    }

    function showTooltip(key) {
      if (storySection?.classList.contains("scheme-scroll-story-active")) {
        return;
      }

      clearTimeout(hideTimer);
      clearTooltips();

      const node = diagram.querySelector(`[data-tooltip="${key}"]`);
      const tooltip = tooltipScope.querySelector(`[data-scheme-tooltip="${key}"]`);

      if (node) {
        node.classList.add("is-active");
      }

      if (tooltip) {
        positionTooltip(tooltip);
        tooltip.classList.add("is-active");
        activeKey = key;
      }
    }

    function scheduleHide() {
      clearTimeout(hideTimer);

      hideTimer = setTimeout(() => {
        clearTooltips();
      }, 120);
    }

    nodes.forEach(node => {
      const key = node.dataset.tooltip;
      node.addEventListener("mouseenter", () => showTooltip(key));
      node.addEventListener("focus", () => showTooltip(key));

      node.addEventListener("mouseleave", scheduleHide);
      node.addEventListener("blur", scheduleHide);

      node.addEventListener("click", event => {
        event.preventDefault();
        showTooltip(key);
      });
    });

    tooltips.forEach(tooltip => {
      tooltip.addEventListener("mouseenter", () => {
        clearTimeout(hideTimer);
      });

      tooltip.addEventListener("mouseleave", scheduleHide);
    });

    diagram.addEventListener("mouseleave", scheduleHide);

    window.addEventListener("resize", () => {
      if (activeKey) {
        const node = diagram.querySelector(`[data-tooltip="${activeKey}"]`);
        const tooltip = tooltipScope.querySelector(`[data-scheme-tooltip="${activeKey}"]`);

        if (node && tooltip) {
          positionTooltip(tooltip);
        }
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        clearTooltips();
      }
    });
  }

  document.addEventListener("scheme:desktop-interactive", event => {
    enableDesktopSchemeTooltips(event.detail?.diagram);
  });

  initializeWhenNear(".stats-how-it-works", () => {
    document.querySelectorAll(".scheme-diagram").forEach(enableDesktopSchemeTooltips);
  });


  const mobileScheme = document.querySelector(".scheme-mobile");

  if (!mobileScheme) {
    return;
  }

  const triggers = mobileScheme.querySelectorAll("[data-mobile-tooltip-trigger]");
  const sheets = document.querySelectorAll("[data-mobile-tooltip]");
  const backdrop = document.querySelector("[data-mobile-tooltip-backdrop]");
  const closeButtons = document.querySelectorAll("[data-mobile-tooltip-close]");

  function closeMobileTooltip() {
    sheets.forEach(sheet => {
      sheet.classList.remove("is-active");
      sheet.setAttribute("aria-hidden", "true");
    });

    backdrop?.classList.remove("is-active");
    document.body.classList.remove("scheme-mobile-tooltip-open");
  }

  function openMobileTooltip(key) {
    const sheet = document.querySelector(`[data-mobile-tooltip="${key}"]`);

    if (!sheet) {
      return;
    }

    closeMobileTooltip();

    sheet.classList.add("is-active");
    sheet.setAttribute("aria-hidden", "false");

    backdrop?.classList.add("is-active");
    document.body.classList.add("scheme-mobile-tooltip-open");
  }

  triggers.forEach(trigger => {
    trigger.addEventListener("click", event => {
      if (!window.matchMedia("(max-width: 1023px)").matches) {
        return;
      }

      if (mobileScheme.closest(".scheme-mobile-scroll-story")) {
        return;
      }

      event.preventDefault();

      const key = trigger.dataset.mobileTooltipTrigger;
      openMobileTooltip(key);
    });
  });

  closeButtons.forEach(button => {
    button.addEventListener("click", closeMobileTooltip);
  });

  backdrop?.addEventListener("click", closeMobileTooltip);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMobileTooltip();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCommon, { once: true });
} else {
  initializeCommon();
}
