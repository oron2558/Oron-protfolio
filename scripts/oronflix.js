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

  // ---------- Cinematic Trailer ----------
  var TRAILER_DATA = {
    'ai-crm': {
      title: 'MessAge',
      subtitle: 'AI-Powered CRM Platform',
      caseStudyUrl: 'casestudy-ai-crm.html',
      slides: [
        { img: 'screen-dashboard.jpeg', label: 'Unified Dashboard', fx: 'zoom-in' },
        { img: 'screen-smartbox.jpeg', label: 'Smart Inbox — AI Responses', fx: 'slide-right' },
        { img: 'screen-leads.jpeg', label: 'Lead Pipeline Management', fx: 'tilt' },
        { img: 'screen-agent.jpeg', label: 'AI Agent Builder', fx: 'slide-left' },
        { img: 'screen-tasks.jpeg', label: 'Task & Workflow Engine', fx: 'zoom-out' }
      ]
    },
    'woofio': {
      title: 'Woofio',
      subtitle: 'All-in-One Dog Care Platform',
      caseStudyUrl: 'casestudy-woofio.html',
      slides: [
        { img: 'woofio-screens.jpeg', label: 'Health Tracking', fx: 'zoom-in', phone: true, pos: '2% top' },
        { img: 'woofio-screens.jpeg', label: 'Family Profiles', fx: 'slide-right', phone: true, pos: '25% top' },
        { img: 'woofio-screens.jpeg', label: 'Dog Walker Marketplace', fx: 'tilt', phone: true, pos: '50% top' },
        { img: 'woofio-screens.jpeg', label: 'Smart Scheduling', fx: 'slide-left', phone: true, pos: '75% top' },
        { img: 'woofio-screens.jpeg', label: 'Pet Store & Products', fx: 'zoom-out', phone: true, pos: '98% top' }
      ]
    },
    'myplanner': {
      title: 'MyPlanner',
      subtitle: 'Smart Wedding Planning Platform',
      caseStudyUrl: 'casestudy-myplanner.html',
      slides: [
        { img: 'myplanner-dashboard.jpeg', label: 'Event Dashboard', fx: 'zoom-in' },
        { img: 'myplanner-budget.jpeg', label: 'AI Budget Calculator', fx: 'slide-right' },
        { img: 'myplanner-suppliers.jpeg', label: 'Supplier Management', fx: 'tilt' },
        { img: 'myplanner-cashback.jpeg', label: 'Cashback & Payments', fx: 'zoom-out' }
      ]
    }
  };

  var trailerTimer = null;
  var trailerProgressTimer = null;
  var trailerCurrentSlide = 0;
  var trailerTotalDuration = 0;
  var trailerElapsedTime = 0;
  var TRAILER_TITLE_DURATION = 2500;
  var TRAILER_SLIDE_DURATION = 3500;
  var TRAILER_END_DURATION = 4000;

  function openTrailer(projectId) {
    var data = TRAILER_DATA[projectId];
    if (!data) return;

    var modal = document.getElementById('trailer-modal');
    if (!modal) return;

    // Calculate total duration
    trailerTotalDuration = TRAILER_TITLE_DURATION + (data.slides.length * TRAILER_SLIDE_DURATION) + TRAILER_END_DURATION;
    trailerElapsedTime = 0;
    trailerCurrentSlide = 0;

    // Build stage HTML
    var stage = modal.querySelector('.trailer-stage');
    stage.innerHTML = '';

    // Title card
    var titleCard = document.createElement('div');
    titleCard.className = 'trailer-title-card';
    titleCard.innerHTML = '<div class="trailer-title-card__name">' + data.title + '</div>' +
      '<div class="trailer-title-card__sub">' + data.subtitle + '</div>';
    stage.appendChild(titleCard);

    // Screen slides
    data.slides.forEach(function(slide, i) {
      var slideEl = document.createElement('div');
      slideEl.className = 'trailer-slide';
      slideEl.setAttribute('data-fx', slide.fx);
      slideEl.setAttribute('data-index', i);

      var screenClass = slide.phone ? 'trailer-screen trailer-screen--phone' : 'trailer-screen';
      var imgStyle = slide.pos ? ' style="object-position: ' + slide.pos + ';"' : '';

      slideEl.innerHTML = '<div class="' + screenClass + '"><img src="' + slide.img + '"' + imgStyle + ' alt="' + slide.label + '"></div>';
      stage.appendChild(slideEl);
    });

    // Feature label
    var feature = document.createElement('div');
    feature.className = 'trailer-feature';
    feature.innerHTML = '<span class="trailer-feature__text"></span>';
    stage.appendChild(feature);

    // End card
    var endCard = document.createElement('div');
    endCard.className = 'trailer-end-card';
    endCard.innerHTML = '<div class="trailer-end-card__title">' + data.title + '</div>' +
      '<a href="' + data.caseStudyUrl + '" class="trailer-end-card__cta">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
      'View Full Case Study</a>';
    stage.appendChild(endCard);

    // Overlays
    stage.innerHTML += '<div class="trailer-vignette"></div><div class="trailer-grain"></div>' +
      '<div class="trailer-letterbox trailer-letterbox--top"></div>' +
      '<div class="trailer-letterbox trailer-letterbox--bottom"></div>' +
      '<div class="trailer-progress"><div class="trailer-progress__fill"></div></div>';

    // Show modal
    modal.style.display = 'flex';
    requestAnimationFrame(function() {
      modal.classList.add('trailer-modal--open');
    });
    document.body.style.overflow = 'hidden';

    // Start sequence
    startTrailerSequence(data, stage);
  }

  function startTrailerSequence(data, stage) {
    var titleCard = stage.querySelector('.trailer-title-card');
    var slides = stage.querySelectorAll('.trailer-slide');
    var feature = stage.querySelector('.trailer-feature');
    var featureText = feature.querySelector('.trailer-feature__text');
    var endCard = stage.querySelector('.trailer-end-card');
    var progressFill = stage.querySelector('.trailer-progress__fill');

    // Start progress bar
    trailerProgressTimer = setInterval(function() {
      trailerElapsedTime += 50;
      var pct = (trailerElapsedTime / trailerTotalDuration) * 100;
      if (progressFill) progressFill.style.width = Math.min(pct, 100) + '%';
    }, 50);

    // Phase 1: Title card
    titleCard.classList.add('trailer-title-card--active');

    trailerTimer = setTimeout(function() {
      titleCard.classList.remove('trailer-title-card--active');

      // Phase 2: Cycle through slides
      showTrailerSlide(0, data, slides, feature, featureText, endCard);
    }, TRAILER_TITLE_DURATION);
  }

  function showTrailerSlide(index, data, slides, feature, featureText, endCard) {
    if (index >= data.slides.length) {
      // Phase 3: End card
      feature.classList.remove('trailer-feature--visible');
      endCard.classList.add('trailer-end-card--active');
      trailerTimer = setTimeout(function() {
        closeTrailer();
      }, TRAILER_END_DURATION);
      return;
    }

    var slideData = data.slides[index];
    var slideEl = slides[index];

    // Hide previous slide with exit
    if (index > 0) {
      var prevSlide = slides[index - 1];
      var prevScreen = prevSlide.querySelector('.trailer-screen');
      if (prevScreen) prevScreen.className = prevScreen.className.replace(/trailer-fx-\S+/g, '') + ' trailer-fx-exit';
      setTimeout(function() {
        prevSlide.classList.remove('trailer-slide--active');
      }, 500);
    }

    // Show current slide
    slideEl.classList.add('trailer-slide--active');
    var screen = slideEl.querySelector('.trailer-screen');
    if (screen) {
      screen.className = screen.className.replace(/trailer-fx-\S+/g, '');
      screen.classList.add('trailer-fx-' + slideData.fx);
    }

    // Show feature label
    featureText.textContent = slideData.label;
    feature.classList.remove('trailer-feature--visible');
    setTimeout(function() {
      feature.classList.add('trailer-feature--visible');
    }, 800);

    trailerCurrentSlide = index;
    trailerTimer = setTimeout(function() {
      showTrailerSlide(index + 1, data, slides, feature, featureText, endCard);
    }, TRAILER_SLIDE_DURATION);
  }

  function closeTrailer() {
    var modal = document.getElementById('trailer-modal');
    if (!modal) return;

    clearTimeout(trailerTimer);
    clearInterval(trailerProgressTimer);

    modal.classList.remove('trailer-modal--open');
    setTimeout(function() {
      modal.style.display = 'none';
      var stage = modal.querySelector('.trailer-stage');
      if (stage) stage.innerHTML = '';
    }, 500);
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
