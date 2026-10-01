/* ==========================================================================
   Siddharth Yadav — motion layer
   Everything here is progressive enhancement. If GSAP or Lenis fail to load,
   `html.anim` is removed and the page renders fully in its final state.
   ========================================================================== */
(function () {
  'use strict';

  var html    = document.documentElement;
  var force   = /[?&]motion=on(&|$)/.test(location.search);
  var reduce  = !force && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine    = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* If the libraries never arrived, strip the animation flag and stop.
     Every [data-anim] element then renders at its natural final state. */
  if (!hasGSAP || reduce) {
    html.classList.remove('anim');
    var pre = document.getElementById('preloader');
    if (pre) pre.remove();
    basicScrollChrome();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ======================================================================
     1. Smooth scroll (Lenis) wired into the GSAP ticker
     ====================================================================== */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor links route through Lenis so the easing matches the rest of the page
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.2 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ======================================================================
     2. Text splitting
     ====================================================================== */
  function splitWords(el, cls) {
    var text = el.textContent;
    el.textContent = '';
    var frag = document.createDocumentFragment();
    text.split(/(\s+)/).forEach(function (chunk) {
      if (!chunk) return;
      var s = document.createElement('span');
      s.className = cls || 'w';
      s.textContent = chunk;
      frag.appendChild(s);
    });
    el.appendChild(frag);
    return Array.prototype.slice.call(el.querySelectorAll('.' + (cls || 'w')));
  }

  function splitLines(el) {
    if (!el.dataset.original) el.dataset.original = el.innerHTML;
    el.innerHTML = el.dataset.original;
    var words = splitWords(el, 'w');
    var rows = [], current = null, lastTop = null;
    words.forEach(function (w) {
      var top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 4) { current = []; rows.push(current); lastTop = top; }
      current.push(w);
    });
    el.innerHTML = '';
    var lines = [];
    rows.forEach(function (row) {
      var outer = document.createElement('span'); outer.className = 'line';
      var inner = document.createElement('span');
      row.forEach(function (w) { inner.appendChild(w); });
      outer.appendChild(inner); el.appendChild(outer);
      lines.push(inner);
    });
    return lines;
  }

  var introDone = false;
  var heroTitle = document.querySelector('[data-split="lines"]');
  /* Set the offset through GSAP rather than inheriting it from the CSS.
     A computed transform is a matrix with percentages already resolved to px,
     so GSAP would read the CSS translate3d(0,110%,0) as y:93px — and a later
     tween to yPercent:0 would then move nothing. Writing y and yPercent
     explicitly gives GSAP a known baseline. */
  if (heroTitle) gsap.set(splitLines(heroTitle), { y: 0, yPercent: 110 });

  document.querySelectorAll('[data-split="words"]').forEach(function (el) {
    var words = splitWords(el, 'w');
    gsap.set(words, { yPercent: 115, opacity: 0 });
    gsap.to(words, {
      yPercent: 0, opacity: 1, duration: 0.95, ease: 'power3.out', stagger: 0.028,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  /* ======================================================================
     3. Scroll reveals
     ====================================================================== */
  // Hero fades are driven by the preloader hand-off, not by scroll, so they
  // are excluded here — otherwise they would resolve behind the preloader.
  gsap.utils.toArray('[data-anim="fade"]').forEach(function (el) {
    if (el.closest('#hero')) return;
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  gsap.utils.toArray('[data-anim="row"]').forEach(function (row) {
    gsap.to(row.querySelectorAll('td'), {
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05,
      scrollTrigger: { trigger: row, start: 'top 92%', once: true }
    });
  });

  // The portrait sits above the fold, so its reveal is played by the preloader
  // hand-off rather than by a scroll trigger that would fire behind the curtain.
  var portraitTL = null;
  var portrait = document.querySelector('[data-anim="reveal"]');
  if (portrait) {
    var pframe = portrait.querySelector('.portrait__frame');
    var pcap   = portrait.querySelector('.portrait__cap');
    var pimg   = portrait.querySelector('img');
    portraitTL = gsap.timeline({ paused: true });
    portraitTL.to(pframe, { clipPath: 'inset(0 0 0% 0)', duration: 1.25, ease: 'power4.inOut' })
              .from(pimg, { scale: 1.18, duration: 1.6, ease: 'power3.out' }, 0)
              .to(pcap, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.45);

    // slow counter-drift while the hero is on screen
    gsap.to(pimg, {
      yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ======================================================================
     4. Statement — word-by-word opacity scrubbed to scroll
     ====================================================================== */
  var statement = document.querySelector('[data-scrub]');
  if (statement) {
    var swords = splitWords(statement, 'w');
    gsap.to(swords, {
      opacity: 1, ease: 'none', stagger: 1,
      scrollTrigger: { trigger: statement, start: 'top 78%', end: 'bottom 55%', scrub: 0.6 }
    });
  }

  /* ======================================================================
     5. Metric count-up
     ====================================================================== */
  document.querySelectorAll('.metric__n[data-to]').forEach(function (el) {
    var to   = parseFloat(el.getAttribute('data-to'));
    var dec  = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pre  = el.getAttribute('data-pre') || '';
    var post = el.getAttribute('data-post') || '';
    var obj  = { v: 0 };
    el.textContent = pre + (0).toFixed(dec) + post;
    gsap.to(obj, {
      v: to, duration: 1.8, ease: 'expo.out',
      onUpdate: function () { el.textContent = pre + obj.v.toFixed(dec) + post; },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ======================================================================
     6. Hero canvas — drifting market curves
     ====================================================================== */
  (function () {
    var cv = document.getElementById('field');
    if (!cv) return;
    var ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return;

    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true, t = 0, mouseY = 0.5, targetMouseY = 0.5;
    var LINES = 7;

    function resize() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    if (fine) {
      window.addEventListener('mousemove', function (e) { targetMouseY = e.clientY / window.innerHeight; }, { passive: true });
    }

    // deterministic pseudo-noise: layered sines, no dependency
    function curve(x, seed, time) {
      return Math.sin(x * 1.7 + seed * 2.1 + time) * 0.5
           + Math.sin(x * 3.1 - seed * 1.3 + time * 0.7) * 0.28
           + Math.sin(x * 0.9 + seed * 4.7 - time * 0.45) * 0.34;
    }

    function draw() {
      if (!running) return;
      t += 0.0032;
      mouseY += (targetMouseY - mouseY) * 0.04;
      ctx.clearRect(0, 0, W, H);

      // faint vertical grid, like a plotted axis
      ctx.strokeStyle = 'rgba(6,32,47,0.045)';
      ctx.lineWidth = 1;
      var cols = 14;
      for (var g = 1; g < cols; g++) {
        var gx = (W / cols) * g;
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }

      var steps = Math.max(28, Math.floor(W / 26));
      for (var i = 0; i < LINES; i++) {
        var depth = i / (LINES - 1);
        var base  = H * (0.30 + depth * 0.46) + (mouseY - 0.5) * (18 + depth * 34);
        var amp   = H * (0.045 + depth * 0.055);

        ctx.beginPath();
        for (var s = 0; s <= steps; s++) {
          var px = (W / steps) * s;
          var nx = s / steps * 3.4;
          var py = base + curve(nx, i * 1.37, t * (1 + depth * 0.35)) * amp;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(26,76,124,' + (0.10 + depth * 0.20).toFixed(3) + ')';
        ctx.lineWidth = 1 + depth * 0.5;
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    }

    // only burn frames while the hero is actually on screen
    var hero = document.getElementById('hero');
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !running) { running = true; requestAnimationFrame(draw); }
          else if (!e.isIntersecting) { running = false; }
        });
      }, { threshold: 0 }).observe(hero);
    }
    requestAnimationFrame(draw);
  })();

  /* ======================================================================
     7. Cursor + magnetic buttons (fine pointers only)
     ====================================================================== */
  if (fine) {
    var ring = document.getElementById('cursor');
    var dot  = document.getElementById('cursorDot');
    if (ring && dot) {
      html.classList.add('has-cursor');
      var rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
      var ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
      var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
      var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
      window.addEventListener('mousemove', function (e) {
        rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
      }, { passive: true });

      document.querySelectorAll('[data-cursor]').forEach(function (el) {
        el.addEventListener('mouseenter', function () { gsap.to(ring, { scale: 1.9, opacity: 0.55, duration: 0.35, ease: 'power3.out' }); });
        el.addEventListener('mouseleave', function () { gsap.to(ring, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' }); });
      });
    }

    document.querySelectorAll('.magnetic').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      var my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.42);
      });
      el.addEventListener('mouseleave', function () { mx(0); my(0); });
    });
  }

  /* ======================================================================
     8. Marquee
     ====================================================================== */
  (function () {
    var track = document.querySelector('.marquee__track');
    if (!track) return;
    var loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    var mq = document.getElementById('marquee');
    if (mq && fine) {
      mq.addEventListener('mouseenter', function () { gsap.to(loop, { timeScale: 0.15, duration: 0.5 }); });
      mq.addEventListener('mouseleave', function () { gsap.to(loop, { timeScale: 1, duration: 0.5 }); });
    }
  })();

  /* ======================================================================
     9. Nav state, progress bar, scrollspy
     ====================================================================== */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('pbar');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      if (bar) gsap.set(bar, { scaleX: self.progress });
      if (nav) nav.classList.toggle('is-stuck', self.scroll() > 8);
    }
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  navLinks.forEach(function (a) {
    var sec = document.querySelector(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 45%', end: 'bottom 45%',
      onToggle: function (self) { if (self.isActive) setActive(a); }
    });
  });
  function setActive(a) { navLinks.forEach(function (l) { l.classList.toggle('is-active', l === a); }); }

  /* ======================================================================
     10. Preloader → hero entrance
     ====================================================================== */
  (function () {
    var pre    = document.getElementById('preloader');
    var count  = document.getElementById('pcount');
    var pline  = document.getElementById('pline');
    var seen   = false;
    try { seen = sessionStorage.getItem('sy_seen') === '1'; } catch (e) {}

    /* Builds the hero entrance directly onto a timeline at offset `at`.
       Appending onto one timeline rather than nesting a second, already-running
       one keeps the ordering deterministic. */
    function buildHeroIn(tl, at) {
      at = at || 0;
      // Target by selector, not a cached array: a resize can re-split the
      // headline and orphan the nodes a captured array still points at.
      tl.to('.hero__title .line>span', { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.08 }, at);
      tl.to('.hero__canvas', { opacity: 0.5, duration: 1.6, ease: 'power2.out' }, at + 0.1)
        .to('.hero__kicker', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, at + 0.15)
        .to('.hero__role',   { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, at + 0.3)
        .to('.hero__lede',   { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, at + 0.4)
        .to('.hero__cta',    { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, at + 0.5);
      if (portraitTL) tl.add(function () { portraitTL.play(); }, at + 0.2);
      tl.add(function () { introDone = true; ScrollTrigger.refresh(); });
      return tl;
    }

    /* Hard failsafe. gsap.set() writes styles synchronously, so this still
       works when requestAnimationFrame is paused (hidden tab, some webviews)
       and the ticker-driven timelines would otherwise never advance —
       which would leave the curtain up and scrolling locked. */
    function forceFinalState() {
      gsap.set('.hero__title .line>span', { y: 0, yPercent: 0 });
      gsap.set('.hero__kicker, .hero__role, .hero__lede, .hero__cta', { opacity: 1, y: 0 });
      gsap.set('.hero__canvas', { opacity: 0.5 });
      if (portrait) {
        gsap.set('.portrait__frame', { clipPath: 'inset(0 0 0% 0)' });
        gsap.set('.portrait__cap', { opacity: 1 });
      }
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    }

    if (!pre) { buildHeroIn(gsap.timeline(), 0); return; }

    // Never play an intro the visitor cannot see.
    if (seen || document.visibilityState === 'hidden') {
      pre.remove();
      if (document.visibilityState === 'hidden') forceFinalState();
      else buildHeroIn(gsap.timeline({ delay: 0.1 }), 0);
      return;
    }

    if (lenis) lenis.stop();
    var done = false;
    function finish() {
      if (done) return; done = true;
      try { sessionStorage.setItem('sy_seen', '1'); } catch (e) {}
      var out = gsap.timeline();
      out.to(pre, {
        yPercent: -100, duration: 1.0, ease: 'power4.inOut',
        onComplete: function () { pre.remove(); if (lenis) lenis.start(); ScrollTrigger.refresh(); }
      }, 0);
      buildHeroIn(out, 0.45);
    }

    var counter = { v: 0 };
    var tl = gsap.timeline();
    tl.to('.preloader__name>span',  { yPercent: 0, duration: 0.95, ease: 'power4.out' }, 0.1)
      .to('.preloader__meta>span',  { yPercent: 0, duration: 0.85, ease: 'power4.out' }, 0.25)
      .to(pline, { scaleX: 1, duration: 1.35, ease: 'power2.inOut' }, 0.1)
      .to(counter, {
        v: 100, duration: 1.35, ease: 'power2.inOut',
        onUpdate: function () { if (count) count.textContent = Math.round(counter.v); }
      }, 0.1)
      .add(finish, '+=0.12');

    // Watchdog 1: normal case — animate the curtain away.
    setTimeout(finish, 3500);

    // Watchdog 2: if the curtain is somehow still up, the ticker never ran.
    // Remove it outright and write the final state synchronously.
    setTimeout(function () {
      if (!document.body.contains(pre)) return;
      done = true;
      try { sessionStorage.setItem('sy_seen', '1'); } catch (e) {}
      pre.remove();
      forceFinalState();
    }, 6000);
  })();

  /* ======================================================================
     Re-split the hero headline on resize so masked lines never clip
     ====================================================================== */
  var rt, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      // Only re-split once the intro has played, and only when the width
      // actually changed — otherwise a resize mid-intro orphans the nodes
      // the entrance timeline is animating.
      if (introDone && window.innerWidth !== lastW && heroTitle) {
        lastW = window.innerWidth;
        gsap.set(splitLines(heroTitle), { y: 0, yPercent: 0 });
      }
      ScrollTrigger.refresh();
    }, 220);
  });

  /* ======================================================================
     Fallback chrome used when GSAP is unavailable
     ====================================================================== */
  function basicScrollChrome() {
    var nav2 = document.getElementById('nav');
    var bar2 = document.getElementById('pbar');
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (nav2) nav2.classList.toggle('is-stuck', y > 8);
      if (bar2) {
        var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
        bar2.style.transform = 'scaleX(' + Math.min(Math.max(y / max, 0), 1) + ')';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
