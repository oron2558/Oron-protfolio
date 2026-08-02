/* Back-to-top button for the case studies: appears once the reader is past
   the first screen, returns to the top on click. The Work sub-nav above it
   needs no JS — it is a sticky bar with a marked current item. */
(function () {
  'use strict';

  function init() {
    var btn = document.querySelector('.totop');
    if (!btn) return;

    var threshold = Math.max(500, window.innerHeight * 0.6);
    var ticking = false;

    function sync() {
      btn.classList.toggle('totop--on', window.scrollY > threshold);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    }, { passive: true });

    window.addEventListener('resize', function () {
      threshold = Math.max(500, window.innerHeight * 0.6);
      sync();
    }, { passive: true });

    btn.addEventListener('click', function () {
      /* Honour a reduced-motion preference rather than animating past a
         whole case study's worth of scroll. */
      var reduce = window.matchMedia &&
                   window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    sync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
