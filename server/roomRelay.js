import { WebSocketServer } from 'ws';

export function attachRoomRelay(httpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const rooms = new Map();

  function getRoom(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        clients: new Map(),
      });
    }
    return rooms.get(roomId);
  }

  function broadcast(room, payload, excludeWs = null) {
    const raw = JSON.stringify(payload);
    for (const [ws] of room.clients.entries()) {
      if (ws !== excludeWs && ws.readyState === ws.OPEN) {
        ws.send(raw);
      }
    }
  }

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname !== '/ws-sanctuary') return;

    wss.handleUpgrade(req, socket, head, (ws) => {
      const roomId = url.searchParams.get('room') || '1';
      const room = getRoom(roomId);
      const clientId = 'p-' + Math.random().toString(36).slice(2, 10);

      room.clients.set(ws, { id: clientId, state: null });

      ws.send(
        JSON.stringify({
          type: 'welcome',
          clientId,
          roomId,
          peers: Array.from(room.clients.values())
            .filter((c) => c.id !== clientId && c.state)
            .map((c) => c.state),
        }),
      );

      ws.on('message', (buf) => {
        let msg;
        try {
          msg = JSON.parse(String(buf));
        } catch {
          return;
        }
        const entry = room.clients.get(ws);
        if (!entry) return;

        if (msg.type === 'state' && msg.state) {
          entry.state = { ...msg.state, id: clientId };
          broadcast(room, { type: 'peer_state', peer: entry.state }, ws);
        } else if (msg.type === 'gesture') {
          broadcast(
            room,
            {
              type: 'peer_gesture',
              id: clientId,
              name: entry.state?.name || 'Phù Thuỷ Ẩn Danh',
              kind: msg.kind,
              blessing: msg.blessing || '',
            },
            ws,
          );
        }
      });

      ws.on('close', () => {
        room.clients.delete(ws);
        broadcast(room, { type: 'peer_leave', id: clientId });
      });
    });
  });
}
