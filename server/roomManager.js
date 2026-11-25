import crypto from 'node:crypto';
import { ACTS } from '../shared/levels.js';
import { MSG, ROOM_CODE_ALPHABET } from '../shared/constants.js';
import {
  createWorldState,
  serializeWorldState,
  serializeWorldTick,
  castPower,
  triggerHarmony,
  collectShard,
  touchCheckpoint,
  recordDamage,
  checkPartnerReviveOverlap,
  stepWorld,
  isPortalUnlocked,
} from '../shared/worldSimulation.js';

const RECONNECT_GRACE_MS = 120_000;

export class RoomManager {
  constructor(sendFn, nowFn = () => Date.now()) {
    this.send = sendFn;
    this.now = nowFn;
    this.rooms = new Map();
    this.clientMeta = new WeakMap();
  }

  generateRoomCode() {
    for (let attempt = 0; attempt < 50; attempt++) {
      let code = '';
      for (let i = 0; i < 4; i++) {
        const idx = crypto.randomInt(0, ROOM_CODE_ALPHABET.length);
        code += ROOM_CODE_ALPHABET[idx];
      }
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Failed to generate unique room code');
  }

  generateToken() {
    return crypto.randomBytes(12).toString('hex');
  }

  sanitizeName(name, fallback) {
    const cleaned = String(name || '').trim().slice(0, 18);
    return cleaned || fallback;
  }

  serializeRoom(room) {
    return {
      code: room.code,
      phase: room.phase,
      selectedActIndex: room.selectedActIndex || 0,
      actIndex: room.world ? room.world.actIndex : room.selectedActIndex || 0,
      players: {
        sola: room.slots.sola
          ? {
              name: room.slots.sola.name,
              connected: room.slots.sola.connected,
              ready: room.slots.sola.ready,
            }
          : null,
        luna: room.slots.luna
          ? {
              name: room.slots.luna.name,
              connected: room.slots.luna.connected,
              ready: room.slots.luna.ready,
            }
          : null,
      },
    };
  }

  broadcastRoom(room, msg, excludeClient = null) {
    for (const role of ['sola', 'luna']) {
      const slot = room.slots[role];
      if (slot && slot.connected && slot.client && slot.client !== excludeClient) {
        this.send(slot.client, msg);
      }
    }
  }

  getClientContext(client) {
    const meta = this.clientMeta.get(client);
    if (!meta) return null;
    const room = this.rooms.get(meta.code);
    if (!room) return null;
    const slot = room.slots[meta.role];
    if (!slot || slot.client !== client) return null;
    return { room, role: meta.role, slot };
  }

  createRoom(client, rawName) {
    this.detachClient(client);
    const code = this.generateRoomCode();
    const token = this.generateToken();
    const name = this.sanitizeName(rawName, 'ผู้เล่น 1');

    const room = {
      code,
      phase: 'lobby',
      selectedActIndex: 0,
      createdAt: this.now(),
      lastTickAt: this.now(),
      slots: {
        sola: {
          role: 'sola',
          name,
          token,
          client,
          connected: true,
          ready: false,
          disconnectedAt: null,
        },
        luna: null,
      },
      world: null,
      victorySent: false,
    };

    this.rooms.set(code, room);
    this.clientMeta.set(client, { code, role: 'sola' });

    const roomState = this.serializeRoom(room);
    this.send(client, {
      type: MSG.ROOM_CREATED,
      code,
      role: 'sola',
      sessionToken: token,
      room: roomState,
    });
    return room;
  }

  joinRoom(client, rawCode, rawName, sessionToken = null) {
    const code = String(rawCode || '')
      .trim()
      .toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      this.send(client, {
        type: MSG.ROOM_ERROR,
        error: 'ไม่พบห้องรหัสนี้ กรุณาตรวจสอบรหัส 4 หลักอีกครั้ง',
      });
      return null;
    }

    // Attempt seamless reconnect via sessionToken
    if (sessionToken) {
      for (const role of ['sola', 'luna']) {
        const slot = room.slots[role];
        if (slot && slot.token === sessionToken) {
          this.detachClient(client);
          slot.client = client;
          slot.connected = true;
          slot.disconnectedAt = null;
          if (rawName) slot.name = this.sanitizeName(rawName, slot.name);
          this.clientMeta.set(client, { code, role });

          const roomState = this.serializeRoom(room);
          this.send(client, {
            type: MSG.ROOM_JOINED,
            code,
            role,
            sessionToken: slot.token,
            reconnected: true,
            room: roomState,
            worldState: room.world ? serializeWorldState(room.world, this.now()) : null,
          });
          this.broadcastRoom(
            room,
            { type: MSG.PARTNER_CONNECTION, role, connected: true, room: roomState },
            client
          );
          return room;
        }
      }
    }

    let assignedRole = null;
    if (!room.slots.luna) {
      assignedRole = 'luna';
    } else if (!room.slots.sola) {
      assignedRole = 'sola';
    } else if (!room.slots.luna.connected && this.now() - (room.slots.luna.disconnectedAt || 0) > 15_000) {
      assignedRole = 'luna';
    } else if (!room.slots.sola.connected && this.now() - (room.slots.sola.disconnectedAt || 0) > 15_000) {
      assignedRole = 'sola';
    }

    if (!assignedRole) {
      this.send(client, {
        type: MSG.ROOM_ERROR,
        error: 'ห้องนี้เต็มแล้ว (2/2 คน)',
      });
      return null;
    }

    this.detachClient(client);
    const token = this.generateToken();
    const defaultName = assignedRole === 'luna' ? 'ผู้เล่น 2' : 'ผู้เล่น 1';
    const name = this.sanitizeName(rawName, defaultName);

    room.slots[assignedRole] = {
      role: assignedRole,
      name,
      token,
      client,
      connected: true,
      ready: false,
      disconnectedAt: null,
    };
    this.clientMeta.set(client, { code, role: assignedRole });

    const roomState = this.serializeRoom(room);
    this.send(client, {
      type: MSG.ROOM_JOINED,
      code,
      role: assignedRole,
      sessionToken: token,
      reconnected: false,
      room: roomState,
      worldState: room.world ? serializeWorldState(room.world, this.now()) : null,
    });
    this.broadcastRoom(room, { type: MSG.ROOM_STATE, room: roomState }, client);
    return room;
  }

  swapRoles(client) {
    const ctx = this.getClientContext(client);
    if (!ctx || ctx.room.phase !== 'lobby') return;
    const { room } = ctx;
    const prevSola = room.slots.sola;
    const prevLuna = room.slots.luna;

    room.slots.sola = prevLuna;
    room.slots.luna = prevSola;

    if (room.slots.sola) {
      room.slots.sola.role = 'sola';
      room.slots.sola.ready = false;
      if (room.slots.sola.client) {
        this.clientMeta.set(room.slots.sola.client, { code: room.code, role: 'sola' });
      }
    }
    if (room.slots.luna) {
      room.slots.luna.role = 'luna';
      room.slots.luna.ready = false;
      if (room.slots.luna.client) {
        this.clientMeta.set(room.slots.luna.client, { code: room.code, role: 'luna' });
      }
    }

    const roomState = this.serializeRoom(room);
    for (const r of ['sola', 'luna']) {
      const slot = room.slots[r];
      if (slot && slot.connected && slot.client) {
        this.send(slot.client, {
          type: MSG.ROOM_STATE,
          yourRole: r,
          room: roomState,
        });
      }
    }
  }

  setReady(client, ready) {
    const ctx = this.getClientContext(client);
    if (!ctx || ctx.room.phase !== 'lobby') return;
    ctx.slot.ready = Boolean(ready);
    this.broadcastRoom(ctx.room, {
      type: MSG.ROOM_STATE,
      room: this.serializeRoom(ctx.room),
    });
  }

  startGame(client, actIndex = null) {
    const ctx = this.getClientContext(client);
    if (!ctx) return;
    const { room } = ctx;
    const targetAct = actIndex !== null && actIndex !== undefined ? Number(actIndex) : room.selectedActIndex || 0;
    const clampedAct = Math.max(0, Math.min(Number.isFinite(targetAct) ? Math.floor(targetAct) : 0, ACTS.length - 1));
    const now = this.now();
    room.phase = 'playing';
    room.victorySent = false;
    room.selectedActIndex = clampedAct;
    room.world = createWorldState(clampedAct, null, now);
    room.lastTickAt = now;

    const worldState = serializeWorldState(room.world, now);
    const roomState = this.serializeRoom(room);
    this.broadcastRoom(room, {
      type: MSG.GAME_STARTED,
      room: roomState,
      worldState,
    });
  }

  selectAct(client, actIndex = 0) {
    const ctx = this.getClientContext(client);
    if (!ctx) return;
    const { room } = ctx;
    const raw = Number(actIndex);
    const clampedAct = Math.max(0, Math.min(Number.isFinite(raw) ? Math.floor(raw) : 0, ACTS.length - 1));
    room.selectedActIndex = clampedAct;

    if (room.phase === 'lobby') {
      this.broadcastRoom(room, {
        type: MSG.ROOM_STATE,
        room: this.serializeRoom(room),
      });
      return;
    }

    const now = this.now();
    room.phase = 'playing';
    room.victorySent = false;
    const prevStats = room.world
      ? {
          startedAt: room.world.startedAt,
          totalShardsCollected: room.world.totalShardsCollected,
          teamworkActions: room.world.teamworkActions,
        }
      : null;
    room.world = createWorldState(clampedAct, prevStats, now);
    room.lastTickAt = now;
    this.broadcastRoom(room, {
      type: MSG.ACT_CHANGED,
      worldState: serializeWorldState(room.world, now),
    });
  }

  restartGame(client) {
    const ctx = this.getClientContext(client);
    if (!ctx) return;
    this.startGame(client, 0);
  }

  handleMessage(client, msg) {
    if (!msg || typeof msg.type !== 'string') return;

    switch (msg.type) {
      case MSG.PING:
        this.send(client, { type: MSG.PONG, t: msg.t, serverTime: this.now() });
        return;
      case MSG.CREATE_ROOM:
        this.createRoom(client, msg.name);
        return;
      case MSG.JOIN_ROOM:
        this.joinRoom(client, msg.code, msg.name, msg.sessionToken);
        return;
      case MSG.SWAP_ROLES:
        this.swapRoles(client);
        return;
      case MSG.SET_READY:
        this.setReady(client, msg.ready);
        return;
      case MSG.START_GAME:
        this.startGame(client, msg.actIndex);
        return;
      case MSG.SELECT_ACT:
        this.selectAct(client, msg.actIndex);
        return;
      case MSG.RESTART_GAME:
        this.restartGame(client);
        return;
      default:
        break;
    }

    const ctx = this.getClientContext(client);
    if (!ctx || !ctx.room.world || ctx.room.phase !== 'playing') return;
    const { room, role } = ctx;
    const world = room.world;
    const nowMs = this.now();
    const nowSec = nowMs / 1000;

    switch (msg.type) {
      case MSG.PLAYER_STATE: {
        world.playerPositions[role] = {
          x: Number(msg.x) || 0,
          y: Number(msg.y) || 0,
          vx: Number(msg.vx) || 0,
          vy: Number(msg.vy) || 0,
          facing: msg.facing < 0 ? -1 : 1,
          grounded: Boolean(msg.grounded),
          anim: msg.anim || 'idle',
          spirit: Boolean(world.playersSpirit[role]),
        };

        this.broadcastRoom(
          room,
          {
            type: MSG.PARTNER_STATE,
            role,
            ...world.playerPositions[role],
            hp: world.playersHealth[role],
            t: msg.t || nowMs,
          },
          client
        );

        const revives = checkPartnerReviveOverlap(world);
        for (const ev of revives) {
          this.broadcastRoom(room, { type: MSG.WORLD_EVENT, event: ev });
        }
        break;
      }

      case MSG.CAST_POWER: {
        const x = Number.isFinite(msg.x) ? msg.x : world.playerPositions[role].x;
        const y = Number.isFinite(msg.y) ? msg.y : world.playerPositions[role].y;
        const dir = msg.dir ?? world.playerPositions[role].facing;
        const proj = castPower(world, role, x, y, dir, nowSec);
        if (proj) {
          this.broadcastRoom(room, {
            type: MSG.POWER_CAST,
            role,
            projectile: { ...proj },
          });
        }
        break;
      }

      case MSG.HARMONY_PULSE: {
        const connectedCount = ['sola', 'luna'].filter((r) => room.slots[r]?.connected).length;
        const result = triggerHarmony(world, role, nowSec, connectedCount < 2);
        if (result.ok) {
          this.broadcastRoom(room, {
            type: MSG.HARMONY_TRIGGERED,
            ...result,
          });
        } else {
          this.send(client, {
            type: MSG.WORLD_EVENT,
            event: { type: 'harmony_failed', reason: result.reason },
          });
        }
        break;
      }

      case MSG.COLLECT_SHARD: {
        const ev = collectShard(world, role, msg.shardId);
        if (ev) {
          this.broadcastRoom(room, { type: MSG.WORLD_EVENT, event: ev });
        }
        break;
      }

      case MSG.TOUCH_CHECKPOINT: {
        const ev = touchCheckpoint(world, role, msg.checkpointId);
        if (ev) {
          this.broadcastRoom(room, { type: MSG.WORLD_EVENT, event: ev });
        }
        break;
      }

      case MSG.PING_EMOTE: {
        const pos = world.playerPositions[role];
        this.broadcastRoom(room, {
          type: MSG.EMOTE_RECEIVED,
          role,
          kind: msg.kind || 'here',
          x: Number.isFinite(msg.x) ? msg.x : pos.x,
          y: Number.isFinite(msg.y) ? msg.y : pos.y,
        });
        break;
      }

      case MSG.PARTNER_BOOST: {
        world.teamworkActions += 1;
        this.broadcastRoom(room, {
          type: MSG.WORLD_EVENT,
          event: {
            type: 'partner_boosted',
            role,
            x: Number.isFinite(msg.x) ? msg.x : world.playerPositions[role].x,
            y: Number.isFinite(msg.y) ? msg.y : world.playerPositions[role].y,
            teamworkActions: world.teamworkActions,
          },
        });
        break;
      }

      case MSG.PLAYER_DAMAGED: {
        const ev = recordDamage(world, role, Number(msg.amount) || 1);
        if (ev) {
          this.broadcastRoom(room, { type: MSG.WORLD_EVENT, event: ev });
        }
        break;
      }

      case MSG.ENTER_PORTAL: {
        if (!isPortalUnlocked(world)) break;
        const level = ACTS[world.actIndex];
        const pos = world.playerPositions[role];
        const dist = Math.hypot(pos.x - level.portal.x, pos.y - level.portal.y);
        if (dist > 140) break;

        world.playersAtPortal.add(role);
        const connectedRoles = ['sola', 'luna'].filter((r) => room.slots[r]?.connected);
        const allInside =
          connectedRoles.length > 0 && connectedRoles.every((r) => world.playersAtPortal.has(r));

        if (allInside) {
          if (world.actIndex + 1 < ACTS.length) {
            const nextStats = {
              startedAt: world.startedAt,
              totalShardsCollected: world.totalShardsCollected,
              teamworkActions: world.teamworkActions,
            };
            room.world = createWorldState(world.actIndex + 1, nextStats, nowMs);
            this.broadcastRoom(room, {
              type: MSG.ACT_CHANGED,
              worldState: serializeWorldState(room.world, nowMs),
            });
          } else if (!room.victorySent) {
            room.victorySent = true;
            room.phase = 'victory';
            this.broadcastRoom(room, {
              type: MSG.VICTORY,
              summary: {
                totalShardsCollected: world.totalShardsCollected,
                teamworkActions: world.teamworkActions,
                elapsedMs: nowMs - world.startedAt,
              },
            });
          }
        } else {
          this.broadcastRoom(room, {
            type: MSG.WORLD_EVENT,
            event: { type: 'portal_waiting', role },
          });
        }
        break;
      }

      default:
        break;
    }
  }

  tick(nowMs = this.now()) {
    for (const [code, room] of this.rooms.entries()) {
      // Clean up abandoned rooms
      const activeConnected = ['sola', 'luna'].some((r) => room.slots[r]?.connected);
      if (!activeConnected) {
        const lastGone = Math.max(
          room.slots.sola?.disconnectedAt || room.createdAt,
          room.slots.luna?.disconnectedAt || room.createdAt
        );
        if (nowMs - lastGone > RECONNECT_GRACE_MS) {
          this.rooms.delete(code);
        }
        continue;
      }

      if (room.phase !== 'playing' || !room.world) continue;
      const dt = Math.min(0.1, Math.max(0.001, (nowMs - room.lastTickAt) / 1000));
      room.lastTickAt = nowMs;

      stepWorld(room.world, dt, (event) => {
        this.broadcastRoom(room, { type: MSG.WORLD_EVENT, event });
      });

      this.broadcastRoom(room, {
        type: MSG.WORLD_TICK,
        tick: serializeWorldTick(room.world, nowMs),
      });

      if (room.world.victory && !room.victorySent) {
        room.victorySent = true;
        room.phase = 'victory';
        this.broadcastRoom(room, {
          type: MSG.VICTORY,
          summary: {
            totalShardsCollected: room.world.totalShardsCollected,
            teamworkActions: room.world.teamworkActions,
            elapsedMs: nowMs - room.world.startedAt,
          },
        });
      }
    }
  }

  detachClient(client) {
    const ctx = this.getClientContext(client);
    if (!ctx) return;
    const { room, role, slot } = ctx;
    slot.connected = false;
    slot.client = null;
    slot.disconnectedAt = this.now();
    this.clientMeta.delete(client);

    this.broadcastRoom(room, {
      type: MSG.PARTNER_CONNECTION,
      role,
      connected: false,
      room: this.serializeRoom(room),
    });
  }

  disconnect(client) {
    this.detachClient(client);
  }
}
