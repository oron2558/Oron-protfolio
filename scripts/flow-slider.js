/* Horizontal flow slider.

   The track is a native scroll-snap container, so touch swipe and trackpad
   scrolling work without any JS. This only wires the tabs, arrows and dots to
   it, and reflects the scroll position back into them. */
(function () {
  'use strict';

  function setup(flow) {
    var track = flow.querySelector('.flow__track');
    if (!track) return;

    var items = Array.prototype.slice.call(track.querySelectorAll('.flow__item'));
    var tabs = Array.prototype.slice.call(flow.querySelectorAll('.flow__tab'));
    var dots = Array.prototype.slice.call(flow.querySelectorAll('.flow__dot'));
    var prev = flow.querySelector('[data-flow-prev]');
    var next = flow.querySelector('[data-flow-next]');
    if (!items.length) return;

    function current() {
      /* Nearest item to the left edge of the viewport, rather than a divided
         index — the items are not always the same width. */
      var best = 0, bestDist = Infinity;
      var left = track.scrollLeft;
      items.forEach(function (el, i) {
        var d = Math.abs(el.offsetLeft - track.offsetLeft - left);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function goTo(i) {
      i = Math.max(0, Math.min(items.length - 1, i));
      track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft });
    }

    function sync() {
      var i = current();
      tabs.forEach(function (t, n) { t.setAttribute('aria-selected', String(n === i)); });
      dots.forEach(function (d, n) { d.setAttribute('aria-current', String(n === i)); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === items.length - 1;
    }

    tabs.forEach(function (t, i) { t.addEventListener('click', function () { goTo(i); }); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });
    if (prev) prev.addEventListener('click', function () { goTo(current() - 1); });
    if (next) next.addEventListener('click', function () { goTo(current() + 1); });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
    });

    window.addEventListener('resize', sync, { passive: true });
    sync();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-flow]'), setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
