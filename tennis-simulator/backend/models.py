from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IMUReading(BaseModel):
    # Raw data from ESP32 sensor
    ax: float  # acceleration X (m/s²)
    ay: float  # acceleration Y (m/s²)
    az: float  # acceleration Z (m/s²)
    gx: float  # gyroscope X (deg/s)
    gy: float  # gyroscope Y (deg/s)
    gz: float  # gyroscope Z (deg/s)
    timestamp: float  # milliseconds since session start

class SwingEvent(BaseModel):
    # Detected swing from IMU data
    timestamp: float
    magnitude: float    # racket head speed in m/s
    angle: float        # swing path angle in degrees
    duration_ms: float  # follow-through duration
    shot_type: str      # 'forehand' | 'backhand' | 'serve' | 'slice' | 'volley'

class SwingScore(BaseModel):
    overall: int        # 0-100
    power: int          # 0-100
    timing: int         # 0-100 (vs expected hit moment)
    angle_quality: int  # 0-100
    grade: str          # 'Perfect' | 'Good' | 'Weak' | 'Miss'
    feedback: str       # human-readable coaching text

class ShotResult(BaseModel):
    swing: SwingEvent
    score: SwingScore
    result: str         # 'hit' | 'weak' | 'miss'
    direction: str      # 'cross' | 'down_the_line' | 'net' | 'out'

class SessionStats(BaseModel):
    total_shots: int
    hits: int
    misses: int
    avg_quality: float
    accuracy_pct: float
    peak_speed_kmh: float
    start_time: datetime
