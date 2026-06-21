from fastapi import WebSocket
from typing import Set
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.sensors: Set[WebSocket] = set()     # ESP32 connections
        self.displays: Set[WebSocket] = set()    # Browser simulator connections

    async def connect_sensor(self, ws: WebSocket):
        await ws.accept()
        self.sensors.add(ws)
        await self.broadcast_to_displays({'type': 'sensor_connected'})

    async def connect_display(self, ws: WebSocket):
        await ws.accept()
        self.displays.add(ws)
        await ws.send_json({'type': 'server_ready', 'sensor_count': len(self.sensors)})

    async def disconnect(self, ws: WebSocket):
        self.sensors.discard(ws)
        self.displays.discard(ws)

    async def broadcast_to_displays(self, data: dict):
        if not self.displays:
            return
        dead = set()
        for ws in self.displays:
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        self.displays -= dead

    async def handle_sensor_data(self, data: dict):
        """Forward processed swing data to all display clients."""
        await self.broadcast_to_displays({
            'type': 'swing_result',
            **data
        })

manager = ConnectionManager()
