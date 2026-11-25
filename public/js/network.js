import { MSG } from '../../shared/constants.js';

export class GameNetwork {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.connected = false;
    this.intentionalClose = false;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.backoffMs = 600;

    this.roomCode = null;
    this.role = null;
    this.sessionToken = null;
    this.playerName = '';
    this.rttMs = 0;
    this.serverTimeOffsetMs = 0;
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.handlers.get(type)?.delete(fn);
  }

  emit(type, payload) {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const fn of set) fn(payload);
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    this.intentionalClose = false;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/api/ws`;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      let settled = false;

      ws.addEventListener('open', () => {
        this.connected = true;
        this.backoffMs = 600;
        this.startPingLoop();
        this.emit('connection', { connected: true });

        // Reconnect into active room automatically if dropped
        if (this.roomCode && this.sessionToken) {
          this.send(MSG.JOIN_ROOM, {
            code: this.roomCode,
            name: this.playerName,
            sessionToken: this.sessionToken,
          });
        }
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      ws.addEventListener('message', (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.type === MSG.PONG && typeof msg.t === 'number') {
          const rtt = Math.max(0, Date.now() - msg.t);
          this.rttMs = Math.round(rtt);
          if (typeof msg.serverTime === 'number') {
            this.serverTimeOffsetMs = msg.serverTime + rtt * 0.5 - Date.now();
          }
          this.emit('rtt', this.rttMs);
          return;
        }
        if (msg.type === MSG.ROOM_CREATED || msg.type === MSG.ROOM_JOINED) {
          this.roomCode = msg.code;
          this.role = msg.role;
          this.sessionToken = msg.sessionToken;
        }
        if (msg.type === MSG.ROOM_STATE && msg.yourRole) {
          this.role = msg.yourRole;
        }
        this.emit(msg.type, msg);
      });

      ws.addEventListener('close', () => {
        this.connected = false;
        this.stopPingLoop();
        this.emit('connection', { connected: false });
        if (!settled) {
          settled = true;
          reject(new Error('WebSocket connection closed'));
        }
        if (!this.intentionalClose && this.roomCode) {
          this.scheduleReconnect();
        }
      });

      ws.addEventListener('error', () => {
        if (!settled) {
          settled = true;
          reject(new Error('WebSocket connection failed'));
        }
      });
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.backoffMs = Math.min(3500, Math.round(this.backoffMs * 1.5));
      this.connect().catch(() => {});
    }, this.backoffMs);
  }

  startPingLoop() {
    this.stopPingLoop();
    this.send(MSG.PING, { t: Date.now() });
    this.pingTimer = setInterval(() => {
      this.send(MSG.PING, { t: Date.now() });
    }, 3000);
  }

  stopPingLoop() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type, ...payload }));
    return true;
  }

  getServerNowSec() {
    return (Date.now() + this.serverTimeOffsetMs) / 1000;
  }

  disconnect() {
    this.intentionalClose = true;
    this.roomCode = null;
    this.role = null;
    this.sessionToken = null;
    this.stopPingLoop();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
