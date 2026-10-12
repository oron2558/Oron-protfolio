/* Dana Kadosh · v2 motion.
   Focal moment: the story is told as a manicure. One big almond nail gets its base, an uneven first coat,
   layers of practice, full colour and a final gloss that reveals Dana, pinned while the five beats scroll past.
   Everything else explains (five nails = five meetings, kit contents accumulating, method steps) or softens
   (the page colour drifts between sections instead of dividers). */
(function () {
  var d = document;
  var html = d.documentElement;
  html.classList.add("js");

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var desk = matchMedia("(min-width: 821px)").matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var WA = "https://wa.me/972526054206?text=";
  var li0Anim = typeof Element.prototype.animate === "function";
  var play = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };

  function init() {
    var yr = $("[data-year]");
    if (yr) yr.textContent = String(new Date().getFullYear());

    /* hero film: poster first, film after load, pause toggle, off-screen pause */
    var hero = $(".hero");
    var v = $("[data-hero-video]");
    var tg = $("[data-video-toggle]");
    var userPaused = false;
    if (v) {
      v.muted = true;
      var setPaused = function (p) {
        if (p) v.pause(); else play(v);
        tg.classList.toggle("is-paused", p);
        tg.setAttribute("aria-label", p ? "הפעלת הווידאו" : "עצירת הווידאו");
      };
      var loadFilm = function () {
        if (v.dataset.loaded) return;
        v.dataset.loaded = "1";
        v.src = v.getAttribute("data-src");
        v.load();
      };
      if (reduce) { userPaused = true; setPaused(true); }
      else {
        var go = function () { loadFilm(); setPaused(false); };
        if (d.readyState === "complete") setTimeout(go, 300); else addEventListener("load", function () { setTimeout(go, 300); });
      }
      tg.addEventListener("click", function () { loadFilm(); userPaused = !v.paused; setPaused(userPaused); });
      new IntersectionObserver(function (en) {
        if (userPaused || !v.dataset.loaded) return;
        if (en[0].isIntersecting) setPaused(false); else v.pause();
      }).observe(hero);
    }

    /* nav glass + phone dock */
    var nav = $("[data-nav]");
    var dock = $("[data-dock]");
    var footCta = $(".foot__cta");
    var pastHero = false, footIn = false;
    var syncDock = function () { if (dock) dock.classList.toggle("is-on", pastHero && !footIn); };
    new IntersectionObserver(function (en) { pastHero = !en[0].isIntersecting; syncDock(); }, { rootMargin: "-40% 0px 0px 0px" }).observe(hero);
    if (footCta) new IntersectionObserver(function (en) { footIn = en[0].isIntersecting; syncDock(); }).observe(footCta);
    var sen = d.createElement("div");
    sen.style.cssText = "position:absolute;top:0;height:30px;width:1px;pointer-events:none";
    sen.setAttribute("aria-hidden", "true");
    hero.appendChild(sen);
    new IntersectionObserver(function (en) { nav.classList.toggle("is-solid", !en[0].isIntersecting); }).observe(sen);

    /* radio-style switches (kit + advanced track) */
    function radios(group, onPick) {
      var btns = $$("button[role=radio]", group);
      var pick = function (i, focus) {
        btns.forEach(function (b, j) {
          b.setAttribute("aria-checked", i === j ? "true" : "false");
          b.tabIndex = i === j ? 0 : -1;
          if (i === j && focus) b.focus();
        });
        group.style.setProperty("--i", i);
        onPick(i);
      };
      btns.forEach(function (b, i) {
        b.addEventListener("click", function () { pick(i); });
        b.addEventListener("keydown", function (e) {
          var k = e.key;
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(k) < 0) return;
          e.preventDefault();
          // RTL: left arrow moves forward
          var step = (k === "ArrowLeft" || k === "ArrowDown") ? 1 : -1;
          pick((i + step + btns.length) % btns.length, true);
        });
      });
      btns.forEach(function (b, j) { b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1; });
      return pick;
    }

    var seg = $("[data-seg]");
    var waAdv = $("[data-wa-adv]");
    var advMsg = [
      "היי דנה, אשמח לשריין מקום בהשתלמות מניקור ג׳ל למקצועיות (יום אחד)",
      "היי דנה, אשמח לשריין מקום בהשתלמות מניקור ג׳ל למקצועיות (מסלול מורחב, 2 מפגשים)"
    ];
    if (seg) radios(seg, function (i) {
      $$("[data-seg-panel]").forEach(function (p, j) { p.hidden = j !== i; });
      if (waAdv) waAdv.href = WA + encodeURIComponent(advMsg[i]);
    });

    var kit = $("[data-kit]");
    if (kit) {
      var items = $$("[data-kit-items] li", kit);
      var note = $("[data-kit-note]", kit);
      var notes = [
        "ערכה בסיסית: כל מה שצריך כדי להתחיל לתרגל.",
        "ערכה מורחבת: כל מה שבבסיסית, ועוד מכונה, מנורה וגוונים.",
        "ערכת פרימיום: כל מה שבמורחבת, ועוד ציוד עיקור מקצועי."
      ];
      var shown = 0, first = true;
      radios($(".kit__tabs", kit), function (lvl) {
        var added = [];
        items.forEach(function (li) {
          var l = +li.getAttribute("data-lvl");
          var vis = l <= lvl;
          if (vis && li.hidden) added.push(li);
          li.hidden = !vis;
          li.classList.toggle("is-new", lvl > 0 && l === lvl);
        });
        note.textContent = notes[lvl];
        if (!first && !reduce && added.length && li0Anim) added.forEach(function (li, k) {
          li.animate([{ opacity: 0, transform: "translateY(12px) scale(0.9)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: k * 60, easing: "cubic-bezier(0.23,1,0.32,1)", fill: "backwards" });
        });
        first = false; shown = lvl;
      })(0);
    }

    /* map: loads as it approaches */
    var slot = $("[data-map-slot]");
    if (slot) new IntersectionObserver(function (en, io) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var f = d.createElement("iframe");
      f.src = "https://www.google.com/maps?q=" + encodeURIComponent("ניצנה 4, חדרה") + "&hl=he&z=16&output=embed";
      f.title = "מפה: רחוב ניצנה 4, חדרה";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.addEventListener("load", function () { $("[data-map]").classList.add("is-live"); });
      slot.appendChild(f);
    }, { rootMargin: "500px 0px" }).observe(slot);

    /* accessibility statement */
    var dlg = $("[data-a11y]");
    var opener = $("[data-a11y-open]");
    if (dlg && opener) {
      opener.addEventListener("click", function () { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); });
      $("[data-a11y-close]").addEventListener("click", function () { dlg.close(); });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    }

    /* small films play only while visible */
    var loopIO = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var vid = e.target;
        if (e.isIntersecting && !reduce) { vid.preload = "auto"; play(vid); } else vid.pause();
      });
    }, { threshold: 0.3 });
    $$("[data-inview-play]").forEach(function (el) { loopIO.observe(el); });

    /* FAQ: smooth open/close, one open at a time */
    var qas = $$(".qa");
    var animH = function (el, from, to, done) {
      if (reduce || !li0Anim) { done(); return; }
      var a = el.animate([{ height: from + "px" }, { height: to + "px" }], { duration: 380, easing: "cubic-bezier(0.23,1,0.32,1)" });
      a.onfinish = function () { el.style.height = ""; done(); };
    };
    var closeQa = function (q) {
      var s = $("summary", q);
      q.style.overflow = "hidden";
      animH(q, q.offsetHeight, s.offsetHeight, function () { q.open = false; q.style.overflow = ""; });
    };
    qas.forEach(function (q) {
      q.removeAttribute("name");
      $("summary", q).addEventListener("click", function (e) {
        e.preventDefault();
        if (q.open) { closeQa(q); return; }
        qas.forEach(function (o) { if (o !== q && o.open) closeQa(o); });
        var h0 = q.offsetHeight;
        q.open = true;
        q.style.overflow = "hidden";
        animH(q, h0, q.scrollHeight, function () { q.style.overflow = ""; });
      });
    });

    /* testimonials: one at a time, painted in with a brush stroke */
    var wsec = $("[data-words]");
    if (wsec) {
      var quotes = $$(".quote", wsec);
      var ticks = $$(".words__ticks li", wsec);
      var rate = $$("[data-rate] svg", wsec);
      var brush = $("[data-brush]", wsec);
      var cur = 0, inView = false, hold = false, tickAnim = null;
      var tips = $$(".tip", wsec), fanRot = $(".fan__rot", wsec);
      var sw = [["#d9c3bb", "#f6ebe6"], ["#d79d93", "#f4d6cf"], ["#c63a31", "#f3c9c3"]];
      var paint = function (n) {
        tips.forEach(function (t, i) { t.classList.toggle("is-on", i === n); });
        if (fanRot) fanRot.style.setProperty("--fr", (1 - n) * 30 + "deg");
        wsec.style.setProperty("--swatch", sw[n][0]);
        wsec.style.setProperty("--swatch-l", sw[n][1]);
      };
      paint(0);
      var DUR = 7500;
      var show = function (n, manual) {
        n = (n + quotes.length) % quotes.length;
        var swap = function () {
          quotes.forEach(function (q, i) { q.classList.toggle("is-on", i === n); });
          paint(n);
          ticks.forEach(function (t, i) { t.classList.toggle("is-done", i < n); t.classList.toggle("is-on", i === n); });
          cur = n;
          if (!reduce && li0Anim) rate.forEach(function (s, i) {
            s.animate([{ transform: "scale(0.2) rotate(-20deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 480, delay: 120 + i * 70, easing: "cubic-bezier(0.34,1.56,0.64,1)", fill: "backwards" });
          });
          runTick();
        };
        if (reduce || !li0Anim || !brush) { swap(); return; }
        brush.animate([
          { opacity: 0.95, transform: "scaleX(0)", transformOrigin: "right" },
          { opacity: 0.95, transform: "scaleX(1)", transformOrigin: "right", offset: 0.48 },
          { opacity: 0.95, transform: "scaleX(1)", transformOrigin: "left", offset: 0.52 },
          { opacity: 0.95, transform: "scaleX(0)", transformOrigin: "left" }
        ], { duration: 900, easing: "cubic-bezier(0.77,0,0.175,1)" });
        setTimeout(swap, 440);
      };
      var runTick = function () {
        if (tickAnim) tickAnim.cancel();
        var t = ticks[cur] && $("span", ticks[cur]);
        if (!t || reduce || !li0Anim) return;
        tickAnim = t.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: DUR, easing: "linear", fill: "forwards" });
        tickAnim.onfinish = function () { show(cur + 1); };
        sync();
      };
      var sync = function () { if (!tickAnim) return; if (inView && !hold) tickAnim.play(); else tickAnim.pause(); };
      $("[data-q-next]", wsec).addEventListener("click", function () { show(cur + 1, true); });
      $("[data-q-prev]", wsec).addEventListener("click", function () { show(cur - 1, true); });
      var stage = $(".words__stage", wsec);
      stage.addEventListener("pointerenter", function () { hold = true; sync(); });
      stage.addEventListener("pointerleave", function () { hold = false; sync(); });
      stage.addEventListener("focusin", function () { hold = true; sync(); });
      stage.addEventListener("focusout", function () { hold = false; sync(); });
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; sync(); }, { threshold: 0.4 }).observe(stage);
      runTick();
    }

    /* gallery arrows (when it is not a scroll-driven pan) */
    var vp = $("[data-table-viewport]");
    if (vp) {
      var by = function (dir) { var card = $(".post", vp); var w = card ? card.offsetWidth + 24 : 300; vp.scrollBy({ left: dir * -w, behavior: reduce ? "auto" : "smooth" }); };
      $("[data-table-next]").addEventListener("click", function () { by(1); });
      $("[data-table-prev]").addEventListener("click", function () { by(-1); });
    }

    motion();
  }

  function motion() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || reduce) return;
    gsap.registerPlugin(ST);

    /* smooth scroll */
    var lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (id.length < 2) return;
          var t = $(id);
          if (!t) return;
          e.preventDefault();
          lenis.scrollTo(id === "#top" ? 0 : t, { offset: -70, duration: 1.3 });
          if (id !== "#top") t.setAttribute("tabindex", "-1"), t.focus({ preventScroll: true });
        });
      });
    }

    /* page colour drifts between sections (no dividers) */
    var tones = { milk: "#fbf6f3", blush: "#f7e9e5", petal: "#f3e0da", nude: "#eed8cf" };
    var setTone = function (t) { if (tones[t]) gsap.to(html, { "--bg": tones[t], duration: 1.1, ease: "power2.out", overwrite: "auto" }); };
    $$("main [data-tone]").forEach(function (sec) {
      ST.create({ trigger: sec, start: "top 55%", end: "bottom 55%", onToggle: function (s) { if (s.isActive) setTone(sec.getAttribute("data-tone")); } });
    });
    gsap.to(".ambient__a", { yPercent: 60, xPercent: -20, ease: "none", scrollTrigger: { trigger: "main", start: "top top", end: "bottom bottom", scrub: 1.5 } });
    gsap.to(".ambient__b", { yPercent: -70, xPercent: 25, ease: "none", scrollTrigger: { trigger: "main", start: "top top", end: "bottom bottom", scrub: 1.5 } });

    /* hero: the nail sets like a gel coat, the name is written from right to left */
    var name = $("[data-hero-name]");
    var intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    intro
      .from(".hero__nail", { scale: 0.86, y: 40, opacity: 0, duration: 1.5 }, 0)
      .from(".hero__blob", { scale: 0.6, opacity: 0, duration: 1.8 }, 0)
      .from(".hero__mini--a", { scale: 0.4, rotate: 40, opacity: 0, duration: 1.3 }, 0.35)
      .from(".hero__mini--b", { scale: 0.4, rotate: -40, opacity: 0, duration: 1.3 }, 0.5)
      .fromTo(name, { clipPath: "inset(-10% 0% -20% 100%)" }, { clipPath: "inset(-10% 0% -20% 0%)", duration: 1.4, ease: "power2.inOut" }, 0.1)
      .from("[data-hero-fade]", { y: 18, opacity: 0, duration: 1, stagger: 0.08 }, 0.6);

    if (fine) {
      var layers = $$("[data-hero-stage] [data-depth]").map(function (el) {
        var k = parseFloat(el.getAttribute("data-depth"));
        return { k: k, x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }) };
      });
      $(".hero").addEventListener("pointermove", function (e) {
        var nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        layers.forEach(function (l) { l.x(nx * 18 * l.k); l.y(ny * 14 * l.k); });
      });
      /* magnetic CTAs */
      $$("[data-magnet]").forEach(function (b) {
        var qx = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3.out" }), qy = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3.out" });
        b.addEventListener("pointermove", function (e) { var r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.18); qy((e.clientY - r.top - r.height / 2) * 0.3); });
        b.addEventListener("pointerleave", function () { qx(0); qy(0); });
      });
      /* path chooser: a nail peeks under the cursor */
      var peek = $("[data-path-peek]");
      if (peek) {
        var px = gsap.quickTo(peek, "x", { duration: 0.6, ease: "power3.out" }), py = gsap.quickTo(peek, "y", { duration: 0.6, ease: "power3.out" });
        var pimg = $("img", peek);
        gsap.set(peek, { xPercent: -50, yPercent: -50 });
        $$(".path").forEach(function (p) {
          p.addEventListener("pointerenter", function () { pimg.src = p.getAttribute("data-path-img"); gsap.to(peek, { opacity: 1, scale: 1, rotate: -8, duration: 0.45, ease: "back.out(1.6)" }); });
          p.addEventListener("pointerleave", function () { gsap.to(peek, { opacity: 0, scale: 0.6, rotate: 0, duration: 0.3 }); });
          p.addEventListener("pointermove", function (e) { px(e.clientX + 40); py(e.clientY); });
        });
      }
    }
    /* hero depth on scroll */
    gsap.to(".hero__nail", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__mini--a", { yPercent: -80, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__mini--b", { yPercent: -40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__copy", { y: -60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* story: a manicure in five beats */
    var story = $("[data-story]");
    if (story) {
      story.classList.add("is-live");
      var beats = $$(".beat", story), dots = $$("[data-story-dots] li", story), cap = $("[data-story-cap]", story);
      var caps = ["שכבה ראשונה: הבסיס.", "מריחה לא אחידה. עוד לא שם.", "שכבה על שכבה.", "צבע מלא. ציפורן שלמה.", "ברק אחרון. וזאת אני."];
      var at = -1;
      var setBeat = function (n) {
        if (n === at) return;
        at = n;
        beats.forEach(function (b, i) { b.classList.toggle("is-on", i === n); });
        dots.forEach(function (b, i) { b.classList.toggle("is-on", i <= n); });
        cap.textContent = caps[n];
      };
      var q = function (s) { return story.querySelector(s); };
      gsap.set(q(".bn-line"), { strokeDashoffset: 1 });
      gsap.set(q(".bn-natural"), { opacity: 0 });
      gsap.set([q(".bn-layer--1"), q(".bn-layer--2")], { y: 340 });
      gsap.set(q(".bn-layers"), { opacity: 1 });
      gsap.set(q(".bn-sparks").children, { scale: 0 });
      var tl = gsap.timeline({ defaults: { ease: "none" } });
      tl.to(q(".bn-line"), { strokeDashoffset: 0, duration: 0.6 }, 0)
        .to(q(".bn-natural"), { opacity: 1, duration: 0.4 }, 0.3)
        .fromTo(q(".bn-streaks"), { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.7 }, 1)
        .to(q(".bn-streaks"), { opacity: 0, duration: 0.4 }, 2.1)
        .to(q(".bn-layer--1"), { y: 0, duration: 0.7 }, 2)
        .to(q(".bn-layer--2"), { y: 10, duration: 0.7 }, 2.2)
        .to(q(".bn-color"), { opacity: 1, duration: 0.6 }, 3)
        .to(q(".bn-layers"), { opacity: 0, duration: 0.3 }, 3.5)
        .to(q(".bn-photo"), { opacity: 1, duration: 0.6 }, 4)
        .fromTo(q(".bn-gloss"), { x: 0 }, { x: 380, duration: 0.7 }, 4.05)
        .to(q(".bn-sparks").children, { scale: 1, duration: 0.3, stagger: 0.12, ease: "back.out(3)" }, 4.3)
        .to({}, { duration: 0.4 }, 4.8);
      ST.create({
        trigger: story, start: "top top", end: function () { return "+=" + Math.round(innerHeight * (desk ? 3.4 : 3)); },
        pin: q("[data-story-pin]"), scrub: 0.6, animation: tl, anticipatePin: 1,
        onUpdate: function (s) { setBeat(Math.min(4, Math.floor(s.progress * 5.2))); }
      });
      setBeat(0);
    }

    /* credo: words ink in as you read */
    var credo = $("[data-scrub-words]");
    if (credo) {
      var words = credo.textContent.trim().split(/\s+/);
      credo.innerHTML = '<span class="sr">' + words.join(" ") + "</span>" + words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
      gsap.fromTo($$(".w", credo), { color: "#e9c3bb" }, { color: "#3d2a22", stagger: 0.1, ease: "none", scrollTrigger: { trigger: credo, start: "top 80%", end: "bottom 45%", scrub: true } });
    }

    /* method: pinned on desktop, three words take turns */
    var method = $("[data-method]");
    if (method && desk) {
      var steps = $$(".mstep", method), media = $$(".method__m", method), frame = $("[data-method-frame]", method);
      var setStep = function (n) {
        steps.forEach(function (s, i) { s.classList.toggle("is-on", i === n); });
        media.forEach(function (m, i) {
          var on = i === n;
          m.classList.toggle("is-on", on);
          if (m.tagName === "VIDEO") { if (on) { m.preload = "auto"; play(m); } else m.pause(); }
        });
      };
      var cur = -1;
      ST.create({
        trigger: method, start: "top top", end: function () { return "+=" + Math.round(innerHeight * 1.8); },
        pin: $("[data-method-pin]", method), scrub: true, anticipatePin: 1,
        onUpdate: function (s) {
          var n = Math.min(2, Math.floor(s.progress * 3));
          if (n !== cur) { cur = n; setStep(n); }
          gsap.set(".method__orbit", { rotate: s.progress * 120 });
          gsap.set(frame, { rotate: -4 + s.progress * 8 });
        }
      });
      setStep(0);
    }

    /* beginners: five nails, five meetings, painted one by one */
    var hand = $("[data-hand]");
    if (hand) gsap.fromTo($$(".hand__fill", hand), { scaleY: 0 }, { scaleY: 1, stagger: { each: 0.25, from: "end" }, ease: "power1.inOut", scrollTrigger: { trigger: hand, start: "top 78%", end: "bottom 50%", scrub: 0.8 } });

    /* chips float in */
    $$("[data-chips]").forEach(function (g) {
      var lis = $$("li", g);
      gsap.from(lis, { y: 18, opacity: 0, scale: 0.9, duration: 0.6, ease: "back.out(1.6)", stagger: 0.035, scrollTrigger: { trigger: g, start: "top 85%", once: true } });
    });
    $$(".get__list li").forEach(function (li, i) { gsap.from(li, { x: 30, opacity: 0, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: li, start: "top 90%", once: true } }); });

    /* arch frames rise in, image drifts inside */
    $$("[data-reveal-arch]").forEach(function (el) {
      gsap.from(el, { y: 70, scale: 0.94, opacity: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      var img = $("[data-inner-parallax]", el);
      if (img) gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* from my table: a horizontal pan on desktop */
    var tsec = $("[data-table]");
    if (tsec && desk) {
      var track = $("[data-table-track]", tsec);
      tsec.classList.add("is-pan");
      var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
      gsap.to(track, {
        x: function () { return dist(); }, ease: "none",
        scrollTrigger: { trigger: tsec, start: "top top", end: function () { return "+=" + dist(); }, pin: $("[data-table-pin]", tsec), scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      $$(".post__m", tsec).forEach(function (m, i) { gsap.from(m, { y: i % 2 ? 50 : -30, rotate: i % 2 ? 3 : -3, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: tsec, start: "top 70%", once: true } }); });
    }

    /* visit: dotted route drifts toward the clinic until the map arrives */
    var route = $("[data-route]");
    if (route) gsap.fromTo(route, { strokeDashoffset: 0.6 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".visit", start: "top bottom", end: "center center", scrub: true } });
    gsap.from(".visit__city", { yPercent: 30, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".visit", start: "top 75%", once: true } });

    /* footer: the call to action writes itself in */
    gsap.fromTo(".foot__title", { clipPath: "inset(-10% 0% -20% 100%)" }, { clipPath: "inset(-10% 0% -20% 0%)", duration: 1.4, ease: "power2.inOut", scrollTrigger: { trigger: ".foot", start: "top 60%", once: true } });

    addEventListener("load", function () { ST.refresh(); });
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();
})();
