import math
from models import IMUReading, SwingEvent, SwingScore, ShotResult
from typing import List

SHOT_PROFILES = {
    'forehand': {'min_speed': 8.0, 'angle_range': (15, 45), 'min_follow_ms': 200},
    'backhand': {'min_speed': 6.0, 'angle_range': (-10, 10), 'min_follow_ms': 180},
    'serve':    {'min_speed': 12.0, 'angle_range': (30, 80), 'min_follow_ms': 300},
    'slice':    {'min_speed': 3.0, 'angle_range': (-45, -15), 'min_follow_ms': 100},
    'volley':   {'min_speed': 2.0, 'angle_range': (-5, 5),  'min_follow_ms': 50},
}

SWING_THRESHOLD = 15.0  # m/s² acceleration magnitude to detect a swing

def detect_swing(readings: List[IMUReading]) -> SwingEvent | None:
    """
    Find peak acceleration spike in a window of IMU readings.
    Returns SwingEvent if spike above threshold, else None.
    """
    if len(readings) < 3:
        return None

    peak_mag = 0
    peak_idx = 0
    for i, r in enumerate(readings):
        mag = math.sqrt(r.ax**2 + r.ay**2 + r.az**2)
        if mag > peak_mag:
            peak_mag = mag
            peak_idx = i

    if peak_mag < SWING_THRESHOLD:
        return None

    # Estimate swing angle from gyroscope at peak
    peak = readings[peak_idx]
    angle = math.degrees(math.atan2(peak.gx, peak.gz))

    # Follow-through: time from peak to when accel drops below 5 m/s²
    follow_start = readings[peak_idx].timestamp
    follow_end = follow_start
    for r in readings[peak_idx:]:
        mag = math.sqrt(r.ax**2 + r.ay**2 + r.az**2)
        if mag > 5.0:
            follow_end = r.timestamp

    # Estimate racket head speed: integrate acceleration over swing duration
    # Simplified: use peak magnitude as proxy
    speed_ms = peak_mag * 0.5  # rough conversion from m/s² to m/s

    # Classify shot type based on angle
    shot_type = classify_shot(angle, speed_ms)

    return SwingEvent(
        timestamp=peak.timestamp,
        magnitude=round(speed_ms, 2),
        angle=round(angle, 1),
        duration_ms=round(follow_end - follow_start, 1),
        shot_type=shot_type
    )

def classify_shot(angle: float, speed: float) -> str:
    """Classify shot type based on swing angle."""
    if 15 <= angle <= 45:
        return 'forehand'
    elif -10 <= angle <= 10:
        return 'backhand' if speed > 3 else 'volley'
    elif angle > 45:
        return 'serve'
    elif angle < -15:
        return 'slice'
    return 'forehand'  # default

def score_swing(swing: SwingEvent, expected_t: float = 0.88, actual_t: float = 0.88) -> SwingScore:
    """
    Score a swing event against biomechanical profiles.
    expected_t: ideal hit moment (0-1 along ball trajectory)
    actual_t: when swing actually happened
    """
    profile = SHOT_PROFILES.get(swing.shot_type, SHOT_PROFILES['forehand'])

    # Power score: how fast vs minimum required
    power = min(100, int(swing.magnitude / profile['min_speed'] * 70))

    # Angle quality: how close to ideal angle range
    lo, hi = profile['angle_range']
    mid = (lo + hi) / 2
    max_dev = (hi - lo) / 2
    angle_dev = abs(swing.angle - mid)
    angle_quality = max(0, int((1 - angle_dev / (max_dev + 30)) * 100))

    # Timing score: how close to ideal hit moment
    timing_delta = abs(actual_t - expected_t)
    timing = max(0, int((1 - timing_delta / 0.12) * 100)) if timing_delta < 0.12 else 0

    overall = int(power * 0.4 + angle_quality * 0.3 + timing * 0.3)

    # Determine grade and feedback
    if overall >= 80 and timing > 70:
        grade = 'Perfect'
        feedback = f"Excellent {swing.shot_type}! {int(swing.magnitude * 3.6)} km/h"
    elif overall >= 60:
        grade = 'Good'
        feedback = f"Good shot. Work on {'timing' if timing < power else 'power'}."
    elif overall >= 40:
        grade = 'Weak'
        feedback = f"Too {'slow — swing harder!' if power < 50 else 'early' if actual_t < expected_t else 'late!'}"
    else:
        grade = 'Miss'
        feedback = 'Missed — watch the ball!'

    return SwingScore(
        overall=overall, power=power, timing=timing,
        angle_quality=angle_quality, grade=grade, feedback=feedback
    )

def determine_direction(swing: SwingEvent, score: SwingScore) -> str:
    """Determine where the return ball goes based on swing."""
    if score.grade == 'Miss':
        return 'miss'
    if score.grade == 'Weak' or score.overall < 45:
        return 'net'
    # Use wrist angle to determine direction
    if swing.angle > 30:
        return 'cross'
    elif swing.angle < 0:
        return 'down_the_line'
    if score.overall < 60:
        return 'out'
    return 'cross'  # default
