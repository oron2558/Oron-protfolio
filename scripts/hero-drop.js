/* Hero entrance: the artwork lands, and stone chips fall past it while it
   does. Plays once per page load. */
(function () {
  'use strict';

  var CHIPS = 22;
  var STONE = ['#cfc7bb', '#bdb4a6', '#d8d2c8', '#b0a798'];

  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function init() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var frame = hero.querySelector('.hero__frame');
    if (!frame) return;

    var still = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!still) {
      /* Deterministic scatter: the chips should look thrown, but land the same
         way on every load rather than reshuffling. */
      var rnd = seeded(20260805);
      var frag = document.createDocumentFragment();

      for (var i = 0; i < CHIPS; i++) {
        var c = document.createElement('span');
        c.className = 'hero__chip';
        c.style.left = (4 + rnd() * 92).toFixed(1) + '%';
        c.style.setProperty('--s', (9 + rnd() * 16).toFixed(0) + 'px');
        c.style.setProperty('--c', STONE[Math.floor(rnd() * STONE.length)]);
        c.style.setProperty('--fall', (260 + rnd() * 520).toFixed(0) + 'px');
        c.style.setProperty('--spin', ((rnd() - 0.5) * 540).toFixed(0) + 'deg');
        c.style.setProperty('--dur', (900 + rnd() * 700).toFixed(0) + 'ms');
        c.style.setProperty('--delay', (rnd() * 380).toFixed(0) + 'ms');
        frag.appendChild(c);
      }
      frame.appendChild(frag);
    }

    /* Two frames so the start state is painted before the class flips. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('hero--drop'); });
    });

    /* Tidy up once the chips are done — they are decoration, not content. */
    if (!still) {
      window.setTimeout(function () {
        var chips = frame.querySelectorAll('.hero__chip');
        for (var i = 0; i < chips.length; i++) chips[i].remove();
      }, 2400);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
