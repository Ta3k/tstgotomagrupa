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
  const menu  = document.querySelector(".main-nav");

  window.addEventListener("scroll", function () {
    const menuBottom = menu.getBoundingClientRect().bottom;

    if (menuBottom <= 0) {
      btnScrollToTop.classList.add("is-active");
    } else {
      btnScrollToTop.classList.remove("is-active");
    }
  });

  btnScrollToTop.addEventListener("click", function () {
    if (window.scrollY != 0) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      })
    }
  });

  const diagrams = document.querySelectorAll(".scheme-diagram");
  console.log(diagrams);
  diagrams.forEach(diagram => {
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