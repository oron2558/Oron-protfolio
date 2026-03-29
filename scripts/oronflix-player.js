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

  // ---------- Scroll Progress Bar ----------
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

  // ---------- Theme Toggle ----------
  window.toggleTheme = function() {
    var html = document.documentElement;
    var isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) { html.setAttribute('data-theme', 'light'); localStorage.setItem('oronflix-theme', 'light'); }
    else { html.setAttribute('data-theme', 'dark'); localStorage.setItem('oronflix-theme', 'dark'); }
  };

  // ---------- Scroll Reveal Animation ----------
  function initScrollReveal() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Stagger children
          if (entry.target.classList.contains('stagger')) {
            var children = entry.target.children;
            Array.from(children).forEach(function(child, i) {
              child.style.transitionDelay = (i * 0.1) + 's';
              child.style.opacity = '0';
              child.style.transform = 'translateY(20px)';
              requestAnimationFrame(function() {
                child.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';
                child.style.transitionDelay = (i * 0.1) + 's';
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
              });
            });
          }

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
      observer.observe(el);
    });
  }

  // ---------- Screen Showcase Animation ----------
  function initScreenAnimate() {
    var els = document.querySelectorAll('.cs-screen-animate');
    if (!els.length) return;

    var screenObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          screenObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    els.forEach(function(el) { screenObserver.observe(el); });
  }

  // ---------- Pain Bar Animation ----------
  function initPainBars() {
    var bars = document.querySelectorAll('.cs-pain-bars');
    if (!bars.length) return;

    var barObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.cs-pain-bar-fill').forEach(function(bar, i) {
            setTimeout(function() { bar.classList.add('animated'); }, i * 200);
          });
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    bars.forEach(function(el) { barObserver.observe(el); });
  }

  // ---------- Counter Animation ----------
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    var counterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-count'), 10);
          if (isNaN(target)) return;

          var suffix = el.textContent.indexOf('%') !== -1 ? '%' : '';
          var duration = 1500;
          var start = performance.now();

          function tick(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(eased * target);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    els.forEach(function(el) { counterObserver.observe(el); });
  }

  // ---------- Progress Fill Animation ----------
  function initProgressFills() {
    var els = document.querySelectorAll('.cs-progress-fill');
    if (!els.length) return;

    var progressObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var fill = entry.target;
          var width = fill.style.width;
          fill.style.width = '0%';
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              fill.style.width = width;
            });
          });
          progressObserver.unobserve(fill);
        }
      });
    }, { threshold: 0.3 });

    els.forEach(function(el) { progressObserver.observe(el); });
  }

  // ---------- Parallax Section Numbers ----------
  function initParallax() {
    var numbers = document.querySelectorAll('.cs-section-number');
    if (!numbers.length) return;

    window.addEventListener('scroll', function() {
      numbers.forEach(function(num) {
        var rect = num.getBoundingClientRect();
        var scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        var offset = (scrollProgress - 0.5) * 30;
        num.style.transform = 'translateY(' + offset + 'px)';
      });
    }, { passive: true });
  }

  // ---------- Sticky Notes Entrance ----------
  function initStickyNotes() {
    var boards = document.querySelectorAll('.cs-affinity-board');
    if (!boards.length) return;

    var stickyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var notes = entry.target.querySelectorAll('.cs-sticky-note');
          notes.forEach(function(note, i) {
            note.style.opacity = '0';
            note.style.transform = 'translateY(12px) rotate(' + (note.style.getPropertyValue('--rotate') || '0deg') + ')';
            setTimeout(function() {
              note.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)';
              note.style.opacity = '1';
              note.style.transform = 'translateY(0) rotate(' + (note.style.getPropertyValue('--rotate') || '0deg') + ')';
            }, 80 * i);
          });
          stickyObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    boards.forEach(function(el) { stickyObserver.observe(el); });
  }

  // ---------- RTL Horizontal Scroll ----------
  function initRtlScroll() {
    var selectors = [
      '.cs-journey-flow',
      '.cs-journey-scroll',
      '.cs-flow-wrap',
      '.cs-matrix'
    ];
    var containers = document.querySelectorAll(selectors.join(','));
    containers.forEach(function(el) {
      el.style.direction = 'rtl';
      Array.from(el.children).forEach(function(child) {
        child.style.direction = 'ltr';
      });
    });
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', function() {
    initScrollProgress();
    initNextEpisode();
    initScrollReveal();
    initScreenAnimate();
    initPainBars();
    initCounters();
    initProgressFills();
    initParallax();
    initStickyNotes();
    initRtlScroll();
  });

})();
