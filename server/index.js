import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';
import { TICK_RATE_MS } from '../shared/constants.js';
import { RoomManager } from './roomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const VIRTUAL_IFACE_PATTERN = /(vethernet|wsl|docker|vmware|virtualbox|hyper-v|loopback|tailscale|hamachi|tun|tap)/i;

export function getLanUrls(port) {
  if (process.env.PUBLIC_URL) {
    return {
      lanUrls: [process.env.PUBLIC_URL.replace(/\/$/, '')],
      recommendedUrl: process.env.PUBLIC_URL.replace(/\/$/, ''),
    };
  }

  const ifaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, entries] of Object.entries(ifaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      const addr = entry.address;
      if (addr.startsWith('169.254.')) continue;

      let priority = 0;
      if (VIRTUAL_IFACE_PATTERN.test(name)) priority -= 50;
      if (/wi-?fi|wlan|wireless|ethernet/i.test(name)) priority += 20;
      if (addr.startsWith('192.168.')) priority += 30;
      else if (addr.startsWith('10.')) priority += 20;
      else if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr)) priority += 10;

      candidates.push({ url: `http://${addr}:${port}`, priority, name });
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  const lanUrls = candidates.map((c) => c.url);
  return {
    lanUrls,
    recommendedUrl: lanUrls[0] || `http://localhost:${port}`,
  };
}

function safeResolve(baseDir, requestPath) {
  const cleanRel = requestPath.replace(/^\/+/, '');
  const resolved = path.resolve(baseDir, cleanRel);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    return null;
  }
  return resolved;
}

export async function createGameServer({
  port = Number(process.env.PORT) || 3000,
  host = '0.0.0.0',
  fallbackPorts = false,
} = {}) {
  let boundPort = port;

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = decodeURIComponent(reqUrl.pathname);

      if (pathname === '/api/network-info') {
        const info = getLanUrls(boundPort);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ port: boundPort, ...info }));
        return;
      }

      if (pathname === '/api/qr') {
        const target = reqUrl.searchParams.get('url') || '';
        if (!target || target.length > 256) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid url parameter' }));
          return;
        }
        let parsedTarget;
        try {
          parsedTarget = new URL(target);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Malformed url' }));
          return;
        }
        if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Unsupported protocol' }));
          return;
        }
        const svg = await QRCode.toString(parsedTarget.toString(), {
          type: 'svg',
          margin: 1,
          width: 220,
          color: { dark: '#07131D', light: '#F0F6F7' },
        });
        res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(svg);
        return;
      }

      // Reject raw traversal attempts
      if (pathname.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      let filePath = null;
      if (pathname.startsWith('/shared/')) {
        filePath = safeResolve(SHARED_DIR, pathname.slice('/shared/'.length));
      } else {
        const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
        filePath = safeResolve(PUBLIC_DIR, rel);
      }

      if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const content = await fs.readFile(filePath);
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=60',
      });
      res.end(content);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  });

  await new Promise((resolve, reject) => {
    let attempts = 0;
    const tryListen = (targetPort) => {
      const onError = (err) => {
        if (err.code === 'EADDRINUSE' && fallbackPorts && attempts < 10) {
          attempts += 1;
          tryListen(targetPort + 1);
          return;
        }
        reject(err);
      };
      server.once('error', onError);
      server.listen(targetPort, host, () => {
        server.removeListener('error', onError);
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          boundPort = addr.port;
        }
        resolve();
      });
    };
    tryListen(port);
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
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      roomManager.disconnect(ws);
    });
  });

  const tickInterval = setInterval(() => {
    roomManager.tick(Date.now());
  }, TICK_RATE_MS);

  const heartbeatInterval = setInterval(() => {
    for (const client of wss.clients) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 20_000);

  return {
    server,
    wss,
    roomManager,
    get port() {
      return boundPort;
    },
    async close() {
      clearInterval(tickInterval);
      clearInterval(heartbeatInterval);
      for (const client of wss.clients) {
        client.terminate();
      }
      await new Promise((resolve) => wss.close(resolve));
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const gameServer = await createGameServer({ fallbackPorts: !process.env.PORT });
  const { lanUrls, recommendedUrl } = getLanUrls(gameServer.port);

  console.log('');
  console.log('==============================================================');
  console.log('  LUMINA: Sol & Luna — 2-Player Mobile Co-op Adventure');
  console.log('==============================================================');
  console.log(`  Local PC  : http://localhost:${gameServer.port}`);
  console.log(`  Wi-Fi LAN : ${recommendedUrl}  <-- เปิดบนมือถือเครื่องที่ 1 และ 2`);
  if (lanUrls.length > 1) {
    console.log(`  Other IPs : ${lanUrls.slice(1).join(', ')}`);
  }
  console.log('--------------------------------------------------------------');
  console.log('  * หากมือถืออีกเครื่องเข้าไม่ได้ ให้กด Allow Node.js ใน Windows Firewall');
  console.log('==============================================================');
  console.log('');

  const shutdown = async () => {
    await gameServer.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
