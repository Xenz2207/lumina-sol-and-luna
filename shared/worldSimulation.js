import { ACTS } from './levels.js';
import { POWERS, PLAYER_MAX_HP, PHYSICS } from './constants.js';

function circleHitsRect(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= cr * cr;
}

function circleHitsPoint(cx, cy, cr, px, py, pr) {
  const dx = cx - px;
  const dy = cy - py;
  const sum = cr + pr;
  return dx * dx + dy * dy <= sum * sum;
}

/**
 * Creates a fresh authoritative world state for a given Act index.
 */
export function createWorldState(actIndex = 0, stats = null, nowMs = Date.now()) {
  const clampedIndex = Math.max(0, Math.min(actIndex, ACTS.length - 1));
  const level = ACTS[clampedIndex];

  const enemies = (level.enemies || []).map((e) => ({
    id: e.id,
    x: e.x,
    y: e.y,
    vx: 68,
    patrolMinX: e.patrolMinX,
    patrolMaxX: e.patrolMaxX,
    affinity: e.affinity,
    hp: e.hp,
    maxHp: e.hp,
    alive: true,
    stunTimer: 0,
  }));

  let boss = null;
  if (level.boss) {
    const thresholds = Array.isArray(level.boss.shieldThresholds)
      ? [...level.boss.shieldThresholds]
      : [0.66, 0.33];
    boss = {
      name: level.boss.name,
      thaiName: level.boss.thaiName,
      style: level.boss.style || 'moth',
      isMiniBoss: Boolean(level.boss.isMiniBoss),
      shieldThresholds: thresholds,
      triggeredShields: [],
      x: level.boss.x,
      y: level.boss.y,
      homeX: level.boss.x,
      homeY: level.boss.y,
      hp: level.boss.maxHp,
      maxHp: level.boss.maxHp,
      phase: 1,
      weakness: 'solar',
      weaknessTimer: 7.5,
      attackTimer: 2.2,
      shielded: false,
      shieldTimer: 0,
      stunTimer: 0,
      litShieldTotems: [],
      sunTotemId: level.boss.sunTotemId,
      moonTotemId: level.boss.moonTotemId,
      alive: true,
      angle: 0,
    };
  }

  return {
    actIndex: clampedIndex,
    startedAt: stats?.startedAt ?? nowMs,
    actStartedAt: nowMs,
    totalShardsCollected: stats?.totalShardsCollected ?? 0,
    teamworkActions: stats?.teamworkActions ?? 0,
    activeCheckpoint: null,
    burnedBriars: new Set(),
    litTotems: new Set(),
    openedGates: new Set(),
    collectedShards: new Set(),
    playersHealth: {
      sola: PLAYER_MAX_HP,
      luna: PLAYER_MAX_HP,
    },
    playersSpirit: {
      sola: false,
      luna: false,
    },
    playerPositions: {
      sola: { ...level.spawns.sola, vx: 0, vy: 0, facing: 1 },
      luna: { ...level.spawns.luna, vx: 0, vy: 0, facing: 1 },
    },
    cooldowns: {
      sola: 0,
      luna: 0,
      harmony: 0,
    },
    nextProjId: 1,
    projectiles: [],
    bossProjectiles: [],
    enemies,
    boss,
    playersAtPortal: new Set(),
    victory: false,
  };
}

export function serializeWorldState(world, serverTimeMs = Date.now()) {
  return {
    actIndex: world.actIndex,
    serverTime: serverTimeMs / 1000,
    startedAt: world.startedAt,
    totalShardsCollected: world.totalShardsCollected,
    teamworkActions: world.teamworkActions,
    activeCheckpoint: world.activeCheckpoint,
    burnedBriars: [...world.burnedBriars],
    litTotems: [...world.litTotems],
    openedGates: [...world.openedGates],
    collectedShards: [...world.collectedShards],
    playersHealth: { ...world.playersHealth },
    playersSpirit: { ...world.playersSpirit },
    playerPositions: {
      sola: { ...world.playerPositions.sola },
      luna: { ...world.playerPositions.luna },
    },
    enemies: world.enemies.map((e) => ({ ...e })),
    boss: world.boss
      ? {
          ...world.boss,
          litShieldTotems: [...world.boss.litShieldTotems],
        }
      : null,
    projectiles: world.projectiles.map((p) => ({ ...p })),
    bossProjectiles: world.bossProjectiles.map((p) => ({ ...p })),
    victory: world.victory,
  };
}

export function serializeWorldTick(world, serverTimeMs = Date.now()) {
  return {
    actIndex: world.actIndex,
    serverTime: serverTimeMs / 1000,
    totalShardsCollected: world.totalShardsCollected,
    teamworkActions: world.teamworkActions,
    playersHealth: { ...world.playersHealth },
    playersSpirit: { ...world.playersSpirit },
    enemies: world.enemies.map((e) => ({
      id: e.id,
      x: Math.round(e.x * 10) / 10,
      y: Math.round(e.y * 10) / 10,
      vx: Math.round(e.vx),
      hp: e.hp,
      alive: e.alive,
      stunTimer: e.stunTimer,
    })),
    boss: world.boss
      ? {
          x: Math.round(world.boss.x * 10) / 10,
          y: Math.round(world.boss.y * 10) / 10,
          hp: world.boss.hp,
          maxHp: world.boss.maxHp,
          phase: world.boss.phase,
          weakness: world.boss.weakness,
          shielded: world.boss.shielded,
          shieldTimer: Math.max(0, Math.round(world.boss.shieldTimer * 10) / 10),
          stunTimer: Math.max(0, Math.round(world.boss.stunTimer * 10) / 10),
          litShieldTotems: [...world.boss.litShieldTotems],
          alive: world.boss.alive,
        }
      : null,
    projectiles: world.projectiles.map((p) => ({
      id: p.id,
      role: p.role,
      power: p.power,
      x: Math.round(p.x * 10) / 10,
      y: Math.round(p.y * 10) / 10,
      vx: p.vx,
      vy: p.vy,
      radius: p.radius,
      life: p.life,
    })),
    bossProjectiles: world.bossProjectiles.map((p) => ({
      id: p.id,
      x: Math.round(p.x * 10) / 10,
      y: Math.round(p.y * 10) / 10,
      vx: p.vx,
      vy: p.vy,
      radius: p.radius,
      life: p.life,
    })),
  };
}

export function castPower(world, role, x, y, dir, nowSec) {
  if (role !== 'sola' && role !== 'luna') return null;
  if (world.playersSpirit[role]) return null;
  const cd = role === 'sola' ? POWERS.SOLAR_COOLDOWN : POWERS.LUNAR_COOLDOWN;
  if (nowSec < (world.cooldowns[role] || 0)) return null;

  world.cooldowns[role] = nowSec + cd;
  const power = role === 'sola' ? 'solar' : 'lunar';
  const speed = role === 'sola' ? POWERS.SOLAR_SPEED : POWERS.LUNAR_SPEED;
  const life = role === 'sola' ? POWERS.SOLAR_LIFETIME : POWERS.LUNAR_LIFETIME;
  const radius = role === 'sola' ? POWERS.SOLAR_RADIUS : POWERS.LUNAR_RADIUS;
  const cleanDir = dir < 0 ? -1 : 1;

  const proj = {
    id: world.nextProjId++,
    role,
    power,
    x: x + cleanDir * 20,
    y: y - 4,
    vx: cleanDir * speed,
    vy: 0,
    radius,
    life,
    maxLife: life,
  };
  world.projectiles.push(proj);
  return proj;
}

export function triggerHarmony(world, callerRole, nowSec, allowSolo = false) {
  if (nowSec < (world.cooldowns.harmony || 0)) {
    return { ok: false, reason: 'cooldown' };
  }
  const solaPos = world.playerPositions.sola;
  const lunaPos = world.playerPositions.luna;
  const dist = Math.hypot(solaPos.x - lunaPos.x, solaPos.y - lunaPos.y);

  if (!allowSolo && dist > POWERS.HARMONY_RADIUS) {
    return { ok: false, reason: 'too_far', dist };
  }

  world.cooldowns.harmony = nowSec + POWERS.HARMONY_COOLDOWN;
  const revived = [];
  for (const r of ['sola', 'luna']) {
    if (world.playersSpirit[r]) {
      world.playersSpirit[r] = false;
      world.playersHealth[r] = 3;
      revived.push(r);
    } else {
      world.playersHealth[r] = Math.min(PLAYER_MAX_HP, world.playersHealth[r] + 1);
    }
  }
  world.teamworkActions += 1;

  return {
    ok: true,
    callerRole,
    revived,
    x: (solaPos.x + lunaPos.x) * 0.5,
    y: (solaPos.y + lunaPos.y) * 0.5,
    playersHealth: { ...world.playersHealth },
    playersSpirit: { ...world.playersSpirit },
    teamworkActions: world.teamworkActions,
  };
}

export function collectShard(world, role, shardId) {
  const level = ACTS[world.actIndex];
  const shard = (level.shards || []).find((s) => s.id === shardId);
  if (!shard || world.collectedShards.has(shardId)) return null;

  world.collectedShards.add(shardId);
  world.totalShardsCollected += 1;
  return {
    type: 'shard_collected',
    shardId,
    role,
    x: shard.x,
    y: shard.y,
    totalShardsCollected: world.totalShardsCollected,
  };
}

export function touchCheckpoint(world, role, checkpointId) {
  const level = ACTS[world.actIndex];
  const cp = (level.checkpoints || []).find((c) => c.id === checkpointId);
  if (!cp || world.activeCheckpoint === checkpointId) return null;

  world.activeCheckpoint = checkpointId;
  for (const r of ['sola', 'luna']) {
    if (world.playersSpirit[r]) {
      world.playersSpirit[r] = false;
      world.playersHealth[r] = 3;
    } else if (world.playersHealth[r] < PLAYER_MAX_HP) {
      world.playersHealth[r] = Math.min(PLAYER_MAX_HP, world.playersHealth[r] + 1);
    }
  }
  return {
    type: 'checkpoint_lit',
    checkpointId,
    role,
    x: cp.x,
    y: cp.y,
    playersHealth: { ...world.playersHealth },
    playersSpirit: { ...world.playersSpirit },
  };
}

export function recordDamage(world, role, amount = 1) {
  if (role !== 'sola' && role !== 'luna') return null;
  if (world.playersSpirit[role]) return null;

  world.playersHealth[role] = Math.max(0, world.playersHealth[role] - amount);
  if (world.playersHealth[role] <= 0) {
    world.playersSpirit[role] = true;
  }
  return {
    type: 'player_damaged',
    role,
    hp: world.playersHealth[role],
    spirit: world.playersSpirit[role],
    playersHealth: { ...world.playersHealth },
    playersSpirit: { ...world.playersSpirit },
  };
}

export function checkPartnerReviveOverlap(world) {
  const events = [];
  const sola = world.playerPositions.sola;
  const luna = world.playerPositions.luna;
  const dist = Math.hypot(sola.x - luna.x, sola.y - luna.y);
  if (dist > 52) return events;

  if (world.playersSpirit.sola && !world.playersSpirit.luna) {
    world.playersSpirit.sola = false;
    world.playersHealth.sola = 3;
    world.teamworkActions += 1;
    events.push({
      type: 'player_revived',
      role: 'sola',
      by: 'luna',
      x: sola.x,
      y: sola.y,
      playersHealth: { ...world.playersHealth },
      playersSpirit: { ...world.playersSpirit },
    });
  } else if (world.playersSpirit.luna && !world.playersSpirit.sola) {
    world.playersSpirit.luna = false;
    world.playersHealth.luna = 3;
    world.teamworkActions += 1;
    events.push({
      type: 'player_revived',
      role: 'luna',
      by: 'sola',
      x: luna.x,
      y: luna.y,
      playersHealth: { ...world.playersHealth },
      playersSpirit: { ...world.playersSpirit },
    });
  }
  return events;
}

function emitGateAndBridgeEvents(world, level, totem, emit) {
  for (const bridge of level.bridges || []) {
    if (bridge.requiresTotemId === totem.id) {
      emit({
        type: 'bridge_activated',
        bridgeId: bridge.id,
        totemId: totem.id,
        x: bridge.x + bridge.w * 0.5,
        y: bridge.y,
      });
    }
  }
  for (const gate of level.gates || []) {
    if (world.openedGates.has(gate.id)) continue;
    if (gate.requiresTotemIds.every((tid) => world.litTotems.has(tid))) {
      world.openedGates.add(gate.id);
      world.teamworkActions += 1;
      emit({
        type: 'gate_opened',
        gateId: gate.id,
        x: gate.x + gate.w * 0.5,
        y: gate.y + gate.h * 0.5,
        teamworkActions: world.teamworkActions,
      });
    }
  }
  if (totem.linksTo === 'blessing') {
    for (const r of ['sola', 'luna']) {
      world.playersSpirit[r] = false;
      world.playersHealth[r] = Math.min(PLAYER_MAX_HP, world.playersHealth[r] + 1);
    }
    emit({
      type: 'blessing_granted',
      totemId: totem.id,
      x: totem.x,
      y: totem.y,
      playersHealth: { ...world.playersHealth },
      playersSpirit: { ...world.playersSpirit },
    });
  }
}

function stepBoss(world, level, dt, emit) {
  const boss = world.boss;
  if (!boss || !boss.alive) return;

  boss.angle += dt;

  // Step active boss orbs
  const remainingOrbs = [];
  for (const orb of world.bossProjectiles) {
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;
    orb.life -= dt;
    if (orb.life > 0 && orb.x > -60 && orb.x < level.width + 60 && orb.y > -60 && orb.y < level.height + 60) {
      remainingOrbs.push(orb);
    }
  }
  world.bossProjectiles = remainingOrbs;

  if (boss.stunTimer > 0) {
    boss.stunTimer = Math.max(0, boss.stunTimer - dt);
    boss.y = boss.homeY + 135 + Math.sin(boss.angle * 9) * 8;
    return;
  }

  if (boss.shielded) {
    boss.x += (boss.homeX - boss.x) * Math.min(1, dt * 3);
    boss.y += (245 - boss.y) * Math.min(1, dt * 3);
    boss.shieldTimer -= dt;
    if (boss.shieldTimer <= 0) {
      boss.shielded = false;
      boss.litShieldTotems = [];
      boss.hp = Math.min(boss.maxHp, boss.hp + 15);
      // Radial warning pulse when timeout lapses so battle keeps flowing
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + 0.25;
        world.bossProjectiles.push({
          id: world.nextProjId++,
          x: boss.x,
          y: boss.y,
          vx: Math.cos(a) * 240,
          vy: Math.sin(a) * 240,
          radius: 13,
          life: 3.4,
        });
      }
      emit({ type: 'boss_attack', style: 'radial', x: boss.x, y: boss.y });
    }
    return;
  }

  // Smooth sweeping flight across sanctuary
  const speedScale = boss.phase === 3 ? 1.35 : boss.phase === 2 ? 1.15 : 1.0;
  const targetX = boss.homeX + Math.sin(boss.angle * 0.72 * speedScale) * 430;
  const targetY = boss.homeY + Math.sin(boss.angle * 1.45 * speedScale) * 95;
  boss.x += (targetX - boss.x) * Math.min(1, dt * 3.5);
  boss.y += (targetY - boss.y) * Math.min(1, dt * 3.5);

  boss.weaknessTimer -= dt;
  if (boss.weaknessTimer <= 0) {
    boss.weakness = boss.weakness === 'solar' ? 'lunar' : 'solar';
    boss.weaknessTimer = boss.phase === 3 ? 5.5 : 7.5;
    emit({ type: 'boss_weakness', weakness: boss.weakness, x: boss.x, y: boss.y });
  }

  boss.attackTimer -= dt;
  if (boss.attackTimer <= 0) {
    boss.attackTimer = boss.phase === 3 ? 1.85 : boss.phase === 2 ? 2.25 : 2.75;
    const targets = ['sola', 'luna'].map((r) => world.playerPositions[r]);
    const target = targets[Math.floor(boss.angle * 10) % targets.length];
    const baseAngle = Math.atan2(target.y - boss.y, target.x - boss.x);
    const fan = boss.phase === 3 ? [-0.26, 0, 0.26] : [-0.15, 0.15];
    const speed = boss.phase === 3 ? 310 : 255;

    for (const offset of fan) {
      const a = baseAngle + offset;
      world.bossProjectiles.push({
        id: world.nextProjId++,
        x: boss.x,
        y: boss.y + 18,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        radius: 13,
        life: 3.6,
      });
    }
    emit({ type: 'boss_attack', style: 'fan', x: boss.x, y: boss.y });
  }
}

/**
 * Advances projectiles, puzzle reactions, enemies, and boss state by `dt` seconds.
 */
export function stepWorld(world, dt, onEvent) {
  const level = ACTS[world.actIndex];
  const emit = (ev) => {
    if (onEvent) onEvent(ev);
  };

  // 1. Step patrolling enemies
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (enemy.stunTimer > 0) {
      enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      continue;
    }
    enemy.x += enemy.vx * dt;
    if (enemy.x <= enemy.patrolMinX) {
      enemy.x = enemy.patrolMinX;
      enemy.vx = Math.abs(enemy.vx);
    } else if (enemy.x >= enemy.patrolMaxX) {
      enemy.x = enemy.patrolMaxX;
      enemy.vx = -Math.abs(enemy.vx);
    }
  }

  // 2. Step projectiles and resolve collisions
  const activeProjectiles = [];
  for (const proj of world.projectiles) {
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;
    if (proj.life <= 0) continue;

    let consumed = false;

    // Shadow Briars
    for (const briar of level.briars || []) {
      if (world.burnedBriars.has(briar.id)) continue;
      if (circleHitsRect(proj.x, proj.y, proj.radius, briar.x, briar.y, briar.w, briar.h)) {
        consumed = true;
        if (proj.power === 'solar') {
          world.burnedBriars.add(briar.id);
          world.teamworkActions += 1;
          emit({
            type: 'briar_burned',
            briarId: briar.id,
            x: briar.x + briar.w * 0.5,
            y: briar.y + briar.h * 0.5,
            teamworkActions: world.teamworkActions,
          });
        } else {
          emit({ type: 'projectile_impact', power: proj.power, x: proj.x, y: proj.y, resisted: true });
        }
        break;
      }
    }
    if (consumed) continue;

    // Totems & Moon Crystals
    for (const totem of level.totems || []) {
      if (circleHitsPoint(proj.x, proj.y, proj.radius, totem.x, totem.y, 26)) {
        if (totem.bossTotem) {
          if (world.boss && world.boss.alive && world.boss.shielded && proj.power === totem.kind) {
            consumed = true;
            if (!world.boss.litShieldTotems.includes(totem.id)) {
              world.boss.litShieldTotems.push(totem.id);
              emit({ type: 'totem_lit', totemId: totem.id, kind: totem.kind, x: totem.x, y: totem.y, bossTotem: true });
              if (
                world.boss.litShieldTotems.includes(world.boss.sunTotemId) &&
                world.boss.litShieldTotems.includes(world.boss.moonTotemId)
              ) {
                world.boss.shielded = false;
                world.boss.litShieldTotems = [];
                world.boss.stunTimer = 4.5;
                world.boss.hp = Math.max(1, world.boss.hp - 28);
                world.teamworkActions += 1;
                emit({
                  type: 'boss_shield_broken',
                  x: world.boss.x,
                  y: world.boss.y,
                  hp: world.boss.hp,
                  teamworkActions: world.teamworkActions,
                });
              }
            }
          }
        } else if (proj.power === totem.kind && !world.litTotems.has(totem.id)) {
          consumed = true;
          world.litTotems.add(totem.id);
          world.teamworkActions += 1;
          emit({
            type: 'totem_lit',
            totemId: totem.id,
            kind: totem.kind,
            x: totem.x,
            y: totem.y,
            teamworkActions: world.teamworkActions,
          });
          emitGateAndBridgeEvents(world, level, totem, emit);
        }
        if (consumed) break;
      }
    }
    if (consumed) continue;

    // Enemies
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      if (circleHitsPoint(proj.x, proj.y, proj.radius, enemy.x, enemy.y, 24)) {
        consumed = true;
        const baseDmg = proj.power === 'solar' ? POWERS.SOLAR_DAMAGE : POWERS.LUNAR_DAMAGE;
        const mult = enemy.affinity === 'any' || enemy.affinity === proj.power ? 1.45 : 0.65;
        const dmg = Math.round(baseDmg * mult);
        enemy.hp = Math.max(0, enemy.hp - dmg);
        if (proj.power === 'lunar') {
          enemy.stunTimer = 0.65;
        }
        if (enemy.hp <= 0) {
          enemy.alive = false;
          emit({ type: 'enemy_defeated', enemyId: enemy.id, x: enemy.x, y: enemy.y, power: proj.power });
        } else {
          emit({ type: 'enemy_hit', enemyId: enemy.id, x: enemy.x, y: enemy.y, hp: enemy.hp, power: proj.power });
        }
        break;
      }
    }
    if (consumed) continue;

    // Boss
    if (world.boss && world.boss.alive) {
      if (circleHitsPoint(proj.x, proj.y, proj.radius, world.boss.x, world.boss.y, 54)) {
        consumed = true;
        const boss = world.boss;
        if (boss.shielded) {
          emit({ type: 'boss_shield_deflect', x: proj.x, y: proj.y });
        } else {
          const baseDmg = proj.power === 'solar' ? POWERS.SOLAR_DAMAGE : POWERS.LUNAR_DAMAGE;
          const mult = boss.stunTimer > 0 ? 1.65 : boss.weakness === proj.power ? 1.45 : 0.65;
          const dmg = Math.round(baseDmg * mult);
          boss.hp = Math.max(0, boss.hp - dmg);
          emit({
            type: 'boss_hit',
            x: proj.x,
            y: proj.y,
            hp: boss.hp,
            dmg,
            weakHit: boss.weakness === proj.power || boss.stunTimer > 0,
          });

          if (boss.hp <= 0) {
            boss.alive = false;
            boss.shielded = false;
            world.bossProjectiles = [];
            if (!boss.isMiniBoss && world.actIndex === ACTS.length - 1) {
              world.victory = true;
            }
            emit({
              type: 'boss_defeated',
              x: boss.x,
              y: boss.y,
              isMiniBoss: Boolean(boss.isMiniBoss),
            });
          } else {
            const hpRatio = boss.hp / boss.maxHp;
            const thresholds = boss.shieldThresholds || [0.66, 0.33];
            for (let i = 0; i < thresholds.length; i++) {
              const thresh = thresholds[i];
              if (hpRatio <= thresh && !boss.triggeredShields.includes(i)) {
                boss.triggeredShields.push(i);
                boss.phase = i + 2;
                boss.shielded = true;
                boss.shieldTimer = 14;
                boss.litShieldTotems = [];
                emit({ type: 'boss_phase', phase: boss.phase, x: boss.x, y: boss.y });
                emit({ type: 'boss_shield_up', x: boss.x, y: boss.y });
                break;
              }
            }
          }
        }
      }
    }
    if (consumed) continue;

    // Solid platforms & closed gates stop projectiles
    let hitWall = false;
    for (const p of level.platforms) {
      if (circleHitsRect(proj.x, proj.y, proj.radius * 0.6, p.x, p.y, p.w, p.h)) {
        hitWall = true;
        break;
      }
    }
    if (!hitWall) {
      for (const gate of level.gates || []) {
        if (world.openedGates.has(gate.id)) continue;
        if (circleHitsRect(proj.x, proj.y, proj.radius * 0.6, gate.x, gate.y, gate.w, gate.h)) {
          hitWall = true;
          break;
        }
      }
    }
    if (hitWall) {
      emit({ type: 'projectile_impact', power: proj.power, x: proj.x, y: proj.y, resisted: false });
      continue;
    }

    activeProjectiles.push(proj);
  }
  world.projectiles = activeProjectiles;

  // 3. Step boss AI
  stepBoss(world, level, dt, emit);
}

export function isPortalUnlocked(world) {
  const level = ACTS[world.actIndex];
  if (!level.portal) return false;
  if (level.portal.requiresGateId) {
    return world.openedGates.has(level.portal.requiresGateId);
  }
  if (level.portal.requiresBossDefeated) {
    return world.boss ? !world.boss.alive : true;
  }
  return true;
}
