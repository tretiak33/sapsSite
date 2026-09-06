(function () {
  var menu = document.querySelector('[data-mobile-menu]');
  var openBtn = document.querySelector('[data-burger-open]');
  var closeEls = document.querySelectorAll('[data-burger-close]');

  if (!menu || !openBtn) return;

  function open() {
    menu.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', open);
  closeEls.forEach(function (el) {
    el.addEventListener('click', close);
  });
})();

/* ---- Header height -> CSS var (для отступа под фиксированный header) ---- */
(function () {
  var header = document.querySelector('.header');
  if (!header) return;

  function setHeaderHeight() {
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }

  setHeaderHeight();
  window.addEventListener('resize', debounce(setHeaderHeight, 150));

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }
})();

/* ---- Header: скрывается при скролле вниз, появляется при скролле вверх ----
   Только на устройствах с настоящим hover (мышь) — на touch (мобилки,
   планшеты без мыши) header всегда закреплён и никогда не прячется. */
(function () {
  var header = document.querySelector('.header');
  var menu = document.querySelector('[data-mobile-menu]');
  if (!header) return;

  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return; // touch-устройства: header остаётся закреплённым

  var lastY = window.scrollY;
  var hideAnchorY = window.scrollY; // точка, от которой отсчитываем накопленный скролл вниз
  var ticking = false;
  var SHOW_NEAR_TOP = 120;  // у самого верха страницы всегда показываем
  var HIDE_DELTA = 64;      // сколько нужно проскроллить вниз подряд, прежде чем header спрячется

  function update() {
    var y = window.scrollY;
    var menuOpen = menu && menu.classList.contains('is-open');
    var scrollingDown = y > lastY;

    if (!scrollingDown) {
      hideAnchorY = y; // сбрасываем накопление при любом скролле вверх
    }

    if (menuOpen || y <= SHOW_NEAR_TOP || !scrollingDown) {
      header.classList.remove('is-hidden');
    } else if (scrollingDown && y - hideAnchorY > HIDE_DELTA) {
      header.classList.add('is-hidden');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();

/* ---- Text swap: вертикальная смена текста в кнопках и навигации ---- */
(function () {
  var targets = document.querySelectorAll('.btn, .nav-link');

  targets.forEach(function (el) {
    var textNode = null;
    for (var i = el.childNodes.length - 1; i >= 0; i--) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim().length > 0) {
        textNode = n;
        break;
      }
    }
    if (!textNode) return;

    var text = textNode.textContent;

    var wrap = document.createElement('span');
    wrap.className = 'text-swap';

    var track = document.createElement('span');
    track.className = 'text-swap__track';

    var line1 = document.createElement('span');
    line1.className = 'text-swap__line';
    line1.textContent = text;

    var line2 = document.createElement('span');
    line2.className = 'text-swap__line';
    line2.textContent = text;
    line2.setAttribute('aria-hidden', 'true');

    track.appendChild(line1);
    track.appendChild(line2);
    wrap.appendChild(track);

    el.replaceChild(wrap, textNode);
  });
})();

/* ---- Active navigation по текущей секции ---- */
(function () {
  var sections = document.querySelectorAll('main section[id]');
  if (!sections.length || !('IntersectionObserver' in window)) return;

  var navLinks = document.querySelectorAll('.nav-link');
  var map = {};

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href') || '';
    var id = href.split('#')[1];
    if (!id) return;
    (map[id] = map[id] || []).push(link);
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (l) { l.classList.remove('is-active'); });
      (map[entry.target.id] || []).forEach(function (l) { l.classList.add('is-active'); });
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(function (s) { observer.observe(s); });
})();

/* ---- Cursor-follow для изображений (только мышь, только реальный hover) ---- */
(function () {
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reducedMotion) return;

  var wrappers = document.querySelectorAll(
    '.hero__image, .project-hero__media, .about-grid .media, .project-card__media'
  );

  var MAX_OFFSET = 6; // px
  var EASE = 0.14;

  wrappers.forEach(function (wrapper) {
    var img = wrapper.querySelector('img');
    if (!img) return;

    var target = { x: 0, y: 0, s: 1 };
    var current = { x: 0, y: 0, s: 1 };
    var raf = null;

    function tick() {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      current.s += (target.s - current.s) * EASE;

      var closeEnough =
        Math.abs(target.x - current.x) < 0.05 &&
        Math.abs(target.y - current.y) < 0.05 &&
        Math.abs(target.s - current.s) < 0.001;

      if (closeEnough) {
        current.x = target.x;
        current.y = target.y;
        current.s = target.s;
      }

      if (current.x === 0 && current.y === 0 && current.s === 1) {
        img.style.transform = '';
      } else {
        img.style.transform =
          'translate3d(' + current.x.toFixed(2) + 'px,' + current.y.toFixed(2) + 'px,0) scale(' + current.s.toFixed(3) + ')';
      }

      raf = closeEnough ? null : requestAnimationFrame(tick);
    }

    function ensureLoop() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    wrapper.addEventListener('mousemove', function (e) {
      var rect = wrapper.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      target.x = relX * 2 * MAX_OFFSET;
      target.y = relY * 2 * MAX_OFFSET;
      target.s = 1.06;
      ensureLoop();
    });

    wrapper.addEventListener('mouseleave', function () {
      target.x = 0;
      target.y = 0;
      target.s = 1;
      ensureLoop();
    });
  });
})();
(function () {
  var btn = document.querySelector('[data-scroll-top]');
  if (!btn) return;

  function threshold() {
    return document.documentElement.scrollHeight / 3;
  }

  function onScroll() {
    if (window.scrollY > threshold()) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
