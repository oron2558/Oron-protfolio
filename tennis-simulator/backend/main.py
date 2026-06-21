from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import asyncio
from datetime import datetime
from typing import List
import math

from models import IMUReading, SwingEvent, SwingScore, SessionStats
from analyzer import detect_swing, score_swing, determine_direction
from ws_handler import manager

# Store recent IMU readings for swing detection
imu_buffer: List[IMUReading] = []
sessions: List[dict] = []

app = FastAPI(title="Tennis Simulator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok", "sensors": len(manager.sensors), "displays": len(manager.displays)}

@app.get("/sessions")
def get_sessions():
    return sessions

@app.post("/sessions/start")
def start_session():
    return {"session_id": datetime.now().isoformat(), "status": "started"}

@app.post("/sessions/end")
def end_session(stats: SessionStats):
    sessions.append(stats.model_dump())
    return {"saved": True}

@app.websocket("/ws/sensor")
async def sensor_endpoint(ws: WebSocket):
    """ESP32 sensor connects here and streams raw IMU data."""
    await manager.connect_sensor(ws)
    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            reading = IMUReading(**data)
            imu_buffer.append(reading)

            # Keep only last 50 readings (~0.5 seconds at 100Hz)
            if len(imu_buffer) > 50:
                imu_buffer.pop(0)

            # Try to detect a swing in the buffer
            swing = detect_swing(imu_buffer)
            if swing:
                score = score_swing(swing)
                direction = determine_direction(swing, score)

                result = {
                    'type': 'swing',
                    'shot_type': swing.shot_type,
                    'magnitude': swing.magnitude,
                    'angle': swing.angle,
                    'score': score.model_dump(),
                    'direction': direction,
                    'timestamp': swing.timestamp
                }

                # Send to browser
                await manager.handle_sensor_data(result)

                # Clear buffer after detecting swing
                imu_buffer.clear()

    except WebSocketDisconnect:
        await manager.disconnect(ws)
        await manager.broadcast_to_displays({'type': 'sensor_disconnected'})

@app.websocket("/ws/display")
async def display_endpoint(ws: WebSocket):
    """Browser simulator connects here to receive processed data."""
    await manager.connect_display(ws)
    try:
        while True:
            # Keep connection alive, browser can send ping
            msg = await ws.receive_text()
            if msg == 'ping':
                await ws.send_text('pong')
    except WebSocketDisconnect:
        await manager.disconnect(ws)
