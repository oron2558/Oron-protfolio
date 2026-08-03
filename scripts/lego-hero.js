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

  var SVG = {
    lego:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect x="7" y="13" width="12" height="9" rx="3" fill="#d01012"/>' +
      '<rect x="26" y="13" width="12" height="9" rx="3" fill="#d01012"/>' +
      '<rect x="45" y="13" width="12" height="9" rx="3" fill="#d01012"/>' +
      '<rect x="4" y="20" width="56" height="28" rx="6" fill="#d01012"/>' +
      '<rect x="4" y="39" width="56" height="9" rx="4" fill="#9d0b0d"/>' +
      '</svg>',
    rc:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<path d="M8 39 L17 25 H43 L56 39 Z" fill="#0a5bb5"/>' +
      '<path d="M21 28 H39 L45 37 H15 Z" fill="#5aa0ef"/>' +
      '<rect x="4" y="37" width="56" height="7" rx="3.5" fill="#08427f"/>' +
      '<circle cx="17" cy="47" r="8" fill="#1d2433"/><circle cx="17" cy="47" r="3.4" fill="#f6c200"/>' +
      '<circle cx="47" cy="47" r="8" fill="#1d2433"/><circle cx="47" cy="47" r="3.4" fill="#f6c200"/>' +
      '<path d="M50 25 L58 11" stroke="#1d2433" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="58.5" cy="9.5" r="3" fill="#d01012"/>' +
      '</svg>',
    glove:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<path d="M16 21c0-7 6-12 14-12h6c8 0 14 5 14 13v9c0 8-6 13-14 13H30c-8 0-14-5-14-13z" fill="#d01012"/>' +
      '<path d="M16 27c-5 0-8 3-8 7s3 7 8 7h4V27z" fill="#d01012"/>' +
      '<rect x="18" y="42" width="32" height="12" rx="5" fill="#9d0b0d"/>' +
      '<path d="M24 48h20" stroke="#f2dada" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M29 17c4-2 9-2 13 0" stroke="#9d0b0d" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
      '</svg>',
    racket:
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<ellipse cx="30" cy="24" rx="19" ry="21" fill="#fff"/>' +
      '<path d="M19 10v28M25 7v34M31 6v35M37 7v34M43 11v27" stroke="#c3ddcb" stroke-width="1.7"/>' +
      '<path d="M13 14h34M11 22h38M12 30h36M17 38h26" stroke="#c3ddcb" stroke-width="1.7"/>' +
      '<ellipse cx="30" cy="24" rx="19" ry="21" fill="none" stroke="#237841" stroke-width="6"/>' +
      '<rect x="27" y="43" width="6" height="16" rx="3" fill="#1d2433"/>' +
      '<rect x="24.5" y="52" width="11" height="10" rx="4" fill="#f6c200"/>' +
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
