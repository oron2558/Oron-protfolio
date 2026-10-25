/* Braind consent notice v1 (2026-10-25). One small notice for every site we build.
   - Essential storage only by default. External embeds (maps, video players) carry
     data-consent-src instead of src and load only after the visitor allows them,
     or one at a time from their own "show" button.
   - Choice is kept in localStorage; any [data-consent-open] reopens the notice.
   - Text follows <html lang>: Hebrew by default, English for lang="en". */
(function () {
  var KEY = "bd-consent-v1";
  var doc = document.documentElement;
  var en = (doc.lang || "").toLowerCase().indexOf("en") === 0;
  var privacyUrl = doc.getAttribute("data-privacy-url") || "/privacy.html";
  var T = en
    ? {
        label: "Cookies and privacy",
        ext: "This site keeps only what it needs to work. External content, like maps or video players, loads only if you allow it, and those services may then set their own cookies.",
        plain: "This site uses no advertising or tracking cookies. It keeps only what it needs to work.",
        all: "Allow external content",
        min: "Essential only",
        ok: "Got it",
        more: "Privacy policy",
        show: "Show content (loads from {host})"
      }
    : {
        label: "עוגיות ופרטיות",
        ext: "האתר שומר רק מידע שחיוני לפעולתו. תוכן חיצוני, כמו מפות או נגן וידאו, נטען רק אם תאשרו, ואז השירות החיצוני עשוי לשמור עוגיות משלו.",
        plain: "האתר לא משתמש בעוגיות פרסום או מעקב. נשמר רק מידע שחיוני לפעולתו.",
        all: "לאשר תוכן חיצוני",
        min: "רק חיוני",
        ok: "הבנתי",
        more: "מדיניות פרטיות",
        show: "להצגת התוכן (נטען מ-{host})"
      };

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function save(external) {
    try { localStorage.setItem(KEY, JSON.stringify({ external: !!external, at: new Date().toISOString() })); } catch (e) {}
  }

  function embeds() { return Array.prototype.slice.call(document.querySelectorAll("[data-consent-src]")); }
  function hostOf(url) { try { return new URL(url, location.href).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }

  function load(el) {
    if (el.getAttribute("src")) return;
    el.setAttribute("src", el.getAttribute("data-consent-src"));
    var ph = el.previousElementSibling;
    if (ph && ph.classList.contains("bd-embed-ph")) ph.remove();
  }
  function placeholder(el) {
    if (el.getAttribute("src")) return;
    var prev = el.previousElementSibling;
    if (prev && prev.classList.contains("bd-embed-ph")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "bd-embed-ph";
    b.textContent = T.show.replace("{host}", hostOf(el.getAttribute("data-consent-src")));
    b.addEventListener("click", function () { load(el); el.focus && el.focus(); });
    el.parentNode.insertBefore(b, el);
  }
  function apply(external) { embeds().forEach(external ? load : placeholder); }

  var bar = null;
  function close() {
    if (!bar) return;
    bar.remove();
    bar = null;
  }
  function open() {
    if (bar) return;
    var hasExt = embeds().length > 0;
    bar = document.createElement("section");
    bar.className = "bd-consent";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", T.label);
    var p = document.createElement("p");
    p.textContent = (hasExt ? T.ext : T.plain) + " ";
    var a = document.createElement("a");
    a.href = privacyUrl;
    a.textContent = T.more;
    p.appendChild(a);
    var row = document.createElement("div");
    row.className = "bd-consent__btns";
    function btn(label, primary, external) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "bd-consent__btn" + (primary ? " is-primary" : "");
      b.textContent = label;
      b.addEventListener("click", function () { save(external); apply(external); close(); });
      row.appendChild(b);
      return b;
    }
    if (hasExt) { btn(T.all, true, true); btn(T.min, false, false); }
    else btn(T.ok, true, false);
    bar.appendChild(p);
    bar.appendChild(row);
    // React sites: mount inside a host the framework never re-renders.
    (document.querySelector("[data-consent-host]") || document.body).appendChild(bar);
  }

  function init() {
    var c = read();
    apply(!!(c && c.external));
    if (!c) open();
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-consent-open]");
      if (!t) return;
      e.preventDefault();
      open();
      var first = bar && bar.querySelector("button");
      if (first) first.focus();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
