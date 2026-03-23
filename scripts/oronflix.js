/* ============================================
   ORONFLIX — Core JavaScript
   ============================================ */

(function() {
  'use strict';

  // ---------- Theme ----------
  var savedTheme = localStorage.getItem('oronflix-theme');
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  function toggleTheme() {
    var html = document.documentElement;
    var isLight = html.getAttribute('data-theme') === 'light';
    if (isLight) {
      html.removeAttribute('data-theme');
      localStorage.setItem('oronflix-theme', 'dark');
    } else {
      html.setAttribute('data-theme', 'light');
      localStorage.setItem('oronflix-theme', 'light');
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = isLight
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    }
  }

  // ---------- Nav Scroll Effect ----------
  function initNavScroll() {
    var nav = document.querySelector('.onf-nav');
    if (!nav) return;

    var scrollThreshold = 80;
    var ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          if (window.scrollY > scrollThreshold) {
            nav.classList.add('onf-nav--solid');
          } else {
            nav.classList.remove('onf-nav--solid');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ---------- Mobile Nav ----------
  function initMobileNav() {
    var toggle = document.querySelector('.onf-nav__hamburger');
    var links = document.querySelector('.onf-nav__links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function() {
      links.classList.toggle('onf-nav__links--open');
    });

    links.addEventListener('click', function(e) {
      if (e.target.classList.contains('onf-nav__link')) {
        links.classList.remove('onf-nav__links--open');
      }
    });
  }

  // ---------- Billboard Rotation ----------
  function initBillboard() {
    var slides = document.querySelectorAll('.onf-billboard__slide');
    var dots = document.querySelectorAll('.onf-billboard__dot');
    var timerFill = document.querySelector('.onf-billboard__timer-fill');
    if (slides.length === 0) return;

    var currentIndex = 0;
    var intervalTime = 4000;
    var interval;

    function showSlide(index) {
      slides.forEach(function(s) { s.classList.remove('onf-billboard__slide--active'); });
      dots.forEach(function(d) { d.classList.remove('onf-billboard__dot--active'); });

      slides[index].classList.add('onf-billboard__slide--active');
      if (dots[index]) dots[index].classList.add('onf-billboard__dot--active');

      // Reset timer animation
      if (timerFill) {
        timerFill.style.animation = 'none';
        timerFill.offsetHeight; // force reflow
        timerFill.style.animation = 'billboardTimer ' + (intervalTime / 1000) + 's linear';
      }

      currentIndex = index;
    }

    function nextSlide() {
      showSlide((currentIndex + 1) % slides.length);
    }

    function startAutoPlay() {
      interval = setInterval(nextSlide, intervalTime);
    }

    function stopAutoPlay() {
      clearInterval(interval);
    }

    // Dot clicks
    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() {
        stopAutoPlay();
        showSlide(i);
        startAutoPlay();
      });
    });

    // Pause on hover
    var billboard = document.querySelector('.onf-billboard');
    if (billboard) {
      billboard.addEventListener('mouseenter', stopAutoPlay);
      billboard.addEventListener('mouseleave', startAutoPlay);
    }

    showSlide(0);
    startAutoPlay();
  }

  // ---------- Carousel Arrows ----------
  function initCarousels() {
    document.querySelectorAll('.onf-row').forEach(function(row) {
      var carousel = row.querySelector('.onf-row__carousel');
      var leftArr = row.querySelector('.onf-row__arrow--left');
      var rightArr = row.querySelector('.onf-row__arrow--right');
      if (!carousel) return;

      var scrollAmount = carousel.offsetWidth * 0.75;

      if (leftArr) {
        leftArr.addEventListener('click', function() {
          carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
      }

      if (rightArr) {
        rightArr.addEventListener('click', function() {
          carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
      }
    });
  }

  // ---------- Progress Tracking ----------
  var PROGRESS_KEY = 'oronflix-progress';

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch(e) {
      return {};
    }
  }

  function saveProgress(projectId, percent) {
    var progress = getProgress();
    progress[projectId] = {
      percent: Math.round(percent),
      lastVisited: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  function renderProgressOnCards() {
    var progress = getProgress();
    document.querySelectorAll('.onf-card[data-project]').forEach(function(card) {
      var projectId = card.getAttribute('data-project');
      var data = progress[projectId];
      if (data && data.percent > 0 && data.percent < 100) {
        var fill = card.querySelector('.onf-card__progress-fill');
        if (fill) {
          fill.style.width = data.percent + '%';
        }
      }
    });
  }

  // Show "Continue Watching" row only if there's progress
  function initContinueWatching() {
    var progress = getProgress();
    var continueRow = document.querySelector('.onf-row--continue');
    if (!continueRow) return;

    var hasProgress = Object.keys(progress).some(function(key) {
      var p = progress[key].percent;
      return p > 5 && p < 95;
    });

    continueRow.style.display = hasProgress ? '' : 'none';
  }

  // ---------- Scroll-Triggered Animations ----------
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.onf-animate');
    if (elements.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function(el) { observer.observe(el); });
  }

  // ---------- Category Filter ----------
  function initCategoryFilter() {
    var chips = document.querySelectorAll('.onf-chip');
    if (chips.length === 0) return;

    chips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        var category = chip.getAttribute('data-category');

        // Update active chip
        chips.forEach(function(c) { c.classList.remove('onf-chip--active'); });
        chip.classList.add('onf-chip--active');

        // Filter cards
        var cards = document.querySelectorAll('.onf-card[data-categories]');
        cards.forEach(function(card) {
          if (category === 'all') {
            card.style.display = '';
          } else {
            var cats = card.getAttribute('data-categories') || '';
            card.style.display = cats.includes(category) ? '' : 'none';
          }
        });
      });
    });
  }

  // ---------- Cinematic Trailer (Auto-scroll Case Study) ----------

  var TRAILER_DATA = {
    'ai-crm': {
      title: 'MessAge',
      subtitle: 'AI CRM — Full Design Process',
      url: 'casestudy-ai-crm.html'
    },
    'woofio': {
      title: 'Woofio',
      subtitle: 'Dog Care App — Full Design Process',
      url: 'casestudy-woofio.html'
    },
    'myplanner': {
      title: 'MyPlanner',
      subtitle: 'Wedding Planner — Full Design Process',
      url: 'casestudy-myplanner.html'
    }
  };

  var trailerScrollRAF = null;
  var trailerProgressTimer = null;
  var trailerActive = false;

  function openTrailer(projectId) {
    var data = TRAILER_DATA[projectId];
    if (!data) return;

    var modal = document.getElementById('trailer-modal');
    if (!modal) return;

    trailerActive = true;
    var stage = modal.querySelector('.trailer-stage');
    stage.innerHTML = '';

    // Title card
    var titleCard = document.createElement('div');
    titleCard.className = 'trailer-title-card';
    titleCard.innerHTML = '<div class="trailer-title-card__name">' + data.title + '</div>' +
      '<div class="trailer-title-card__sub">' + data.subtitle + '</div>';
    stage.appendChild(titleCard);

    // Iframe container (the case study page)
    var iframeWrap = document.createElement('div');
    iframeWrap.className = 'trailer-iframe-wrap';
    var iframe = document.createElement('iframe');
    iframe.className = 'trailer-iframe';
    iframe.src = data.url + '?trailer=1';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframeWrap.appendChild(iframe);
    stage.appendChild(iframeWrap);

    // End card
    var endCard = document.createElement('div');
    endCard.className = 'trailer-end-card';
    endCard.innerHTML = '<div class="trailer-end-card__title">' + data.title + '</div>' +
      '<a href="' + data.url + '" class="trailer-end-card__cta">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
      'View Full Case Study</a>';
    stage.appendChild(endCard);

    // Overlays
    var overlaysHTML = '<div class="trailer-vignette"></div><div class="trailer-grain"></div>' +
      '<div class="trailer-letterbox trailer-letterbox--top"></div>' +
      '<div class="trailer-letterbox trailer-letterbox--bottom"></div>' +
      '<div class="trailer-progress"><div class="trailer-progress__fill"></div></div>';
    var temp = document.createElement('div');
    temp.innerHTML = overlaysHTML;
    while (temp.firstChild) stage.appendChild(temp.firstChild);

    // Show modal
    modal.style.display = 'flex';
    requestAnimationFrame(function() {
      modal.classList.add('trailer-modal--open');
    });
    document.body.style.overflow = 'hidden';

    // Show title, then start scrolling
    titleCard.classList.add('trailer-title-card--active');

    setTimeout(function() {
      titleCard.style.opacity = '0';
      titleCard.style.pointerEvents = 'none';
      iframeWrap.style.opacity = '1';

      // Wait for iframe to load, then auto-scroll
      iframe.onload = function() {
        if (!trailerActive) return;
        startAutoScroll(iframe, stage, endCard);
      };
    }, 2800);
  }

  function startAutoScroll(iframe, stage, endCard) {
    var iframeDoc;
    try {
      iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    } catch(e) {
      return;
    }

    // Hide the case study nav and back button inside iframe
    var style = iframeDoc.createElement('style');
    style.textContent = '.onf-nav, .cs-back, .onf-next-episode, .onf-player-bar { display: none !important; } ' +
      'html { scroll-behavior: auto !important; } ' +
      'body { overflow: hidden !important; cursor: none !important; } ' +
      '.animate-on-scroll { opacity: 1 !important; transform: none !important; }';
    iframeDoc.head.appendChild(style);

    var scrollHeight = iframeDoc.documentElement.scrollHeight;
    var viewHeight = iframe.clientHeight;
    var totalScroll = scrollHeight - viewHeight;
    if (totalScroll <= 0) return;

    // Scroll speed: ~40 seconds for full page
    var SCROLL_DURATION = 40000;
    var pixelsPerMs = totalScroll / SCROLL_DURATION;
    var startTime = performance.now();
    var progressFill = stage.querySelector('.trailer-progress__fill');

    function scrollStep(now) {
      if (!trailerActive) return;

      var elapsed = now - startTime;
      var scrollPos = elapsed * pixelsPerMs;
      var progress = Math.min(scrollPos / totalScroll, 1);

      iframeDoc.documentElement.scrollTop = scrollPos;
      if (progressFill) progressFill.style.width = (progress * 100) + '%';

      if (progress >= 1) {
        // Show end card
        setTimeout(function() {
          endCard.classList.add('trailer-end-card--active');
          var iframeWrap = stage.querySelector('.trailer-iframe-wrap');
          if (iframeWrap) iframeWrap.style.opacity = '0.3';
        }, 500);
        return;
      }

      trailerScrollRAF = requestAnimationFrame(scrollStep);
    }

    trailerScrollRAF = requestAnimationFrame(scrollStep);
  }

  function closeTrailer() {
    var modal = document.getElementById('trailer-modal');
    if (!modal) return;

    trailerActive = false;
    cancelAnimationFrame(trailerScrollRAF);
    clearInterval(trailerProgressTimer);

    modal.classList.remove('trailer-modal--open');
    setTimeout(function() {
      modal.style.display = 'none';
      var stage = modal.querySelector('.trailer-stage');
      if (stage) stage.innerHTML = '';
    }, 600);
    document.body.style.overflow = '';
  }

  // ESC key to close trailer
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeTrailer();
  });

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', function() {
    updateThemeIcon();
    initNavScroll();
    initMobileNav();
    initBillboard();
    initCarousels();
    initScrollAnimations();
    initCategoryFilter();
    renderProgressOnCards();
    initContinueWatching();
  });

  // Expose global functions
  window.oronflix = {
    toggleTheme: toggleTheme,
    saveProgress: saveProgress,
    getProgress: getProgress,
    openTrailer: openTrailer,
    closeTrailer: closeTrailer
  };

})();
