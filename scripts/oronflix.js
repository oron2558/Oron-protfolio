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

  // ---------- Cinematic Trailer (Scene-based Montage) ----------

  var TRAILER_DATA = {
    'ai-crm': {
      title: 'MessAge',
      subtitle: 'AI-Powered CRM Platform',
      caseStudyUrl: 'casestudy-ai-crm.html',
      scenes: [
        {
          type: 'spread', label: 'Complete Platform Overview',
          screens: [
            { img: 'screen-dashboard.jpeg', w: 340, h: 220 },
            { img: 'screen-smartbox.jpeg', w: 280, h: 180 },
            { img: 'screen-leads.jpeg', w: 280, h: 180 },
            { img: 'screen-agent.jpeg', w: 240, h: 155 },
            { img: 'screen-tasks.jpeg', w: 240, h: 155 }
          ]
        },
        {
          type: 'zoom', label: 'Unified Dashboard — Real-Time Analytics',
          screens: [{ img: 'screen-dashboard.jpeg', w: 750, h: 480 }]
        },
        {
          type: 'orbit', label: 'AI-Powered Inbox, Leads & Automation',
          screens: [
            { img: 'screen-smartbox.jpeg', w: 320, h: 210 },
            { img: 'screen-leads.jpeg', w: 360, h: 230 },
            { img: 'screen-agent.jpeg', w: 320, h: 210 }
          ]
        },
        {
          type: 'cascade', label: 'Every Screen — Designed for Efficiency',
          screens: [
            { img: 'screen-dashboard.jpeg', w: 300, h: 195, top: '15%', left: '5%' },
            { img: 'screen-smartbox.jpeg', w: 300, h: 195, top: '25%', left: '25%' },
            { img: 'screen-agent.jpeg', w: 300, h: 195, top: '35%', left: '45%' },
            { img: 'screen-tasks.jpeg', w: 300, h: 195, top: '20%', left: '65%' }
          ]
        }
      ]
    },
    'woofio': {
      title: 'Woofio',
      subtitle: 'All-in-One Dog Care Platform',
      caseStudyUrl: 'casestudy-woofio.html',
      scenes: [
        {
          type: 'spread', label: 'Five Screens — One Complete Experience',
          screens: [
            { img: 'woofio-screens.jpeg', w: 160, h: 320, phone: true, pos: '50% top' },
            { img: 'woofio-screens.jpeg', w: 140, h: 280, phone: true, pos: '2% top' },
            { img: 'woofio-screens.jpeg', w: 140, h: 280, phone: true, pos: '98% top' },
            { img: 'woofio-screens.jpeg', w: 120, h: 240, phone: true, pos: '25% top' },
            { img: 'woofio-screens.jpeg', w: 120, h: 240, phone: true, pos: '75% top' }
          ]
        },
        {
          type: 'zoom', label: 'Health Tracking — Vet Records & Reminders',
          screens: [{ img: 'woofio-live-screens.jpeg', w: 300, h: 600, phone: true, pos: '34% top' }]
        },
        {
          type: 'orbit', label: 'Walkers, Scheduling & Pet Store',
          screens: [
            { img: 'woofio-screens.jpeg', w: 150, h: 300, phone: true, pos: '50% top' },
            { img: 'woofio-screens.jpeg', w: 170, h: 340, phone: true, pos: '75% top' },
            { img: 'woofio-screens.jpeg', w: 150, h: 300, phone: true, pos: '98% top' }
          ]
        },
        {
          type: 'cascade', label: 'From Wireframe to Production',
          screens: [
            { img: 'woofio-screens.jpeg', w: 150, h: 300, phone: true, pos: '2% top', top: '20%', left: '8%' },
            { img: 'woofio-live-screens.jpeg', w: 150, h: 300, phone: true, pos: '34% top', top: '15%', left: '28%' },
            { img: 'woofio-screens.jpeg', w: 150, h: 300, phone: true, pos: '50% top', top: '20%', left: '48%' },
            { img: 'woofio-live-screens.jpeg', w: 150, h: 300, phone: true, pos: '66% top', top: '15%', left: '68%' }
          ]
        }
      ]
    },
    'myplanner': {
      title: 'MyPlanner',
      subtitle: 'Smart Wedding Planning Platform',
      caseStudyUrl: 'casestudy-myplanner.html',
      scenes: [
        {
          type: 'spread', label: 'Complete Wedding Management Suite',
          screens: [
            { img: 'myplanner-dashboard.jpeg', w: 340, h: 220 },
            { img: 'myplanner-budget.jpeg', w: 280, h: 180 },
            { img: 'myplanner-suppliers.jpeg', w: 280, h: 180 },
            { img: 'myplanner-cashback.jpeg', w: 240, h: 155 }
          ]
        },
        {
          type: 'zoom', label: 'Event Dashboard — Budget at a Glance',
          screens: [{ img: 'myplanner-dashboard.jpeg', w: 750, h: 480 }]
        },
        {
          type: 'orbit', label: 'Budget, Suppliers & Cashback',
          screens: [
            { img: 'myplanner-budget.jpeg', w: 320, h: 210 },
            { img: 'myplanner-suppliers.jpeg', w: 360, h: 230 },
            { img: 'myplanner-cashback.jpeg', w: 320, h: 210 }
          ]
        },
        {
          type: 'cascade', label: 'Every Detail — Beautifully Organized',
          screens: [
            { img: 'myplanner-dashboard.jpeg', w: 300, h: 195, top: '15%', left: '5%' },
            { img: 'myplanner-budget.jpeg', w: 300, h: 195, top: '25%', left: '25%' },
            { img: 'myplanner-suppliers.jpeg', w: 300, h: 195, top: '35%', left: '45%' },
            { img: 'myplanner-cashback.jpeg', w: 300, h: 195, top: '20%', left: '65%' }
          ]
        }
      ]
    }
  };

  var trailerTimers = [];
  var trailerProgressTimer = null;
  var trailerElapsedTime = 0;
  var TITLE_DUR = 2800;
  var SCENE_DUR = 4000;
  var END_DUR = 4500;

  function clearTrailerTimers() {
    trailerTimers.forEach(function(t) { clearTimeout(t); });
    trailerTimers = [];
    clearInterval(trailerProgressTimer);
  }

  function openTrailer(projectId) {
    var data = TRAILER_DATA[projectId];
    if (!data) return;

    var modal = document.getElementById('trailer-modal');
    if (!modal) return;

    var totalDur = TITLE_DUR + (data.scenes.length * SCENE_DUR) + END_DUR;
    trailerElapsedTime = 0;

    var stage = modal.querySelector('.trailer-stage');
    stage.innerHTML = '';

    // Title card
    var titleCard = document.createElement('div');
    titleCard.className = 'trailer-title-card';
    titleCard.innerHTML = '<div class="trailer-title-card__name">' + data.title + '</div>' +
      '<div class="trailer-title-card__sub">' + data.subtitle + '</div>';
    stage.appendChild(titleCard);

    // Build scenes
    data.scenes.forEach(function(scene, si) {
      var sceneEl = document.createElement('div');
      sceneEl.className = 'trailer-scene trailer-scene--' + scene.type;
      sceneEl.setAttribute('data-index', si);

      scene.screens.forEach(function(scr) {
        var screenEl = document.createElement('div');
        var cls = 'trailer-screen' + (scr.phone ? ' trailer-screen--phone' : '');
        screenEl.className = cls;
        screenEl.style.width = scr.w + 'px';
        screenEl.style.height = scr.h + 'px';
        if (scr.top) screenEl.style.top = scr.top;
        if (scr.left) screenEl.style.left = scr.left;

        var img = document.createElement('img');
        img.src = scr.img;
        img.alt = scene.label;
        if (scr.pos) img.style.objectPosition = scr.pos;
        screenEl.appendChild(img);
        sceneEl.appendChild(screenEl);
      });

      stage.appendChild(sceneEl);
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
    var overlays = document.createElement('div');
    overlays.innerHTML = '<div class="trailer-vignette"></div><div class="trailer-grain"></div>' +
      '<div class="trailer-letterbox trailer-letterbox--top"></div>' +
      '<div class="trailer-letterbox trailer-letterbox--bottom"></div>' +
      '<div class="trailer-progress"><div class="trailer-progress__fill"></div></div>';
    while (overlays.firstChild) stage.appendChild(overlays.firstChild);

    // Show modal
    modal.style.display = 'flex';
    requestAnimationFrame(function() {
      modal.classList.add('trailer-modal--open');
    });
    document.body.style.overflow = 'hidden';

    // Start progress bar
    var progressFill = stage.querySelector('.trailer-progress__fill');
    trailerProgressTimer = setInterval(function() {
      trailerElapsedTime += 50;
      var pct = (trailerElapsedTime / totalDur) * 100;
      if (progressFill) progressFill.style.width = Math.min(pct, 100) + '%';
    }, 50);

    // Run sequence
    var scenes = stage.querySelectorAll('.trailer-scene');
    var featureEl = stage.querySelector('.trailer-feature');
    var featureText = featureEl.querySelector('.trailer-feature__text');

    // Phase 1: Title
    titleCard.classList.add('trailer-title-card--active');

    trailerTimers.push(setTimeout(function() {
      titleCard.style.display = 'none';
      runScene(0, data.scenes, scenes, featureEl, featureText, endCard);
    }, TITLE_DUR));
  }

  function runScene(index, scenesData, sceneEls, featureEl, featureText, endCard) {
    if (index >= scenesData.length) {
      featureEl.classList.remove('trailer-feature--visible');
      featureEl.className = 'trailer-feature';
      endCard.classList.add('trailer-end-card--active');
      trailerTimers.push(setTimeout(closeTrailer, END_DUR));
      return;
    }

    // Exit previous scene
    if (index > 0) {
      sceneEls[index - 1].classList.add('trailer-scene--exit');
      sceneEls[index - 1].classList.remove('trailer-scene--active');
    }

    // Activate current scene
    var sceneEl = sceneEls[index];
    setTimeout(function() {
      sceneEl.classList.add('trailer-scene--active');
    }, index > 0 ? 400 : 0);

    // Feature label
    featureText.textContent = scenesData[index].label;
    featureEl.className = 'trailer-feature';
    trailerTimers.push(setTimeout(function() {
      featureEl.classList.add('trailer-feature--visible');
    }, 600));

    // Next scene
    trailerTimers.push(setTimeout(function() {
      runScene(index + 1, scenesData, sceneEls, featureEl, featureText, endCard);
    }, SCENE_DUR));
  }

  function closeTrailer() {
    var modal = document.getElementById('trailer-modal');
    if (!modal) return;

    clearTrailerTimers();

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
