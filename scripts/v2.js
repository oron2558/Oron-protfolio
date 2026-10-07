/* Portfolio v2 interactions. No dependencies.
   Every piece checks for its own markup, so one file serves every page.
   Motion is skipped when the visitor prefers reduced motion; hover-driven
   effects only run on fine pointers. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- scroll reveals ---------- */
  function reveals() {
    var els = $$('.rv, .rv-clip');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- count-up, once, on first view ---------- */
  function countUps() {
    var els = $$('[data-count]');
    if (!els.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (reduce) { el.textContent = target.toFixed(decimals); return; }
      var start = null;
      var dur = 1400;
      function frame(t) {
        if (start === null) start = t;
        var k = clamp((t - start) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - k, 4);
        el.textContent = (target * eased).toFixed(decimals);
        if (k < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- kinetic name: split into letters, react to the cursor ---------- */
  function kinetic() {
    var lines = $$('[data-kinetic]');
    if (!lines.length) return;
    var n = 0;
    var chars = [];
    lines.forEach(function (line) {
      var text = line.textContent;
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      text.split('').forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.style.setProperty('--n', n++);
        line.appendChild(s);
        chars.push(s);
      });
    });
    if (reduce || !finePointer) return;
    var h1 = lines[0].closest('h1');
    var host = h1.closest('.hero') || h1;
    var mx = -9999, my = -9999, raf = 0;
    function update() {
      raf = 0;
      chars.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        var k = clamp(1 - d / 260, 0, 1);
        c.style.setProperty('--k', (k * k).toFixed(3));
      });
    }
    host.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      h1.classList.add('is-tracking');
      if (!raf) raf = requestAnimationFrame(update);
    });
    host.addEventListener('pointerleave', function () {
      mx = my = -9999;
      h1.classList.remove('is-tracking');
      if (!raf) raf = requestAnimationFrame(update);
    });
  }

  function rotator() {
    if (reduce) $$('[data-rotate]').forEach(function (r) { r.classList.add('no-rot'); });
  }

  /* ---------- portrait stage: depth layers, tilt and light follow the cursor ---------- */
  function stageDepth() {
    var stages = $$('[data-depth]');
    if (!stages.length || reduce || !finePointer) return;
    stages.forEach(function (stage) {
      var host = stage.closest('.hero, .ahero') || stage;
      var tilt = stage.classList.contains('stage--cut');
      var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      function tick() {
        x += (tx - x) * 0.08;
        y += (ty - y) * 0.08;
        stage.style.setProperty('--px', (x * 14).toFixed(2) + 'px');
        stage.style.setProperty('--py', (y * 10).toFixed(2) + 'px');
        if (tilt) {
          stage.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
          stage.style.setProperty('--rx', (y * -6).toFixed(2) + 'deg');
        }
        if (Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002) raf = requestAnimationFrame(tick);
        else raf = 0;
      }
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        var sr = stage.getBoundingClientRect();
        stage.style.setProperty('--sx', (e.clientX - sr.left).toFixed(0) + 'px');
        stage.style.setProperty('--sy', (e.clientY - sr.top).toFixed(0) + 'px');
        if (!raf) raf = requestAnimationFrame(tick);
      });
      host.addEventListener('pointerleave', function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(tick);
      });
    });
  }

  /* ---------- sticky stack: cards recede as the next one lands ---------- */
  function stack() {
    var cards = $$('.scard');
    if (cards.length < 2 || reduce) return;
    var mq = window.matchMedia('(min-width: 900px)');
    var ticking = false;
    function update() {
      ticking = false;
      if (!mq.matches) return;
      for (var i = 0; i < cards.length - 1; i++) {
        var cur = cards[i].getBoundingClientRect();
        var next = cards[i + 1].getBoundingClientRect();
        var p = clamp(1 - (next.top - cur.top) / Math.max(cur.height, 1), 0, 1);
        cards[i].style.setProperty('--p', p.toFixed(3));
      }
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- draggable rail with momentum ---------- */
  function rails() {
    $$('[data-rail]').forEach(function (rail) {
      var bar = $('.rail__bar i', rail.parentElement);
      var prev = $('[data-rail-prev]', rail.parentElement);
      var next = $('[data-rail-next]', rail.parentElement);

      function progress() {
        var max = rail.scrollWidth - rail.clientWidth;
        var p = max > 0 ? rail.scrollLeft / max : 1;
        if (bar) bar.style.setProperty('--rp', (0.15 + p * 0.85).toFixed(3));
      }
      rail.addEventListener('scroll', progress, { passive: true });
      progress();

      function stepSize() {
        var first = $('.step', rail);
        return first ? first.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
      }
      if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -stepSize(), behavior: reduce ? 'auto' : 'smooth' }); });
      if (next) next.addEventListener('click', function () { rail.scrollBy({ left: stepSize(), behavior: reduce ? 'auto' : 'smooth' }); });

      /* Mouse drag only: touch already scrolls natively with momentum. */
      var down = false, moved = false, startX = 0, startScroll = 0, lastX = 0, lastT = 0, v = 0, raf = 0;
      rail.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        cancelAnimationFrame(raf);
        down = true; moved = false;
        startX = lastX = e.clientX; lastT = performance.now();
        startScroll = rail.scrollLeft; v = 0;
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 4) { moved = true; rail.classList.add('is-dragging'); }
        if (!moved) return;
        rail.scrollLeft = startScroll - dx;
        var now = performance.now();
        var dt = Math.max(now - lastT, 1);
        v = (e.clientX - lastX) / dt;
        lastX = e.clientX; lastT = now;
      });
      window.addEventListener('pointerup', function () {
        if (!down) return;
        down = false;
        if (!moved) return;
        /* keep the class a tick so the click that ends a drag is swallowed */
        setTimeout(function () { rail.classList.remove('is-dragging'); }, 0);
        if (reduce) return;
        var vel = -v * 16;
        (function glide() {
          vel *= 0.94;
          rail.scrollLeft += vel;
          if (Math.abs(vel) > 0.4) raf = requestAnimationFrame(glide);
        })();
      });
    });
  }

  /* ---------- copy email ---------- */
  function copyEmail() {
    $$('.copy-email').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var email = btn.getAttribute('data-email');
        if (!navigator.clipboard) return; /* fall through to mailto href */
        e.preventDefault();
        navigator.clipboard.writeText(email).then(function () {
          btn.classList.add('is-copied');
          var live = $('#copy-status');
          if (live) live.textContent = 'Email copied to clipboard';
          setTimeout(function () { btn.classList.remove('is-copied'); }, 1800);
        }, function () { window.location.href = 'mailto:' + email; });
      });
    });
  }

  /* ---------- work index: cursor-follow preview ---------- */
  function workPeek() {
    var rows = $$('.wrow[data-peek]');
    if (!rows.length || !finePointer || window.innerWidth < 900) return;
    var peek = document.createElement('div');
    peek.className = 'wpeek';
    peek.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.alt = '';
    peek.appendChild(img);
    document.body.appendChild(peek);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    function tick() {
      x += (tx - x) * (reduce ? 1 : 0.16);
      y += (ty - y) * (reduce ? 1 : 0.16);
      peek.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick);
      else raf = 0;
    }
    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function (e) {
        img.src = row.getAttribute('data-peek');
        tx = x = e.clientX + 24; ty = y = e.clientY - 120;
        peek.style.background = getComputedStyle(row).getPropertyValue('--tint');
        tick();
        peek.classList.add('is-on');
      });
      row.addEventListener('pointermove', function (e) {
        tx = e.clientX + 24; ty = e.clientY - 120;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      row.addEventListener('pointerleave', function () { peek.classList.remove('is-on'); });
    });
  }

  /* ---------- timeline fill ---------- */
  function timeline() {
    var tl = $('.tl');
    if (!tl) return;
    if (reduce) { tl.style.setProperty('--tp', 1); return; }
    var ticking = false;
    function update() {
      ticking = false;
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = clamp((vh * 0.6 - r.top) / r.height, 0, 1);
      tl.style.setProperty('--tp', p.toFixed(3));
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- hobby desk: pick up and toss real photos ---------- */
  function desk() {
    var deskEl = $('[data-desk]');
    if (!deskEl) return;
    if (reduce) { deskEl.classList.add('desk--static'); return; }
    var cards = $$('.hcard', deskEl);
    var W, H, z = 10;
    var bodies = cards.map(function (el, i) {
      return { el: el, x: 0, y: 0, vx: 0, vy: 0, r: (i % 2 ? 1 : -1) * (4 + i * 2), vr: 0, held: false, w: 0, h: 0 };
    });

    function measure() {
      W = deskEl.clientWidth; H = deskEl.clientHeight;
      bodies.forEach(function (b) { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; });
    }
    function layout() {
      measure();
      var slots = [[0.06, 0.1], [0.3, 0.32], [0.55, 0.08], [0.76, 0.3]];
      if (W < 600) slots = [[0.04, 0.04], [0.42, 0.1], [0.08, 0.42], [0.46, 0.5]];
      bodies.forEach(function (b, i) {
        var s = slots[i % slots.length];
        b.x = clamp(s[0] * W, 0, W - b.w);
        b.y = clamp(s[1] * H, 0, H - b.h);
        paint(b);
      });
    }
    function paint(b) {
      b.el.style.transform = 'translate3d(' + b.x.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px,0) rotate(' + b.r.toFixed(2) + 'deg)';
    }

    var running = false;
    function step() {
      var active = false;
      bodies.forEach(function (b) {
        if (b.held) { active = true; return; }
        if (Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.vr) < 0.02) return;
        active = true;
        b.x += b.vx; b.y += b.vy; b.r += b.vr;
        b.vx *= 0.93; b.vy *= 0.93; b.vr *= 0.9;
        if (b.x < 0) { b.x = 0; b.vx = -b.vx * 0.5; }
        if (b.y < 0) { b.y = 0; b.vy = -b.vy * 0.5; }
        if (b.x > W - b.w) { b.x = W - b.w; b.vx = -b.vx * 0.5; }
        if (b.y > H - b.h) { b.y = H - b.h; b.vy = -b.vy * 0.5; }
        paint(b);
      });
      if (active) requestAnimationFrame(step); else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(step); } }

    bodies.forEach(function (b) {
      var ox = 0, oy = 0, lx = 0, ly = 0, lt = 0;
      b.el.addEventListener('pointerdown', function (e) {
        b.el.setPointerCapture(e.pointerId);
        b.held = true; b.vx = b.vy = 0;
        b.el.classList.add('is-held');
        b.el.style.zIndex = ++z;
        var r = deskEl.getBoundingClientRect();
        ox = e.clientX - r.left - b.x; oy = e.clientY - r.top - b.y;
        lx = e.clientX; ly = e.clientY; lt = performance.now();
        kick();
      });
      b.el.addEventListener('pointermove', function (e) {
        if (!b.held) return;
        var r = deskEl.getBoundingClientRect();
        b.x = clamp(e.clientX - r.left - ox, 0, W - b.w);
        b.y = clamp(e.clientY - r.top - oy, 0, H - b.h);
        var now = performance.now(), dt = Math.max(now - lt, 1);
        b.vx = (e.clientX - lx) / dt * 16;
        b.vy = (e.clientY - ly) / dt * 16;
        b.r += clamp(b.vx * 0.04, -1.5, 1.5);
        lx = e.clientX; ly = e.clientY; lt = now;
        paint(b);
      });
      function release() {
        if (!b.held) return;
        b.held = false;
        b.el.classList.remove('is-held');
        b.vr = clamp(b.vx * 0.05, -2, 2);
        kick();
      }
      b.el.addEventListener('pointerup', release);
      b.el.addEventListener('pointercancel', release);

      /* keyboard: arrows nudge the focused card */
      b.el.addEventListener('keydown', function (e) {
        var d = e.shiftKey ? 60 : 24;
        var k = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
        if (!k) return;
        e.preventDefault();
        b.el.style.zIndex = ++z;
        b.vx = k[0] / 6; b.vy = k[1] / 6;
        kick();
      });
    });

    layout();
    window.addEventListener('resize', function () {
      measure();
      bodies.forEach(function (b) { b.x = clamp(b.x, 0, W - b.w); b.y = clamp(b.y, 0, H - b.h); paint(b); });
    });
  }

  function init() {
    kinetic();
    rotator();
    reveals();
    countUps();
    stageDepth();
    stack();
    rails();
    copyEmail();
    workPeek();
    timeline();
    desk();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
