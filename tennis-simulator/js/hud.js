export class HUD {
  constructor() {
    // Cache DOM references once
    this._els = {
      speed:      document.getElementById('speed-val'),
      quality:    document.getElementById('quality-val'),
      accuracy:   document.getElementById('accuracy-val'),
      hits:       document.getElementById('hits-val'),
      misses:     document.getElementById('misses-val'),
      timer:      document.getElementById('timer-val'),
      feedback:   document.getElementById('hit-feedback'),
      strikeRing: document.getElementById('strike-zone-ring'),
    };

    this._feedbackTimeout = null;
  }

  /**
   * Update stat readouts from a stats object.
   * Expected keys: avgQuality, accuracy, hits, misses, elapsedSecs
   * (speed is optional — shown if present)
   */
  update(stats) {
    if (!stats) return;

    const set = (el, val) => {
      if (el && val !== undefined && val !== null) el.textContent = val;
    };

    set(this._els.quality,  stats.avgQuality  ?? '-');
    set(this._els.accuracy, stats.accuracy !== undefined ? stats.accuracy + '%' : '-');
    set(this._els.hits,     stats.hits     ?? '-');
    set(this._els.misses,   stats.misses   ?? '-');

    if (stats.speed !== undefined) {
      set(this._els.speed, stats.speed);
    }

    if (stats.elapsedSecs !== undefined) {
      this.updateTimer(stats.elapsedSecs);
    }
  }

  /**
   * Flash a result feedback message on screen.
   * result = { result: 'hit'|'miss'|'weak', grade?: string, reason?: string }
   */
  showFeedback(result) {
    const el = this._els.feedback;
    if (!el) return;

    // Clear any pending fade-out
    if (this._feedbackTimeout) {
      clearTimeout(this._feedbackTimeout);
      this._feedbackTimeout = null;
    }

    el.textContent = result.grade || result.reason || 'Miss';

    // Remove all variant classes, then add the new one
    el.className = '';
    el.classList.add('hit-feedback--' + result.result);

    el.style.transition = 'none';
    el.style.opacity = '1';

    // Fade out after 1200ms
    this._feedbackTimeout = setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '0';
      this._feedbackTimeout = null;
    }, 1200);
  }

  /**
   * Show or hide the strike-zone ring overlay.
   */
  showStrikeZone(show) {
    const el = this._els.strikeRing;
    if (!el) return;
    el.style.opacity = show ? '1' : '0';
  }

  /**
   * Update the timer display from a total seconds value.
   */
  updateTimer(secs) {
    const el = this._els.timer;
    if (!el) return;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }
}
