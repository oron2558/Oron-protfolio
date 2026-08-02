/* Back-to-top button for the case studies: appears once the reader is halfway
   down the page, returns to the top on click. The Work sub-nav above it needs
   no JS — it is a fixed bar with the current project named. */
(function () {
  'use strict';

  function init() {
    var btn = document.querySelector('.totop');
    if (!btn) return;

    var ticking = false;

    /* Half of the scrollable distance, not half of the document height — on a
       long case study those differ by a full viewport. Same rule on desktop
       and mobile. */
    function halfway() {
      var doc = document.documentElement;
      var scrollable = Math.max(doc.scrollHeight, document.body.scrollHeight) - window.innerHeight;
      return scrollable > 0 ? scrollable * 0.5 : Infinity;
    }

    function scrolledY() {
      return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    function sync() {
      btn.classList.toggle('totop--on', scrolledY() >= halfway());
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sync, { passive: true });

    /* Lazy-loaded images keep changing the page height as the reader goes, so
       recheck when it settles rather than trusting the first measurement. */
    if (window.ResizeObserver) {
      new ResizeObserver(sync).observe(document.documentElement);
    }
    window.addEventListener('load', sync);

    btn.addEventListener('click', function () {
      /* Honour a reduced-motion preference rather than animating past a whole
         case study's worth of scroll. */
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
