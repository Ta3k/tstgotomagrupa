let APP;

document.addEventListener("DOMContentLoaded", function () {
  'use strict';

  class App {
    constructor () {
      this.canvas = document.querySelector('canvas');

      if (!this.canvas) {
        console.warn('Brak elementu canvas');
        return;
      }

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

      let id = 0;

      for (let x = 0; x < this.cols; x += 1) {
        for (let y = 0; y < this.rows; y += 1) {
          this.dots.push(
            new Dot(id, x * this.scl, y * this.scl, this.context, this.scl)
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
        gsap.to(this.new, 0.4, {
          radius: 5
        });
      } else if (this.isHover && this.isCenter) {
        gsap.to(this.new, 0.4, {
          radius: this.isClosest ? 9 : 6
        });
      } else {
        gsap.to(this.new, 0.4, {
          radius: 3
        });
      }
    }

    render () {
      this.context.beginPath();
      this.context.arc(this.new.x, this.new.y, this.new.radius, 0, 2 * Math.PI, false);
      this.context.fillStyle = this.new.color;
      this.context.fill();
    }
  }

  function init () {
    APP = new App();

    if (!APP.canvas) {
      return;
    }

    events();
    loop();
  }

  function loop () {
    APP.render();
    requestAnimationFrame(loop);
  }

  function events () {
    document.addEventListener('mousemove', APP.mousemoveHandler, false);
    document.addEventListener('mouseleave', APP.mouseleaveHandler, false);
    window.addEventListener('resize', APP.resize, false);
  }

  init();

  /* =======================
  // Menu
  ======================= */
  var body = document.querySelector("body"),
  menuOpenIcon = document.querySelector(".nav__icon-menu"),
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

  /* =======================
  // Animation Load Page
  ======================= */
  setTimeout(function(){
    body.classList.add("is-in");
  },150)

  /* ==================================
  // Stop Animations After All Have Run
  ================================== */
  setTimeout(function(){
    body.classList.add("stop-animations");
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
  reframe(".post__content iframe:not(.reframe-off), .page__content iframe:not(.reframe-off)");


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

    btnScrollToTop.addEventListener("click", function () {
      if (window.scrollY !== 0) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth"
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
        document.documentElement.classList.add("smooth-page-scroll");

        const hero = document.querySelector(".c-hero");
        const heroLeft = hero?.querySelector(".c-hero__left");
        const heroRight = hero?.querySelector(".c-hero__right");

        if (hero && heroLeft && heroRight) {
          gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 1
            }
          })
            .to(heroLeft, { y: -72, autoAlpha: .35, ease: "none" }, 0)
            .to(heroRight, { y: 90, scale: .9, rotation: 3, ease: "none" }, 0);
        }

        const sectionSelectors = [
          ".stats-clients-results",
          ".stats-solutions-partners",
          ".stats-solutions-results",
          ".find-out-more"
        ];

        sectionSelectors.forEach(selector => {
          const section = document.querySelector(selector);

          if (!section) {
            return;
          }

          section.classList.add("scroll-choreography-section");
          gsap.fromTo(section,
            { clipPath: "inset(4% 2% round 30px)" },
            {
              clipPath: "inset(0% 0% round 0px)",
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top 96%",
                end: "top 58%",
                scrub: 1,
                invalidateOnRefresh: true
              }
            }
          );
        });

        const clients = document.querySelector(".stats-clients-results");

        if (clients) {
          const gridItems = clients.querySelectorAll(".stat-card, .logo-item");
          const banners = clients.querySelectorAll(".partner-banner");

          gsap.fromTo(gridItems,
            { autoAlpha: .18, y: 88, scale: .92 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              stagger: .08,
              ease: "none",
              scrollTrigger: {
                trigger: clients.querySelector(".grid-container") || clients,
                start: "top 88%",
                end: "bottom 58%",
                scrub: 1
              }
            }
          );

          banners.forEach((banner, index) => {
            gsap.fromTo(banner,
              { autoAlpha: .25, x: index % 2 === 0 ? -90 : 90, scale: .97 },
              {
                autoAlpha: 1,
                x: 0,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: banner,
                  start: "top 94%",
                  end: "top 66%",
                  scrub: 1
                }
              }
            );
          });
        }

        const partners = document.querySelector(".stats-solutions-partners");

        if (partners) {
          const heading = partners.querySelector(".header-card-partners");
          const slider = partners.querySelector(".slider-container");

          gsap.fromTo(heading,
            { autoAlpha: .25, x: -80 },
            {
              autoAlpha: 1,
              x: 0,
              ease: "none",
              scrollTrigger: {
                trigger: partners,
                start: "top 90%",
                end: "top 62%",
                scrub: 1
              }
            }
          );

          gsap.fromTo(slider,
            { autoAlpha: .2, x: 110 },
            {
              autoAlpha: 1,
              x: 0,
              ease: "none",
              scrollTrigger: {
                trigger: partners,
                start: "top 82%",
                end: "center 58%",
                scrub: 1
              }
            }
          );

        }

        const solutions = document.querySelector(".stats-solutions-results");

        if (solutions) {
          const heading = solutions.querySelector(".header-card-solutions");
          const cards = solutions.querySelectorAll(".stat-card-solutions");

          gsap.fromTo(heading,
            { autoAlpha: .2, y: 70 },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: heading,
                start: "top 92%",
                end: "top 62%",
                scrub: 1
              }
            }
          );

          gsap.fromTo(cards,
            { autoAlpha: .16, y: 100, scale: .9, rotationX: 10 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotationX: 0,
              stagger: .1,
              ease: "none",
              scrollTrigger: {
                trigger: solutions.querySelector(".grid-container-solutions") || solutions,
                start: "top 86%",
                end: "bottom 68%",
                scrub: 1
              }
            }
          );
        }

        const finalSection = document.querySelector(".find-out-more");

        if (finalSection) {
          const heading = finalSection.querySelector(".section__info");
          const cards = finalSection.querySelectorAll(".c-blog-card__inner");

          gsap.fromTo(heading,
            { autoAlpha: .2, y: 60 },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: finalSection,
                start: "top 98%",
                end: "top 76%",
                scrub: 1
              }
            }
          );

          gsap.fromTo(cards,
            { autoAlpha: .18, y: 110, scale: .92 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              stagger: .12,
              ease: "none",
              scrollTrigger: {
                trigger: finalSection,
                start: "top 74%",
                end: "bottom 66%",
                scrub: 1
              }
            }
          );
        }

        return () => {
          document.documentElement.classList.remove("smooth-page-scroll");
          document.querySelectorAll(".scroll-choreography-section").forEach(section => {
            section.classList.remove("scroll-choreography-section");
          });
        };
      }
    );
  }

  /* ==================================
  // Desktop diagram scroll experience
  ================================== */
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
      const tooltips = content ? Array.from(content.querySelectorAll("[data-scheme-tooltip]")) : [];

      if (!section || !desktop || !story || !visual || !diagram || !header || !content || !tooltips.length) {
        return;
      }

      const steps = tooltips.map(tooltip => {
        const key = tooltip.dataset.schemeTooltip;
        return {
          key,
          tooltip,
          node: diagram.querySelector(`[data-tooltip="${key}"]`)
        };
      }).filter(step => step.node);

      if (steps.length !== tooltips.length) {
        return;
      }

      section.classList.add("scheme-scroll-story");
      gsap.registerPlugin(ScrollTrigger);

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

      gsap.set(diagram, {
        x: () => getFull("x"),
        y: () => getFull("y"),
        scale: () => getFull("scale")
      });
      gsap.set(tooltips, { autoAlpha: 0, y: 30, pointerEvents: "none" });
      gsap.set(eyebrow, { autoAlpha: 0, y: 12 });
      gsap.set(progress, { scaleX: 0 });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const firstFocus = getFocus(0);
        gsap.set(diagram, firstFocus);
        gsap.set(visual, { clipPath: "inset(0px round 24px)" });
        gsap.set(tooltips[0], { autoAlpha: 1, y: 0, pointerEvents: "auto" });
        gsap.set(eyebrow, { autoAlpha: 1, y: 0 });
        gsap.set(progress, { scaleX: 1 / steps.length });

        return () => {
          section.classList.remove("scheme-scroll-story");
          routeSvg.remove();
          gsap.set([diagram, visual, ...tooltips, eyebrow, progress], { clearProps: "all" });
        };
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * (steps.length * .62 + 1.4))}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 10,
          invalidateOnRefresh: true
        }
      });

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
        .to(tooltips[0], { autoAlpha: 1, y: 0, pointerEvents: "auto", duration: .55 }, "<+.05")
        .to({}, { duration: 1.25 });

      for (let index = 1; index < steps.length; index += 1) {
        const previous = index - 1;

        timeline
          .addLabel(`step-${index + 1}`)
          .to(tooltips[previous], {
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
          .to(tooltips[index], {
            autoAlpha: 1,
            y: 0,
            pointerEvents: "auto",
            duration: .5
          }, "<+.04")
          .to({}, { duration: 1.25 });
      }

      timeline
        .to(tooltips[tooltips.length - 1], {
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
        .to(desktop, { autoAlpha: .18, scale: .985, duration: .45 });

      requestAnimationFrame(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        section.classList.remove("scheme-scroll-story");
        routeSvg.remove();
        stepCounter.setAttribute("data-tens", "0");
        stepCounter.setAttribute("data-ones", "1");
        gsap.set([desktop, header, diagram, visual, ...nodes, ...tooltips, eyebrow, progress], { clearProps: "all" });
      };
    });
  }

  /* =================================
  // Mobile diagram scroll experience
  ================================= */
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

        const steps = sheets.map(sheet => {
          const key = sheet.dataset.mobileTooltip;
          return {
            key,
            sheet,
            node: diagram.querySelector(`[data-mobile-tooltip-trigger="${key}"]`)
          };
        }).filter(step => step.node);

        if (steps.length !== sheets.length) {
          return;
        }

        section.classList.add("scheme-mobile-scroll-story");
        document.body.classList.remove("scheme-mobile-tooltip-open");
        backdrop?.classList.remove("is-active");
        gsap.registerPlugin(ScrollTrigger);

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
          const isTablet = window.matchMedia("(min-width: 577px)").matches;
          const topInset = Math.max(
            isTablet ? 120 : 140,
            header.offsetHeight + (isTablet ? 48 : 40)
          );
          const bottomInset = isTablet ? 24 : 16;
          const fullScale = Math.min(
            (stageRect.width - 30) / 382,
            (stageRect.height - topInset - bottomInset) / 1210,
            .78
          );
          const zoomScale = Math.min(Math.max(fullScale * 1.75, 1.05), 1.25);
          const fullHeight = 1210 * fullScale;

          return {
            stageRect,
            full: {
              scale: fullScale,
              x: (stageRect.width - 382 * fullScale) / 2,
              y: topInset + Math.max(0, (stageRect.height - topInset - bottomInset - fullHeight) / 2)
            },
            zoomScale
          };
        };

        const getFocus = index => {
          const layout = getLayout();
          const center = centers[index];
          return {
            scale: layout.zoomScale,
            x: layout.stageRect.width / 2 - center.x * layout.zoomScale,
            y: Math.min(layout.stageRect.height * .3, 250) - center.y * layout.zoomScale
          };
        };

        const getFull = property => getLayout().full[property];
        const getExitFull = property => {
          const stageRect = mobile.getBoundingClientRect();
          const scale = Math.min(
            (stageRect.width - 24) / 382,
            (stageRect.height - 24) / 1210,
            .78
          );
          const layout = {
            scale,
            x: (stageRect.width - 382 * scale) / 2,
            y: (stageRect.height - 1210 * scale) / 2
          };

          return layout[property];
        };

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

        const timeline = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          onUpdate: syncSheetAccessibility,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * (steps.length * .95 + 1.9))}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            refreshPriority: 10,
            invalidateOnRefresh: true
          }
        });

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
          .to(sheets[0], {
            autoAlpha: 1,
            yPercent: 0,
            pointerEvents: "auto",
            duration: .5
          }, "<+.05")
          .to({}, { duration: 1 });

        for (let index = 1; index < steps.length; index += 1) {
          const previous = index - 1;

          timeline
            .to(sheets[previous], {
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
            .to(sheets[index], {
              autoAlpha: 1,
              yPercent: 0,
              pointerEvents: "auto",
              duration: .48
            }, "<+.03")
            .to({}, { duration: 1 });
        }

        timeline
          .to(sheets[sheets.length - 1], {
            autoAlpha: 0,
            yPercent: 120,
            pointerEvents: "none",
            duration: .22
          })
          .to(nodes, { opacity: 1, scale: 1, duration: .25 }, "<")
          .to(diagram, {
            x: () => getExitFull("x"),
            y: () => getExitFull("y"),
            scale: () => getExitFull("scale"),
            duration: .55
          });

        requestAnimationFrame(() => {
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });

        return () => {
          timeline.scrollTrigger?.kill();
          timeline.kill();
          section.classList.remove("scheme-mobile-scroll-story");
          routeSvg.remove();
          gsap.set([mobile, header, diagram, ...nodes, ...sheets], { clearProps: "all" });
          sheets.forEach(sheet => sheet.setAttribute("aria-hidden", "true"));
        };
      }
    );
  }

  const diagrams = document.querySelectorAll(".scheme-diagram");
  console.log(diagrams);
  diagrams.forEach(diagram => {
    if (diagram.closest(".scheme-scroll-story")) {
      return;
    }

    console.log(diagram);
    const nodes = diagram.querySelectorAll("[data-tooltip]");
    const tooltips = diagram.querySelectorAll("[data-scheme-tooltip]");
    console.log(nodes);
    console.log(tooltips);
    let hideTimer = null;

    function clearTooltips() {
      nodes.forEach(node => node.classList.remove("is-active"));
      tooltips.forEach(tooltip => tooltip.classList.remove("is-active"));
    }

    function showTooltip(key) {
      clearTimeout(hideTimer);
      clearTooltips();

      const node = diagram.querySelector(`[data-tooltip="${key}"]`);
      const tooltip = diagram.querySelector(`[data-scheme-tooltip="${key}"]`);

      if (node) {
        node.classList.add("is-active");
      }

      if (tooltip) {
        tooltip.classList.add("is-active");
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
      console.log(key);
      console.log(node);
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

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        clearTooltips();
      }
    });
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
});
