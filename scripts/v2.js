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
    var segs = $$('[data-dt-go]', root);
    var steps = $$('[data-dt-step]', root);
    var modes = $$('.dt__mode span', root);
    var shots = $$('.dt__shots img', root);
    var caps = $$('.dt__shots figcaption span', root);
    var now = $('.dt__now span', root);
    var runPath = $('.dt__map-run', root);
    var mapDot = $('.dt__map-dot', root);
    var canvas = $('.dt__canvas', root);
    var ctx = canvas.getContext('2d');
    var STAGES = steps.length;
    var pinned = !reduce;
    var s = 0, active = -1, visible = false, raf = 0;

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
      var avail = $('.dt__steps', root).clientWidth, max = 0;
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

    /* --- dot field --- */
    var W = 0, H = 0, dpr = 1, N = 0, dots = [], shapes = [];
    var mx = -999, my = -999;
    function rnd(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

    function build() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      N = W < 600 ? 120 : 170;
      var cx = W * 0.44, cy = H * 0.46, R = Math.min(W, H);
      shapes = [[], [], [], [], []];
      for (var i = 0; i < N; i++) {
        var a = rnd(i + 1), b = rnd(i + 101), c = rnd(i + 201);
        /* 0 Empathize: people scattered across the whole field */
        shapes[0].push([W * (0.06 + 0.88 * a), H * (0.16 + 0.74 * b)]);
        /* 1 Define: everything pulled into one focused disc */
        var ang = i * 2.39996, rad = Math.sqrt((i + 0.5) / N) * R * 0.2;
        shapes[1].push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
        /* 2 Ideate: five idea clusters, one bigger (the chosen one) */
        var k = i % 5, ca = -Math.PI / 2 + k * (Math.PI * 2 / 5) + 0.3;
        var cr = k === 0 ? R * 0.13 : R * 0.075, ccx = cx + Math.cos(ca) * R * 0.27, ccy = cy + Math.sin(ca) * R * 0.25;
        if (k === 0) { ccx = cx; ccy = cy; }
        var ia = c * Math.PI * 2, ir = Math.sqrt(a) * cr;
        shapes[2].push([ccx + Math.cos(ia) * ir, ccy + Math.sin(ia) * ir]);
        /* 3 Prototype: a phone screen, outline plus wireframe rows */
        var pw = R * 0.34, ph = R * 0.62, px = cx - pw / 2, py = cy - ph / 2, p;
        if (i < N * 0.42) {
          var t = i / (N * 0.42), per = 2 * (pw + ph), d = t * per;
          if (d < pw) p = [px + d, py];
          else if (d < pw + ph) p = [px + pw, py + d - pw];
          else if (d < 2 * pw + ph) p = [px + pw - (d - pw - ph), py + ph];
          else p = [px, py + ph - (d - 2 * pw - ph)];
        } else {
          var j = i - Math.ceil(N * 0.42), rows = [0.12, 0.2, 0.34, 0.42, 0.5, 0.64, 0.72, 0.86], cols = 9;
          var row = rows[Math.floor(j / cols) % rows.length], col = j % cols;
          var len = row === 0.12 || row === 0.34 || row === 0.64 ? 0.55 : row === 0.86 ? 1 : 0.85;
          p = [px + pw * 0.12 + (col / (cols - 1)) * pw * 0.76 * len, py + ph * row];
        }
        shapes[3].push(p);
        /* 4 Test: a loop that keeps running */
        shapes[4].push([i / N]);
      }
      if (!dots.length || dots.length !== N) {
        dots = [];
        for (var n = 0; n < N; n++) dots.push({ x: shapes[0][n][0], y: shapes[0][n][1], vx: 0, vy: 0, d: rnd(n + 401) * 0.35, ph: rnd(n + 501) * 6.28, hot: n % 17 === 0 });
      }
    }

    function loopPos(u, time) {
      var t = (u + time * 0.00006) * Math.PI * 2;
      var R = Math.min(W, H), sc = R * 0.34;
      /* lemniscate: test, learn, go again */
      var den = 1 + Math.sin(t) * Math.sin(t);
      return [W * 0.47 + sc * Math.cos(t) / den * 1.25, H * 0.44 + sc * Math.sin(t) * Math.cos(t) / den * 1.1];
    }

    function target(stage, n, time) {
      if (stage === 4) return loopPos(shapes[4][n][0], time);
      return shapes[stage][n];
    }

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    var ink = '#141414', accent = '#ff4f1a';
    function colors() {
      var cs = getComputedStyle(root);
      ink = cs.getPropertyValue('--ink').trim() || ink;
      accent = cs.getPropertyValue('--accent').trim() || accent;
    }

    function draw(time) {
      raf = 0;
      var i0 = Math.min(Math.floor(s), STAGES - 1), f = s - i0, i1 = Math.min(i0 + 1, STAGES - 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var n = 0; n < N; n++) {
        var d = dots[n];
        var e = reduce ? (f >= 0.5 ? 1 : 0) : ease(clamp((f - 0.2 - d.d * 0.6) / 0.45, 0, 1));
        var a = target(i0, n, time), b = target(i1, n, time);
        var tx = a[0] + (b[0] - a[0]) * e, ty = a[1] + (b[1] - a[1]) * e;
        if (!reduce) {
          var wob = (i0 === 0 && e < 0.5) || (i1 === 0) ? 6 : 1.6;
          tx += Math.sin(time * 0.0011 + d.ph) * wob;
          ty += Math.cos(time * 0.0013 + d.ph * 1.3) * wob;
          var dx = d.x - mx, dy = d.y - my, dist = Math.hypot(dx, dy);
          if (dist < 90 && dist > 0.1) { var push = (1 - dist / 90) * 26; tx += dx / dist * push; ty += dy / dist * push; }
          d.vx = (d.vx + (tx - d.x) * 0.09) * 0.72;
          d.vy = (d.vy + (ty - d.y) * 0.09) * 0.72;
          d.x += d.vx; d.y += d.vy;
        } else { d.x = tx; d.y = ty; }
        var r = d.hot ? 4.2 : 2.4;
        ctx.globalAlpha = d.hot ? 1 : 0.78;
        ctx.fillStyle = d.hot ? accent : ink;
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 6.2832); ctx.fill();
      }
      /* Empathize: listening ripples around the highlighted people */
      var ripple = (i0 === 0 ? 1 - f * 2 : 0);
      if (ripple > 0 && !reduce) {
        ctx.strokeStyle = accent; ctx.lineWidth = 1;
        for (var h = 0; h < N; h += 17) {
          var ph = ((time * 0.0006) + h * 0.13) % 1;
          ctx.globalAlpha = (1 - ph) * 0.5 * ripple;
          ctx.beginPath(); ctx.arc(dots[h].x, dots[h].y, 6 + ph * 26, 0, 6.2832); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    }

    function kick() { if (!raf) raf = requestAnimationFrame(draw); }

    /* --- double-diamond mini map --- */
    var runLen = runPath ? runPath.getTotalLength() : 0;
    var marks = [0, 0.25, 0.5, 0.75, 1];
    function map() {
      if (!runPath) return;
      var i0 = Math.min(Math.floor(s), STAGES - 1), f = s - i0;
      var u = i0 >= STAGES - 1 ? 1 : marks[i0] + (marks[i0 + 1] - marks[i0]) * f;
      /* the loop part is the last quarter; Test runs around it */
      var L = runLen * (0.78 * Math.min(u / 0.75, 1) + (u > 0.75 ? 0.22 * ((u - 0.75) / 0.25) : 0));
      runPath.style.strokeDasharray = runLen + ' ' + runLen;
      runPath.style.strokeDashoffset = (runLen - L).toFixed(1);
      var pt = runPath.getPointAtLength(Math.max(L, 0.01));
      mapDot.setAttribute('cx', pt.x.toFixed(1)); mapDot.setAttribute('cy', pt.y.toFixed(1));
    }

    function setActive(i) {
      if (i === active) return;
      var prev = active;
      active = i;
      steps.forEach(function (st, k) { st.classList.toggle('is-on', k === i); });
      segs.forEach(function (sg, k) { if (k === i) sg.setAttribute('aria-current', 'step'); else sg.removeAttribute('aria-current'); });
      modes.forEach(function (m, k) { m.classList.toggle('is-on', k === i); m.classList.toggle('is-off', k !== i && k < i); });
      shots.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
      caps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
      if (now) {
        now.textContent = '0' + (i + 1);
        if (!reduce && prev !== -1) now.animate([{ transform: 'translateY(' + (i > prev ? '100%' : '-100%') + ')' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
    }

    function fills() {
      segs.forEach(function (sg, k) { sg.style.setProperty('--fill', clamp(s - k + 1, 0, 1).toFixed(3)); });
    }

    function measure() {
      if (!pinned) return;
      var r = track.getBoundingClientRect();
      var len = track.offsetHeight - window.innerHeight;
      s = clamp(-r.top / Math.max(len, 1), 0, 1) * (STAGES - 1);
      setActive(Math.round(s));
      fills(); map();
      kick();
    }

    function go(k) {
      if (pinned) {
        var top = track.getBoundingClientRect().top + window.scrollY;
        var len = track.offsetHeight - window.innerHeight;
        window.scrollTo({ top: top + len * (k / (STAGES - 1)) + 2, behavior: 'smooth' });
      } else {
        s = k; setActive(k); fills(); map(); kick();
      }
    }
    segs.forEach(function (sg) {
      sg.addEventListener('click', function () { go(+sg.getAttribute('data-dt-go')); });
    });
    root.addEventListener('keydown', function (e) {
      if (!e.target.closest('.dt__nav')) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var k = clamp(active + (e.key === 'ArrowRight' ? 1 : -1), 0, STAGES - 1);
      segs[k].focus(); go(k);
    });

    var viz = $('.dt__viz', root);
    if (finePointer && !reduce) {
      viz.addEventListener('pointermove', function (e) { var r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      viz.addEventListener('pointerleave', function () { mx = my = -999; });
    }

    colors(); build(); setActive(0); fills(); map();
    if (pinned) {
      window.addEventListener('scroll', measure, { passive: true });
      measure();
    }
    window.addEventListener('resize', function () { build(); measure(); kick(); });
    new MutationObserver(function () { colors(); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(viz);
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
