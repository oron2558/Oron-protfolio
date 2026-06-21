export class SwingDetector {
  constructor() {
    this.swingTime = null;
    this.direction = 'cross';
  }

  recordSwing(directionBias) {
    this.swingTime = Date.now();
    this.direction = directionBias || 'cross';
  }

  evaluate(ballProgress, idealT) {
    if (this.swingTime === null) {
      return { result: 'miss', quality: 0, reason: 'No swing' };
    }

    // Timing delta in t-space (0–1): positive = late, negative = early
    const timingDelta = ballProgress - idealT;
    const absTimingDelta = Math.abs(timingDelta);

    if (absTimingDelta > 0.12) {
      const reason = timingDelta > 0 ? 'Too late!' : 'Too early!';
      return { result: 'miss', quality: 0, reason };
    }

    // Quality scoring 0–100 based on timing accuracy
    const timingScore = Math.round((1 - absTimingDelta / 0.12) * 100);

    if (timingScore > 85) {
      return {
        result: 'hit',
        quality: timingScore,
        grade: 'Perfect!',
        direction: this.direction,
      };
    }

    if (timingScore > 60) {
      return {
        result: 'hit',
        quality: timingScore,
        grade: 'Good',
        direction: this.direction,
      };
    }

    if (timingScore > 35) {
      return {
        result: 'weak',
        quality: timingScore,
        grade: 'Weak',
        direction: 'net',
      };
    }

    return { result: 'miss', quality: 0, grade: 'Miss', reason: 'Off timing' };
  }

  reset() {
    this.swingTime = null;
  }
}
