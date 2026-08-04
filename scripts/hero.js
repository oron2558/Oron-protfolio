/* Hero: splits the wordmark into letters for the staggered entrance, and
   drifts the stage slightly with the pointer so the composition has some
   depth without turning into a toy. */
(function () {
  'use strict';

  function init() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var word = hero.querySelector('.hero__word');
    if (word) {
      var text = (word.textContent || '').trim();
      word.textContent = '';
      text.split('').forEach(function (ch, i) {
        var b = document.createElement('b');
        b.style.setProperty('--i', i);
        b.textContent = ch;
        word.appendChild(b);
      });
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('is-in'); });
    });

    /* Parallax: letters and figure shift by different amounts, which reads as
       depth. Skipped on coarse pointers and when reduced motion is asked for,
       where it would only cost work. */
    var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || still) return;

    var photo = hero.querySelector('.hero__photo');
    var ticking = false;
    var tx = 0, ty = 0;

    function apply() {
      if (word) word.style.transform = 'translateX(-50%) translate3d(' + (tx * 12) + 'px,' + (ty * 7) + 'px,0)';
      if (photo) photo.style.transform = 'translateX(-50%) translate3d(' + (tx * 22) + 'px,' + (ty * 11) + 'px,0)';
      ticking = false;
    }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });

    hero.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
