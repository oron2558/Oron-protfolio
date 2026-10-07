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
    /* hero verb: think, research, define... one slot, on a loop */
    $$('[data-verb]').forEach(function (slot) {
      var ws = $$('.verb__w', slot), i = 0;
      if (reduce || ws.length < 2) return;
      function fit(w) { slot.style.width = w.offsetWidth + 'px'; }
      fit(ws[0]);
      setInterval(function () {
        if (document.hidden) return;
        var cur = ws[i], nxt = ws[(i + 1) % ws.length];
        ws.forEach(function (w) { w.classList.remove('is-out'); });
        nxt.style.transition = 'none';
        nxt.style.transform = 'translateY(110%)';
        nxt.offsetWidth;
        nxt.style.transition = ''; nxt.style.transform = '';
        cur.classList.remove('is-on'); cur.classList.add('is-out');
        nxt.classList.add('is-on');
        fit(nxt);
        i = (i + 1) % ws.length;
      }, 1900);
      window.addEventListener('resize', function () { fit(ws[i]); });
    });
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

  /* ---------- Design Thinking: pinned onboarding with a morphing dot field ---------- */
  function designThinking() {
    var root = $('[data-dt]');
    if (!root) return;
    var track = $('.dt__track', root);
    var labs = $$('[data-dt-go]', root);
    var steps = $$('[data-dt-step]', root);
    var shots = $$('.dt__shots img', root);
    var caps = $$('.dt__shots figcaption span', root);
    var now = $('.dt__now span', root);
    var viz = $('.dt__viz', root);
    var canvas = $('.dt__canvas', root);
    var ctx = canvas.getContext('2d');
    var STAGES = steps.length;
    var pinned = !reduce;
    var s = 0, active = -1, visible = false, raf = 0, swipeAt = 0;
    var marks = steps.map(function (st) { return st.style.getPropertyValue('--mk').trim() || '#ffe45c'; });

    steps.forEach(function (st) {
      var w = $('[data-dt-word]', st);
      var text = w.textContent;
      w.setAttribute('aria-label', text);
      w.textContent = '';
      text.split('').forEach(function (c, i) {
        var sp = document.createElement('span');
        sp.className = 'ch';
        sp.setAttribute('aria-hidden', 'true');
        sp.textContent = c;
        sp.style.setProperty('--n', i);
        w.appendChild(sp);
      });
    });

    if (pinned) root.classList.add('dt--pin');

    /* the longest stage word (Empathize, Prototype) must always fit its column */
    var words = $$('[data-dt-word]', root);
    function fitWords() {
      words.forEach(function (w) { w.style.fontSize = ''; });
      var avail = $('.dt__steps', root).clientWidth * 0.94, max = 0;
      words.forEach(function (w) {
        var wide = 0;
        $$('.ch', w).forEach(function (c) { wide += c.offsetWidth; });
        max = Math.max(max, wide);
      });
      if (max > avail && avail > 0) {
        var fs = parseFloat(getComputedStyle(words[0]).fontSize) * (avail / max) * 0.97;
        words.forEach(function (w) { w.style.fontSize = fs.toFixed(1) + 'px'; });
      }
    }
    fitWords();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWords);
    window.addEventListener('resize', fitWords);

    /* --- the double diamond, drawn to scale ---
       x0..x4 are the stage borders: wide at x1 and x3, pinched at x0, x2, x4.
       The Test loop is a circle that touches x4. Particles ride "lanes"
       between the upper and lower edge, so the flow itself draws the shape. */
    var W = 0, H = 0, dpr = 1, cy = 0, A = 0, r = 0, seg = 0, x0 = 0, total = 0, parts = [];
    var mx = -999, my = -999, last = 0;
    function rnd(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

    function build() {
      var b = canvas.getBoundingClientRect();
      W = b.width; H = b.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      cy = H / 2;
      A = H * 0.44;
      r = Math.min(A * 0.92, W * 0.09);
      x0 = Math.max(8, W * 0.006);
      seg = (W - x0 * 2 - r * 2.4) / 4;
      total = seg * 4 + Math.PI * 2 * r;
      var N = W < 600 ? 190 : 340;
      if (parts.length !== N) {
        parts = [];
        for (var n = 0; n < N; n++) {
          var a = rnd(n + 1), edge = n % 4 === 0;
          parts.push({
            u: rnd(n + 301),
            v: 0.75 + rnd(n + 201) * 0.5,
            lane: edge ? (n % 8 === 0 ? 1 : -1) : (a * 2 - 1) * 0.94,
            edge: edge
          });
        }
      }
      labs.forEach(function (l, k) {
        var x = k < 4 ? x0 + seg * (k + 0.5) : x0 + seg * 4 + r;
        l.style.setProperty('--x', x.toFixed(1) + 'px');
      });
    }

    function xAt(k) { return x0 + seg * k; }

    /* position along the route: d is distance from the start, lane in [-1, 1] */
    function at(d, lane, out) {
      if (d < seg * 4) {
        var k = Math.floor(d / seg), f = d / seg - k;
        var env = A * (k % 2 === 0 ? f : 1 - f);
        out[0] = x0 + d; out[1] = cy + lane * env; out[2] = k;
      } else {
        var ang = (d - seg * 4) / r;
        var rr = r * (1 + lane * 0.2 * Math.min(1, ang / 0.8, (Math.PI * 2 - ang) / 0.8));
        out[0] = x0 + seg * 4 + r + Math.cos(Math.PI - ang) * rr;
        out[1] = cy - Math.sin(Math.PI - ang) * rr;
        out[2] = 4;
      }
      return out;
    }

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    var ink = '#141414', ground = '#edebe8';
    function colors() {
      var cs = getComputedStyle(root);
      ink = cs.getPropertyValue('--ink').trim() || ink;
      ground = cs.getPropertyValue('--ground').trim() || ground;
    }

    function outline() {
      ctx.beginPath();
      ctx.moveTo(xAt(0), cy);
      ctx.lineTo(xAt(1), cy - A); ctx.lineTo(xAt(2), cy); ctx.lineTo(xAt(3), cy - A); ctx.lineTo(xAt(4), cy);
      ctx.lineTo(xAt(3), cy + A); ctx.lineTo(xAt(2), cy); ctx.lineTo(xAt(1), cy + A); ctx.closePath();
      ctx.moveTo(xAt(4) + r * 2, cy);
      ctx.arc(xAt(4) + r, cy, r, 0, Math.PI * 2);
    }
    function shape(k) {
      ctx.beginPath();
      if (k < 4) {
        var wide = k % 2 === 0 ? xAt(k + 1) : xAt(k);
        ctx.moveTo(xAt(k), k % 2 === 0 ? cy : cy - A);
        if (k % 2 === 0) { ctx.lineTo(wide, cy - A); ctx.lineTo(wide, cy + A); }
        else { ctx.lineTo(xAt(k + 1), cy); ctx.lineTo(xAt(k), cy + A); }
        ctx.closePath();
      } else {
        ctx.arc(xAt(4) + r, cy, r, 0, Math.PI * 2);
      }
    }

    var P = [0, 0, 0];
    function draw(time) {
      raf = 0;
      var dt = last ? Math.min(time - last, 50) : 16;
      last = time;
      var swipe = reduce ? 1 : ease(clamp((time - swipeAt) / 620, 0, 1));
      var reach = active < 4 ? xAt(active + 1) : xAt(4) + r * 2;
      var from = active < 4 ? xAt(active) : xAt(4);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      /* marker swipe over the active part of the diamond */
      ctx.save();
      ctx.beginPath(); ctx.rect(from - 1, 0, (reach - from + 2) * swipe, H); ctx.clip();
      shape(active);
      ctx.fillStyle = marks[active];
      ctx.fill();
      ctx.restore();

      /* faint full drawing, then the travelled part in ink */
      ctx.lineJoin = 'round';
      ctx.lineWidth = 1;
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.16;
      outline(); ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, from + (reach - from) * swipe, H); ctx.clip();
      ctx.globalAlpha = 0.85; ctx.lineWidth = 1.4;
      outline(); ctx.stroke();
      ctx.restore();

      /* stage borders as hairlines */
      ctx.globalAlpha = 0.1; ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      for (var k = 1; k <= 4; k++) { ctx.moveTo(xAt(k) + 0.5, 0); ctx.lineTo(xAt(k) + 0.5, H); }
      ctx.stroke();
      ctx.setLineDash([]);

      /* the flow */
      var move = reduce ? 0 : dt * 0.000035;
      for (var n = 0; n < parts.length; n++) {
        var p = parts[n];
        p.u = (p.u + move * p.v) % 1;
        at(p.u * total, p.lane, P);
        var x = P[0], y = P[1], k2 = P[2];
        if (!reduce) {
          var dx = x - mx, dy = y - my, dist = Math.hypot(dx, dy);
          if (dist < 70 && dist > 0.1) { var push = (1 - dist / 70) * 16; x += dx / dist * push; y += dy / dist * push; }
        }
        var fade = Math.min(1, p.u / 0.02, (1 - p.u) / 0.03);
        var on = k2 === active && x <= from + (reach - from) * swipe + 1;
        ctx.globalAlpha = fade * (on ? 1 : k2 < active ? 0.55 : 0.16);
        ctx.fillStyle = on ? '#141414' : ink;
        var rad = p.edge ? 1.7 : 1.35;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }

      /* nodes where the process pinches: start, the problem, the solution */
      ctx.globalAlpha = 1;
      [0, 2, 4].forEach(function (k) {
        var reached = active >= k;
        ctx.beginPath(); ctx.arc(xAt(k), cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = reached ? ink : ground;
        ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = ink; ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    }

    function kick() { if (!raf) raf = requestAnimationFrame(draw); }

    function setActive(i) {
      if (i === active) return;
      var prev = active;
      active = i;
      swipeAt = performance.now();
      steps.forEach(function (st, k) { st.classList.toggle('is-on', k === i); });
      labs.forEach(function (l, k) { if (k === i) l.setAttribute('aria-current', 'step'); else l.removeAttribute('aria-current'); });
      shots.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      caps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
      if (now) {
        now.textContent = '0' + (i + 1);
        if (!reduce && prev !== -1) now.animate([{ transform: 'translateY(' + (i > prev ? '100%' : '-100%') + ')' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
      kick();
    }

    function measure() {
      if (!pinned) return;
      var b = track.getBoundingClientRect();
      var len = track.offsetHeight - window.innerHeight;
      s = clamp(-b.top / Math.max(len, 1), 0, 1) * (STAGES - 1);
      setActive(Math.round(s));
    }

    function go(k) {
      if (pinned) {
        var top = track.getBoundingClientRect().top + window.scrollY;
        var len = track.offsetHeight - window.innerHeight;
        window.scrollTo({ top: top + len * (k / (STAGES - 1)) + 2, behavior: 'smooth' });
      } else {
        s = k; setActive(k);
      }
    }
    labs.forEach(function (l) {
      l.addEventListener('click', function () { go(+l.getAttribute('data-dt-go')); });
    });
    root.addEventListener('keydown', function (e) {
      if (!e.target.closest('.dt__labs')) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var k = clamp(active + (e.key === 'ArrowRight' ? 1 : -1), 0, STAGES - 1);
      labs[k].focus(); go(k);
    });

    if (finePointer && !reduce) {
      canvas.addEventListener('pointermove', function (e) { var b = canvas.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; });
      canvas.addEventListener('pointerleave', function () { mx = my = -999; });
    }

    colors(); build(); setActive(0);
    if (pinned) {
      window.addEventListener('scroll', measure, { passive: true });
      measure();
    }
    window.addEventListener('resize', function () { build(); measure(); kick(); });
    new MutationObserver(function () { colors(); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { last = 0; kick(); } }).observe(viz);
    } else { visible = true; }
    kick();
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

  /* ---------- work showcase: pinned projects, screens scroll in their frames ---------- */
  function showcase() {
    var projs = $$('[data-proj]');
    if (!projs.length) return;
    var pindex = $('.pindex');
    var links = pindex ? $$('a', pindex) : [];
    var pans = $$('.pan');

    function measure() {
      pans.forEach(function (img) {
        var screen = img.parentElement;
        var travel = Math.max(0, img.getBoundingClientRect().height - screen.getBoundingClientRect().height);
        img.style.setProperty('--travel', travel.toFixed(0) + 'px');
      });
    }
    pans.forEach(function (img) { if (!img.complete) img.addEventListener('load', measure); });

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var active = null;
      projs.forEach(function (sec) {
        var r = sec.getBoundingClientRect();
        var pinned = r.height > vh * 1.2;
        var p = pinned
          ? clamp(-r.top / (r.height - vh), 0, 1)
          : clamp((vh - r.top) / (vh + r.height), 0, 1);
        var e = reduce ? 0 : clamp((r.top - (pinned ? 0 : vh * 0.1)) / (vh * 0.75), 0, 1);
        sec.style.setProperty('--p', p.toFixed(4));
        sec.style.setProperty('--e', e.toFixed(4));
        if (r.top <= vh / 2 && r.bottom > vh / 2) active = sec.id;
      });
      if (pindex) {
        pindex.classList.toggle('is-visible', !!active);
        links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + active); });
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); onScroll(); });
    measure();
    update();

    /* cursor: tilt the rig and carry an "Open case" badge */
    if (!finePointer) return;
    var badge = $('.cursor-badge');
    var bx = 0, by = 0, tbx = 0, tby = 0, braf = 0;
    function badgeTick() {
      bx += (tbx - bx) * 0.2; by += (tby - by) * 0.2;
      badge.style.transform = 'translate3d(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px,0)';
      braf = (Math.abs(tbx - bx) + Math.abs(tby - by) > 0.4) ? requestAnimationFrame(badgeTick) : 0;
    }
    projs.forEach(function (sec) {
      var stage = $('.proj__stage', sec);
      if (!stage) return;
      var mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
      function tick() {
        mx += (tx - mx) * 0.1; my += (ty - my) * 0.1;
        sec.style.setProperty('--mx', mx.toFixed(3));
        sec.style.setProperty('--my', my.toFixed(3));
        raf = (Math.abs(tx - mx) + Math.abs(ty - my) > 0.002) ? requestAnimationFrame(tick) : 0;
      }
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        tx = reduce ? 0 : (e.clientX - r.left) / r.width - 0.5;
        ty = reduce ? 0 : (e.clientY - r.top) / r.height - 0.5;
        if (!raf) raf = requestAnimationFrame(tick);
        if (badge) {
          tbx = e.clientX; tby = e.clientY;
          if (!badge.classList.contains('is-on')) { bx = tbx; by = tby; }
          badge.classList.add('is-on');
          if (!braf) braf = requestAnimationFrame(badgeTick);
        }
      });
      stage.addEventListener('pointerleave', function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(tick);
        if (badge) badge.classList.remove('is-on');
      });
    });
  }

  /* ---------- film intro: plays once, folds into the page on scroll ---------- */
  function film() {
    var sec = $('[data-film]');
    if (!sec) return;
    var video = $('.film__video', sec);
    var btn = $('[data-film-toggle]', sec);
    var bar = $('.film__bar', sec);
    var nav = $('.snav');
    var hero = $('[data-hero]');

    function setState(st) {
      sec.setAttribute('data-state', st);
      if (btn) btn.setAttribute('aria-label', st === 'playing' ? 'Pause intro film' : st === 'ended' ? 'Replay intro film' : 'Play intro film');
    }
    function land() { sec.classList.add('is-landed'); }

    if (reduce) {
      /* still frame of the last shot, copy shown, nothing autoplays */
      video.removeAttribute('autoplay');
      video.poster = video.getAttribute('data-end-poster');
      video.preload = 'none';
      land();
      setState('paused');
    } else {
      var p = video.play();
      if (p && p.then) p.then(function () { setState('playing'); }, function () { setState('paused'); land(); });
      else setState('playing');
    }

    video.addEventListener('timeupdate', function () {
      var d = video.duration || 1;
      if (bar) bar.style.setProperty('--t', (video.currentTime / d).toFixed(3));
      if (video.currentTime > d - 4) land();
    });
    video.addEventListener('ended', function () { setState('ended'); land(); });
    video.addEventListener('play', function () { setState('playing'); });
    video.addEventListener('pause', function () { if (!video.ended) setState('paused'); });

    /* sound: browsers only autoplay muted, so sound is opt-in */
    var snd = $('[data-film-sound]', sec);
    var sndLabel = snd && $('.film__sound-label', snd);
    function setSound(on) {
      video.muted = !on;
      snd.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (sndLabel) sndLabel.textContent = on ? 'Sound off' : 'Sound on';
    }
    if (snd) snd.addEventListener('click', function () {
      var on = video.muted;
      setSound(on);
      if (on && (video.ended || video.paused)) {
        if (video.ended) video.currentTime = 0;
        userPaused = false;
        video.play();
      }
    });

    if (btn) btn.addEventListener('click', function () {
      if (video.ended) { video.currentTime = 0; video.play(); }
      else if (video.paused) video.play();
      else video.pause();
    });

    /* fold progress, nav colour and pausing once the film is gone */
    var ticking = false, wasVisible = true, userPaused = false;
    if (btn) btn.addEventListener('click', function () { userPaused = video.paused; });
    function update() {
      ticking = false;
      var r = sec.getBoundingClientRect();
      var vh = window.innerHeight;
      var span = Math.max(r.height - vh, 1);
      var f = reduce ? 0 : clamp(-r.top / span, 0, 1);
      sec.style.setProperty('--f', f.toFixed(4));
      if (nav) nav.classList.toggle('snav--on-dark', f < 0.55 && r.bottom > 60);
      var visible = r.bottom > 0;
      if (visible !== wasVisible) {
        wasVisible = visible;
        if (!visible && !video.paused) video.pause();
        else if (visible && video.paused && !video.ended && !userPaused && !reduce) video.play();
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    /* the hero's entrance plays when it actually arrives */
    if (hero) {
      if (!('IntersectionObserver' in window)) { hero.classList.add('is-live'); return; }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { hero.classList.add('is-live'); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(hero);
    }
  }

  function init() {
    film();
    kinetic();
    rotator();
    reveals();
    countUps();
    stageDepth();
    stack();
    designThinking();
    copyEmail();
    workPeek();
    showcase();
    timeline();
    desk();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
