/* Hero wordmark and the floating hobby icons.

   ORON is display type now, one LEGO colour per letter with a solid extrude
   behind it. The letters are split into spans here rather than in the markup
   so the entrance stagger stays a single number to tune. */
(function () {
  'use strict';

  var WORD = 'ORON';

  /* Where each icon sits in the poster and how far it wanders. All four are
     kept out toward the edges so none of them collide with the portrait. */
  var ICONS = [
    { key: 'lego',   x: '6%',  y: '20%', dur: 7.5, delay: 0,   drift: 14, rot: -8 },
    { key: 'rc',     x: '85%', y: '16%', dur: 9,   delay: 0.6, drift: 18, rot: 7 },
    { key: 'glove',  x: '4%',  y: '78%', dur: 8.2, delay: 1.1, drift: 16, rot: 9 },
    { key: 'racket', x: '91%', y: '74%', dur: 10,  delay: 0.3, drift: 20, rot: -10 }
  ];

  /* Monoline, single colour, no fills — the hobbies belong here as a quiet
     detail, not as toy stickers. */
  var SVG = {
    lego:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="6" y="16" width="36" height="20" rx="4"/>' +
      '<path d="M14 16v-4h7v4M27 16v-4h7v4"/>' +
      '</svg>',
    rc:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M7 30l6-10h22l7 10"/>' +
      '<path d="M5 30h38"/>' +
      '<circle cx="14" cy="35" r="5"/><circle cx="34" cy="35" r="5"/>' +
      '<path d="M36 20l6-11"/><circle cx="42.5" cy="8" r="1.8"/>' +
      '</svg>',
    glove:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14 18a8 8 0 0 1 8-8h5a9 9 0 0 1 9 9v7a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z"/>' +
      '<path d="M14 21h-3a4 4 0 0 0 0 8h3"/>' +
      '<path d="M17 34h16v4a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2z"/>' +
      '</svg>',
    racket:
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<ellipse cx="22" cy="18" rx="13" ry="15"/>' +
      '<path d="M22 5v26M11 18h22"/>' +
      '<path d="M27 30l8 11"/>' +
      '</svg>'
  };

  function buildWord(el) {
    el.textContent = '';
    WORD.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.className = 'oron__l';
      s.style.setProperty('--i', i);
      s.textContent = ch;
      el.appendChild(s);
    });
  }

  function buildIcons(host) {
    ICONS.forEach(function (cfg) {
      var el = document.createElement('span');
      el.className = 'hfloat hfloat--' + cfg.key;
      /* Position through custom properties so a media query can move them
         without fighting inline styles. */
      el.style.setProperty('--x', cfg.x);
      el.style.setProperty('--y', cfg.y);
      el.style.setProperty('--dur', cfg.dur + 's');
      el.style.setProperty('--delay', cfg.delay + 's');
      el.style.setProperty('--drift', cfg.drift + 'px');
      el.style.setProperty('--rot', cfg.rot + 'deg');
      el.innerHTML = SVG[cfg.key];
      host.appendChild(el);
    });
  }

  function init() {
    var word = document.getElementById('oronWord');
    var stage = document.querySelector('.lego-stage');
    var poster = document.querySelector('.lego-poster');
    if (word) buildWord(word);
    if (poster) buildIcons(poster);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (word) word.classList.add('is-in');
        if (stage) stage.classList.add('is-built');
        if (poster) poster.classList.add('is-in');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
