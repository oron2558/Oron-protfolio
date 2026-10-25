  /* ---------- pains: five moments on a horizontal reel; the visitors who leaked out come back as the line under the answer ---------- */
  var pains = $("[data-pains]");
  if (pains && !reduced) {
    var pns = $$("[data-pn]", pains);
    var turn = $("[data-pains-turn]", pains);
    var tDots = $$("[data-turn-dots] .vd", pains);
    var tU = $("[data-turn-u]", pains);
    var tLine = tU ? $("path", tU) : null;
    /* where the leaked visitors ended up, as fractions of the turn panel (left side, away from the copy) */
    var SCAT = [[0.05, 0.8], [0.11, 0.2], [0.19, 0.9], [0.03, 0.48], [0.27, 0.1], [0.15, 0.6], [0.33, 0.86], [0.08, 0.34], [0.23, 0.44]];
    var from = function (k, axis) { return SCAT[k % SCAT.length][axis] * (axis ? turn.clientHeight : turn.clientWidth); };
    var onLine = function (k, axis) {
      var lay = tDots[0].parentNode.getBoundingClientRect(), r = tU.getBoundingClientRect();
      var f = (k + 0.5) / tDots.length; /* right to left, in reading order */
      return axis ? r.bottom - lay.top - r.height * 0.06 - 6 + Math.sin(f * 7) * 3 : r.right - f * r.width - lay.left - 6;
    };
    pains.classList.add("is-anim");
    var intro = pns[0];

    if (hasG && !mobile && turn && tU) {
      pains.classList.add("is-h");
      var track = $("[data-pains-track]", pains);
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var SPEED = 0.62, HOLD = 1.5;
      var trackDur = dist() * SPEED, holdDur = window.innerHeight * HOLD;
      var vis = function (el) {
        var r = el.getBoundingClientRect(), w = window.innerWidth;
        return { f: Math.max(0, Math.min(r.right, w) - Math.max(r.left, 0)) / r.width, ahead: r.right <= 0 };
      };
      var sync = function () {
        pns.forEach(function (p) {
          if (p === turn) return;
          var v = vis(p);
          if (v.f >= 0.58) p.classList.add("is-play");
          else if (v.ahead) p.classList.remove("is-play");
        });
      };
      G.set(tLine, { strokeDashoffset: 1 });
      G.set(tDots, { x: function (k) { return from(k, 0); }, y: function (k) { return from(k, 1); }, autoAlpha: 0 });
      var ptl = G.timeline({
        scrollTrigger: {
          trigger: $("[data-pains-pin]", pains), start: "top top",
          end: function () { return "+=" + Math.round(dist() * SPEED + window.innerHeight * HOLD); },
          pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: sync, onRefresh: sync
        }
      });
      ptl.to(track, { x: function () { return dist(); }, ease: "none", duration: trackDur });
      ptl.to(tDots, { autoAlpha: 1, duration: holdDur * 0.1, stagger: holdDur * 0.015 }, ">-" + holdDur * 0.02);
      ptl.to(tDots, {
        x: function (k) { return onLine(k, 0); }, y: function (k) { return onLine(k, 1); },
        ease: "power2.inOut", duration: holdDur * 0.4, stagger: holdDur * 0.02
      }, "<+=" + holdDur * 0.06);
      ptl.to(tLine, { strokeDashoffset: 0, ease: "power1.inOut", duration: holdDur * 0.24 }, ">-" + holdDur * 0.1);
      ptl.to(tDots, { autoAlpha: 0, scale: 0.4, duration: holdDur * 0.08, stagger: holdDur * 0.008 }, "<+=" + holdDur * 0.08);
      ptl.to({}, { duration: holdDur * 0.12 });
    }

    /* intro (and every card on phones) plays when it comes into view */
    if ("IntersectionObserver" in window) {
      var playIO = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          var p = e.target;
          p.classList.add("is-play");
          playIO.unobserve(p);
          if (p === turn && G && tU) {
            G.fromTo(tDots, { x: function (k) { return from(k, 0); }, y: function (k) { return from(k, 1); }, autoAlpha: 0 }, {
              keyframes: [{ autoAlpha: 1, duration: 0.3 }, { x: function (k) { return onLine(k, 0); }, y: function (k) { return onLine(k, 1); }, duration: 0.8, ease: "power2.inOut" }, { autoAlpha: 0, scale: 0.4, duration: 0.3, delay: 0.5 }],
              stagger: 0.04
            });
          }
        });
      }, { threshold: 0.3 });
      (pains.classList.contains("is-h") ? [intro] : pns).forEach(function (p) { playIO.observe(p); });
    } else pns.forEach(function (p) { p.classList.add("is-play"); });
  }

