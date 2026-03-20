/* ============================================
   ORONFLIX — Player (Case Study) Logic
   ============================================ */

(function() {
  'use strict';

  var PROGRESS_KEY = 'oronflix-progress';
  var projectId = document.body.getAttribute('data-project');

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch(e) { return {}; }
  }

  function saveProgress(percent) {
    if (!projectId) return;
    var progress = getProgress();
    progress[projectId] = {
      percent: Math.round(percent),
      lastVisited: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  // ---------- Scroll Progress ----------
  function initScrollProgress() {
    var fill = document.querySelector('.onf-player-chrome__progress-fill');
    if (!fill) return;

    var ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          var scrollTop = window.scrollY;
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

          fill.style.width = percent + '%';
          saveProgress(percent);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ---------- Next Episode Prompt ----------
  function initNextEpisode() {
    var prompt = document.querySelector('.onf-next-episode');
    if (!prompt) return;

    var shown = false;

    window.addEventListener('scroll', function() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (percent > 90 && !shown) {
        prompt.classList.add('onf-next-episode--visible');
        shown = true;
      } else if (percent < 85 && shown) {
        prompt.classList.remove('onf-next-episode--visible');
        shown = false;
      }
    });
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', function() {
    initScrollProgress();
    initNextEpisode();
  });

})();
