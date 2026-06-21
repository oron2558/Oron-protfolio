export class Session {
  constructor() {
    this.shots = [];
    this.startTime = Date.now();
    this.shotTypes = { forehand: 0, backhand: 0, serve: 0 };
  }

  recordShot(result) {
    this.shots.push({ ...result, timestamp: Date.now() });
    if (result.result === 'hit') {
      this.shotTypes.forehand++;
    }
  }

  getStats() {
    const total = this.shots.length;
    const hits = this.shots.filter(s => s.result === 'hit').length;
    const misses = this.shots.filter(s => s.result === 'miss').length;
    const hitShots = this.shots.filter(s => s.result === 'hit');
    const avgQuality = hits > 0
      ? Math.round(hitShots.reduce((acc, s) => acc + s.quality, 0) / hits)
      : 0;
    const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;
    const elapsedSecs = Math.floor((Date.now() - this.startTime) / 1000);

    return { total, hits, misses, avgQuality, accuracy, elapsedSecs };
  }

  save() {
    const data = {
      ...this.getStats(),
      shots: this.shots,
      date: new Date().toISOString(),
    };

    try {
      const sessions = JSON.parse(localStorage.getItem('tennis_sessions') || '[]');
      sessions.push(data);
      localStorage.setItem('tennis_sessions', JSON.stringify(sessions.slice(-20)));
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }
  }
}
