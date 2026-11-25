import http from 'node:http';
import { WebSocketServer } from 'ws';
import { TICK_RATE_MS } from '../shared/constants.js';
import { RoomManager } from '../server/roomManager.js';

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: true, service: 'lumina-ws' }));
});

const wss = new WebSocketServer({ server });

const sendFn = (client, payload) => {
  if (client.readyState === 1) {
    client.send(JSON.stringify(payload));
  }
};

const roomManager = new RoomManager(sendFn);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      roomManager.handleMessage(ws, msg);
    } catch {
      // Ignore malformed JSON frames
    }
  });

  ws.on('close', () => {
    roomManager.disconnect(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

setInterval(() => {
  if (roomManager.rooms.size > 0) {
    roomManager.tick(Date.now());
  }
}, TICK_RATE_MS);

setInterval(() => {
  for (const client of wss.clients) {
    if (client.isAlive === false) {
      client.terminate();
      continue;
    }
    client.isAlive = false;
    client.ping();
  }
}, 20_000);

export default server;
