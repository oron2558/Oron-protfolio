/* Shared site navigation behaviour: theme, scroll state, mobile panel.
   Loaded on every page. Safe to load alongside oronflix.js — it only wires
   .snav elements, and the theme is read from the same localStorage key so a
   choice made on one page carries to the next. */
(function () {
  'use strict';

  var THEME_KEY = 'oronflix-theme';

  /* Applied before first paint by the inline snippet in each page; repeated
     here for pages that load the script without it. */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') ||
           localStorage.getItem(THEME_KEY) || 'light';
  }

  function paintThemeIcon(btn) {
    if (!btn) return;
    var isLight = currentTheme() === 'light';
    btn.innerHTML = isLight
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  }

  function init() {
    var nav = document.querySelector('.snav');
    if (!nav) return;

    /* --- theme toggle --- */
    var themeBtn = nav.querySelector('.snav__theme');
    paintThemeIcon(themeBtn);
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var next = currentTheme() === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        paintThemeIcon(themeBtn);
      });
    }

    /* --- transparent over a hero, solid once scrolled --- */
    if (nav.classList.contains('snav--ghost')) {
      var onScroll = function () {
        nav.classList.toggle('snav--ghost', window.scrollY < 40);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* --- mobile panel --- */
    var burger = nav.querySelector('.snav__burger');
    var links = nav.querySelector('.snav__links');
    if (!burger || !links) return;

    function setMenu(open) {
      links.classList.toggle('snav__links--open', open);
      burger.classList.toggle('snav__burger--open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', function () {
      setMenu(!links.classList.contains('snav__links--open'));
    });

    links.addEventListener('click', function (e) {
      if (e.target.classList.contains('snav__link')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
