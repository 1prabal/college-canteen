from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps canteen_id to list of active WebSocket connections for staff
        self.canteen_connections: Dict[int, List[WebSocket]] = {}
        # Maps order_id to list of active WebSocket connections for order tracking
        self.order_connections: Dict[int, List[WebSocket]] = {}
        # Maps user_id to list of active WebSocket connections for personal notifications
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect_canteen(self, canteen_id: int, websocket: WebSocket):
        await websocket.accept()
        if canteen_id not in self.canteen_connections:
            self.canteen_connections[canteen_id] = []
        self.canteen_connections[canteen_id].append(websocket)

    def disconnect_canteen(self, canteen_id: int, websocket: WebSocket):
        if canteen_id in self.canteen_connections:
            if websocket in self.canteen_connections[canteen_id]:
                self.canteen_connections[canteen_id].remove(websocket)
            if not self.canteen_connections[canteen_id]:
                del self.canteen_connections[canteen_id]

    async def connect_order(self, order_id: int, websocket: WebSocket):
        await websocket.accept()
        if order_id not in self.order_connections:
            self.order_connections[order_id] = []
        self.order_connections[order_id].append(websocket)

    def disconnect_order(self, order_id: int, websocket: WebSocket):
        if order_id in self.order_connections:
            if websocket in self.order_connections[order_id]:
                self.order_connections[order_id].remove(websocket)
            if not self.order_connections[order_id]:
                del self.order_connections[order_id]

    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def broadcast_to_canteen(self, canteen_id: int, message: dict):
        if canteen_id in self.canteen_connections:
            for connection in list(self.canteen_connections[canteen_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def notify_order_update(self, order_id: int, message: dict):
        if order_id in self.order_connections:
            for connection in list(self.order_connections[order_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def notify_user(self, user_id: int, message: dict):
        if user_id in self.user_connections:
            for connection in list(self.user_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()
