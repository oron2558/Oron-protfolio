/* Case studies, v2 layer.
   Every case study is told through the same five Design Thinking stages as
   the home page. This script finds where each stage starts on the page,
   opens it with a chapter (stage word, marker, one line about what happened
   in this project), and keeps a rail at the bottom that shows where the
   reader is in the process. It also adds count-ups and a zoom view. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGES = [
    { key: 'empathize', word: 'Empathize', mode: 'Diverge', mk: '#ffe45c' },
    { key: 'define', word: 'Define', mode: 'Converge', mk: '#9be7c4' },
    { key: 'ideate', word: 'Ideate', mode: 'Diverge', mk: '#ffb3c7' },
    { key: 'prototype', word: 'Prototype', mode: 'Converge', mk: '#a9d4ff' },
    { key: 'test', word: 'Test', mode: 'Loop', mk: '#cdb8ff' }
  ];
  var ICONS = {
    Diverge: 'M2 10 L54 2 M2 10 L54 18',
    Converge: 'M2 2 L54 10 L2 18',
    Loop: 'M28 10 C20 2 6 2 6 10 C6 18 20 18 28 10 C36 2 50 2 50 10 C50 18 36 18 28 10'
  };

  /* where each stage starts (a heading on the page) and what happened in it */
  var PAGES = {
    'ai-crm': [
      ['4 Questions Driving', '12 interviews and shadowing sessions with solo professionals who juggle WhatsApp, Instagram and email all day.'],
      ['One Problem, One Hypothesis', 'Everything I heard, narrowed to one problem statement and a testable hypothesis, then traced through a real workday.'],
      ['How Might We', 'Nine How Might We questions, then a feature map where every screen has to earn its place.'],
      ['Research-Driven Screen Design', 'High-fidelity screens in Figma, each one tied back to a finding from the research.'],
      ['Projected Impact', 'What the design should move, how I would measure it, and what I would change next time.']
    ],
    'woofio': [
      ['Research Goals', 'A survey of dog owners and an affinity map of how they juggle vets, walkers and family today.'],
      ['One Problem, One Hypothesis', 'The top pain points, narrowed to one problem and one hypothesis, then lived through a full day.'],
      ['HMW Questions', 'How Might We questions across trust, convenience and communication, before any screen was drawn.'],
      ['Pain Points Become Screens', 'Each pain point becomes a screen: health dashboard, family profile, walkers and a smart schedule.'],
      ['Measurable Impact', 'The impact I expect, what I learned and what I would do differently.']
    ],
    'myplanner': [
      ['18 Interviews', '18 interviews with couples, three core questions, and assumptions put to the test (two of three were wrong).'],
      ['From Patterns to a Design Challenge', 'Patterns from the interviews become one design challenge, mapped week by week.'],
      ['How Might We', 'Nine How Might We challenges across budget, suppliers and stress.'],
      ['Each Screen Solves a Pain Point', 'Every screen answers a pain point: the event dashboard, smart budget, suppliers and payments.'],
      ['Projected Impact', 'Four metrics the product should move, plus lessons and next steps.']
    ],
    'mba': [
      ['For a couple, everything is scattered', 'Couples juggle a pile of suppliers, and I surveyed seven RSVP providers to see what the market really offers.'],
      ["A strategist's cross-view", 'Stepping back to the host’s real job: arrivals, seating and money in one place.'],
      ['What I specced and shipped', 'The spec: one focused product, six capabilities, nothing extra.'],
      ['Real screens from the shipped app', 'The shipped iOS app, the web console and a walkthrough of the live product.'],
      ['Not projected', 'Real traction: 486 registered users, a 5.0 App Store rating and paying subscribers.']
    ]
  };

  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var key = document.body.getAttribute('data-project') || (/casestudy-mba/.test(location.pathname) ? 'mba' : '');
  var plan = PAGES[key];
  document.documentElement.classList.add('cs2');
  requestAnimationFrame(function () { document.body.classList.add('cs2-ready'); });

  /* ---------- chapters ---------- */
  var chapters = [];
  if (plan) {
    var blocks = $$('section.cs-section, section.csl-section');
    plan.forEach(function (p, i) {
      var needle = p[0].toLowerCase();
      var host = null;
      for (var b = 0; b < blocks.length; b++) {
        var h = blocks[b].querySelector('h2, h3');
        if (h && h.textContent.toLowerCase().indexOf(needle) !== -1) { host = blocks[b]; break; }
      }
      if (!host) return;
      var st = STAGES[i];
      var ch = document.createElement('section');
      ch.className = 'cs2-chapter';
      ch.id = 'stage-' + st.key;
      ch.style.setProperty('--mk', st.mk);
      ch.setAttribute('aria-label', 'Stage ' + (i + 1) + ': ' + st.word);
      ch.innerHTML =
        '<div class="cs2-chapter__inner">' +
          '<p class="cs2-chapter__num">0' + (i + 1) + ' / 05</p>' +
          '<h2 class="cs2-chapter__word"><span>' + st.word + '</span></h2>' +
          '<p class="cs2-chapter__lede"></p>' +
          '<p class="cs2-chapter__mode"><svg viewBox="0 0 56 20" aria-hidden="true"><path d="' + ICONS[st.mode] + '"/></svg>' + st.mode + '</p>' +
        '</div>';
      ch.querySelector('.cs2-chapter__lede').textContent = p[1];
      host.parentNode.insertBefore(ch, host);
      chapters.push({ el: ch, stage: st, i: i });
    });
  }

  /* ---------- rail ---------- */
  if (chapters.length) {
    var rail = document.createElement('nav');
    rail.className = 'cs2-rail';
    rail.setAttribute('aria-label', 'Design process');
    var ol = document.createElement('ol');
    chapters.forEach(function (c) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + c.el.id;
      a.style.setProperty('--mk', c.stage.mk);
      a.innerHTML = '<i aria-hidden="true"></i><span>' + c.stage.word + '</span>';
      li.appendChild(a);
      ol.appendChild(li);
      c.link = a;
    });
    rail.appendChild(ol);
    document.body.appendChild(rail);

    var current = -2, ticking = false;
    var foot = document.querySelector('.cs-nav-projects, .csl-next, .onf-footer, footer');
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.45, idx = -1;
      chapters.forEach(function (c, k) { if (c.el.getBoundingClientRect().top < line) idx = k; });
      var show = chapters[0].el.getBoundingClientRect().top < window.innerHeight * 0.9;
      if (foot && foot.getBoundingClientRect().top < window.innerHeight - 40) show = false;
      rail.classList.toggle('is-on', show);
      if (idx === current) return;
      current = idx;
      chapters.forEach(function (c, k) {
        c.link.classList.toggle('is-on', k === idx);
        c.link.classList.toggle('is-done', k < idx);
        if (k === idx) c.link.setAttribute('aria-current', 'step'); else c.link.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.35 });
      chapters.forEach(function (c) { io.observe(c.el); });
    } else {
      chapters.forEach(function (c) { c.el.classList.add('is-in'); });
    }
  }

  /* ---------- count-ups ---------- */
  var nums = $$('.cs-kpi-value, .csl-stat__num, .pf-proof__stat-num, .csl-tile__num, .cs-pain-bar-pct');
  function countUp(el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, ''));
    var dec = (m[2].split('.')[1] || '').length;
    var comma = m[2].indexOf(',') !== -1;
    var t0 = 0, dur = 1200;
    function fmt(v) {
      var s = v.toFixed(dec);
      if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return m[1] + s + m[3];
    }
    el.style.fontVariantNumeric = 'tabular-nums';
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
    }
    requestAnimationFrame(step);
  }
  if (!reduce && 'IntersectionObserver' in window && nums.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* ---------- zoom view for screens ---------- */
  var box = null;
  function closeBox() {
    if (!box) return;
    var b = box; box = null;
    b.classList.remove('is-on');
    setTimeout(function () { b.remove(); }, reduce ? 0 : 260);
    document.removeEventListener('keydown', onKey);
    if (lastFocus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === 'Escape') closeBox(); }
  var lastFocus = null;
  function openBox(img) {
    lastFocus = img;
    box = document.createElement('div');
    box.className = 'cs2-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', img.alt || 'Screen');
    var big = document.createElement('img');
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || '';
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'cs2-lightbox__close';
    x.setAttribute('aria-label', 'Close');
    x.textContent = '×';
    box.appendChild(big); box.appendChild(x);
    box.addEventListener('click', closeBox);
    document.body.appendChild(box);
    requestAnimationFrame(function () { box && box.classList.add('is-on'); });
    document.addEventListener('keydown', onKey);
    x.focus();
  }
  function wireZoom() {
    $$('section img').forEach(function (img) {
      if (img.closest('.cs-hero, .csl-hero, a, button, .flow, .cs2-zoom, .onf-next-episode')) return;
      if (img.getBoundingClientRect().width < 320) return;
      img.classList.add('cs2-zoom');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      if (!img.alt) img.alt = 'Open screen';
      img.addEventListener('click', function () { openBox(img); });
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBox(img); } });
    });
  }
  if (document.readyState === 'complete') wireZoom(); else window.addEventListener('load', wireZoom);
})();
