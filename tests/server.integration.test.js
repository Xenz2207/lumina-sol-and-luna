import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createGameServer } from '../server/index.js';
import { MSG } from '../shared/constants.js';

function connectWs(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const messages = [];
    const waiters = [];

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      messages.push(msg);
      for (let i = waiters.length - 1; i >= 0; i--) {
        if (waiters[i].predicate(msg)) {
          const w = waiters.splice(i, 1)[0];
          clearTimeout(w.timer);
          w.resolve(msg);
        }
      }
    });

    ws.waitFor = (predicate, timeoutMs = 2500) => {
      const existing = messages.find(predicate);
      if (existing) return Promise.resolve(existing);
      return new Promise((res, rej) => {
        const timer = setTimeout(() => rej(new Error('Timed out waiting for WS message')), timeoutMs);
        waiters.push({ predicate, resolve: res, timer });
      });
    };

    ws.sendMsg = (type, payload = {}) => {
      ws.send(JSON.stringify({ type, ...payload }));
    };

    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

describe('HTTP & WebSocket Integration', () => {
  let gameServer = null;

  afterEach(async () => {
    if (gameServer) {
      await gameServer.close();
      gameServer = null;
    }
  });

  it('serves static assets, QR SVG, network-info, and blocks path traversal', async () => {
    gameServer = await createGameServer({ port: 0, host: '127.0.0.1' });
    const base = `http://127.0.0.1:${gameServer.port}`;

    for (const p of ['/', '/manifest.json', '/styles.css', '/js/main.js', '/shared/levels.js']) {
      const res = await fetch(`${base}${p}`);
      assert.equal(res.status, 200, `Expected 200 for ${p}`);
    }

    const netInfo = await fetch(`${base}/api/network-info`).then((r) => r.json());
    assert.equal(netInfo.port, gameServer.port);
    assert.ok(netInfo.recommendedUrl.startsWith('http://'));

    const qrRes = await fetch(`${base}/api/qr?url=${encodeURIComponent('http://localhost/test')}`);
    assert.equal(qrRes.status, 200);
    const svg = await qrRes.text();
    assert.ok(svg.includes('<svg'));

    const travRes = await fetch(`${base}/../package.json`);
    assert.ok(travRes.status === 403 || travRes.status === 404);
  });

  it('syncs 2 WebSocket clients: room pairing, movement, briar burn, and emote ping', async () => {
    gameServer = await createGameServer({ port: 0, host: '127.0.0.1' });
    const wsUrl = `ws://127.0.0.1:${gameServer.port}/api/ws`;

    const phone1 = await connectWs(wsUrl);
    const phone2 = await connectWs(wsUrl);

    phone1.sendMsg(MSG.CREATE_ROOM, { name: 'Phone1' });
    const created = await phone1.waitFor((m) => m.type === MSG.ROOM_CREATED);
    assert.equal(created.role, 'sola');

    phone2.sendMsg(MSG.JOIN_ROOM, { code: created.code, name: 'Phone2' });
    const joined = await phone2.waitFor((m) => m.type === MSG.ROOM_JOINED);
    assert.equal(joined.role, 'luna');

    phone1.sendMsg(MSG.START_GAME, { actIndex: 0 });
    await Promise.all([
      phone1.waitFor((m) => m.type === MSG.GAME_STARTED),
      phone2.waitFor((m) => m.type === MSG.GAME_STARTED),
    ]);

    // Exchange movement state
    phone1.sendMsg(MSG.PLAYER_STATE, { x: 960, y: 650, vx: 120, vy: 0, facing: 1, grounded: true });
    const partnerSeen = await phone2.waitFor((m) => m.type === MSG.PARTNER_STATE && m.role === 'sola');
    assert.equal(partnerSeen.x, 960);

    // Phone 1 (SOLA) casts Solar Bolt to burn Stage 1 briar-t1 (x=820, y=540..720)
    phone1.sendMsg(MSG.CAST_POWER, { x: 760, y: 650, dir: 1 });
    await Promise.all([
      phone1.waitFor((m) => m.type === MSG.WORLD_EVENT && m.event.type === 'briar_burned'),
      phone2.waitFor((m) => m.type === MSG.WORLD_EVENT && m.event.type === 'briar_burned'),
    ]);

    // Emote ping reaches partner
    phone2.sendMsg(MSG.PING_EMOTE, { kind: 'here', x: 300, y: 690 });
    const emoteSeen = await phone1.waitFor((m) => m.type === MSG.EMOTE_RECEIVED && m.role === 'luna');
    assert.equal(emoteSeen.kind, 'here');

    // Stage selection syncs both phones
    phone1.sendMsg(MSG.SELECT_ACT, { actIndex: 5 });
    const [a1, a2] = await Promise.all([
      phone1.waitFor((m) => m.type === MSG.ACT_CHANGED),
      phone2.waitFor((m) => m.type === MSG.ACT_CHANGED),
    ]);
    assert.equal(a1.worldState.actIndex, 5);
    assert.equal(a2.worldState.actIndex, 5);

    phone1.close();
    phone2.close();
  });
});
