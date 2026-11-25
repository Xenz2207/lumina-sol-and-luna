import { PHYSICS, INVULN_DURATION } from '../../shared/constants.js';
import { evaluateMovingPlatform } from '../../shared/levels.js';

export function createPlayerEntity(role, spawn) {
  return {
    role,
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    doubleJumpAvailable: true,
    boostLaunched: false,
    invulnTimer: 0,
    footstepTimer: 0,
    squashX: 1,
    squashY: 1,
    anim: 'idle',
    surfaceType: 'moss',
    ridingPlatformId: null,
    prevPlatformPos: null,
    scarfNodes: Array.from({ length: 10 }, (_, i) => ({ x: spawn.x - i * 4, y: spawn.y - 6 })),
  };
}

function getSolidRects(level, worldState, timeSec) {
  const solids = [];

  for (const p of level.platforms) {
    const oneWay = p.oneWay !== undefined ? Boolean(p.oneWay) : p.h <= 36 && p.y > 10;
    solids.push({ x: p.x, y: p.y, w: p.w, h: p.h, surface: p.kind || 'moss', id: p.id, oneWay });
  }

  for (const mp of level.movingPlatforms || []) {
    const pos = evaluateMovingPlatform(mp, timeSec);
    solids.push({ x: pos.x, y: pos.y, w: pos.w, h: pos.h, surface: 'crystal', id: mp.id, moving: true, oneWay: true });
  }

  for (const b of level.bridges || []) {
    if (worldState.litTotems.has(b.requiresTotemId)) {
      solids.push({ x: b.x, y: b.y, w: b.w, h: b.h, surface: 'bridge', id: b.id, oneWay: true });
    }
  }

  for (const g of level.gates || []) {
    if (!worldState.openedGates.has(g.id)) {
      solids.push({ x: g.x, y: g.y, w: g.w, h: g.h, surface: 'stone', id: g.id });
    }
  }

  for (const br of level.briars || []) {
    if (!worldState.burnedBriars.has(br.id)) {
      solids.push({ x: br.x, y: br.y, w: br.w, h: br.h, surface: 'stone', id: br.id });
    }
  }

  return solids;
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function findSafeRespawn(player, level, worldState, partner) {
  if (partner && !worldState.playersSpirit[partner.role] && partner.grounded) {
    return { x: partner.x, y: partner.y - 8 };
  }
  if (worldState.activeCheckpoint) {
    const cp = (level.checkpoints || []).find((c) => c.id === worldState.activeCheckpoint);
    if (cp) return { x: cp.x, y: cp.y - 38 };
  }
  return { ...level.spawns[player.role] };
}

/**
 * Advances local character physics and returns frame events for SFX/VFX/network.
 */
export function stepPlayerPhysics(player, input, level, worldState, partner, dt, timeSec) {
  const events = {
    jumped: false,
    doubleJumped: false,
    landed: false,
    landIntensity: 0,
    footstep: false,
    bouncedMushroomId: null,
    partnerBoosted: false,
    damaged: false,
    collectedShards: [],
    touchedCheckpoints: [],
    surfaceType: player.surfaceType,
  };

  player.squashX += (1 - player.squashX) * Math.min(1, dt * 14);
  player.squashY += (1 - player.squashY) * Math.min(1, dt * 14);
  if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt);

  const isSpirit = Boolean(worldState.playersSpirit[player.role]);
  const solids = getSolidRects(level, worldState, timeSec);

  // Carry along moving platform if standing on it
  if (player.grounded && player.ridingPlatformId && player.prevPlatformPos) {
    const currentPlat = solids.find((s) => s.id === player.ridingPlatformId);
    if (currentPlat) {
      player.x += currentPlat.x - player.prevPlatformPos.x;
      player.y += currentPlat.y - player.prevPlatformPos.y;
    }
  }

  // Spirit Wisp mode: float gently toward partner
  if (isSpirit) {
    const moveDirX = input.moveX;
    if (Math.abs(moveDirX) > 0.05) {
      player.vx = moveDirX * 220;
      player.facing = moveDirX < 0 ? -1 : 1;
    } else if (partner) {
      const dx = partner.x - player.x;
      player.vx = Math.abs(dx) > 12 ? Math.sign(dx) * 145 : 0;
      if (Math.abs(dx) > 4) player.facing = dx < 0 ? -1 : 1;
    }
    const targetY = partner ? partner.y - 14 : player.y;
    player.vy = (targetY - player.y) * 2.5 + Math.sin(timeSec * 4) * 35;
    player.x = Math.max(24, Math.min(level.width - 24, player.x + player.vx * dt));
    player.y = Math.max(40, Math.min(level.height - 60, player.y + player.vy * dt));
    player.grounded = false;
    player.anim = 'spirit';
    return events;
  }

  // Horizontal movement
  const targetVx = input.moveX * PHYSICS.MOVE_SPEED;
  if (Math.abs(input.moveX) > 0.05) {
    player.facing = input.moveX < 0 ? -1 : 1;
    const accel = player.grounded ? PHYSICS.ACCEL_GROUND : PHYSICS.ACCEL_AIR;
    if (player.vx < targetVx) {
      player.vx = Math.min(targetVx, player.vx + accel * dt);
    } else if (player.vx > targetVx) {
      player.vx = Math.max(targetVx, player.vx - accel * dt);
    }
  } else {
    const decel = player.grounded ? PHYSICS.DECEL_GROUND : PHYSICS.DECEL_AIR;
    if (player.vx > 0) player.vx = Math.max(0, player.vx - decel * dt);
    else if (player.vx < 0) player.vx = Math.min(0, player.vx + decel * dt);
  }

  // Coyote & Jump Buffer
  if (player.grounded) {
    player.coyoteTimer = PHYSICS.COYOTE_TIME;
    player.doubleJumpAvailable = true;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (input.jumpPressed) {
    player.jumpBufferTimer = PHYSICS.JUMP_BUFFER;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  if (player.jumpBufferTimer > 0) {
    if (player.coyoteTimer > 0) {
      player.vy = PHYSICS.JUMP_VEL;
      player.grounded = false;
      player.boostLaunched = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.squashX = 0.78;
      player.squashY = 1.26;
      events.jumped = true;
    } else if (player.doubleJumpAvailable) {
      player.vy = PHYSICS.DOUBLE_JUMP_VEL;
      player.doubleJumpAvailable = false;
      player.boostLaunched = false;
      player.jumpBufferTimer = 0;
      player.squashX = 0.8;
      player.squashY = 1.24;
      events.doubleJumped = true;
    }
  }

  // Variable jump cut (do not cut mushroom or partner boost arcs)
  if (!input.jumpHeld && !player.boostLaunched && player.vy < -180) {
    player.vy *= Math.pow(0.45, dt * 10);
  }

  // Gravity
  player.vy = Math.min(PHYSICS.MAX_FALL_SPEED, player.vy + PHYSICS.GRAVITY * dt);
  if (player.vy >= 0) {
    player.boostLaunched = false;
  }

  const halfW = PHYSICS.PLAYER_W * 0.5;
  const halfH = PHYSICS.PLAYER_H * 0.5;

  // Move X + resolve collisions (skip one-way shelves so jumping up never snags)
  player.x += player.vx * dt;
  player.x = Math.max(halfW, Math.min(level.width - halfW, player.x));

  for (const s of solids) {
    if (s.oneWay) continue;
    if (rectsOverlap(player.x - halfW, player.y - halfH + 4, PHYSICS.PLAYER_W, PHYSICS.PLAYER_H - 8, s.x, s.y, s.w, s.h)) {
      if (player.vx > 0) {
        player.x = s.x - halfW;
        player.vx = 0;
      } else if (player.vx < 0) {
        player.x = s.x + s.w + halfW;
        player.vx = 0;
      }
    }
  }

  // Move Y + resolve collisions (one-way platforms allow jumping straight up through)
  const wasGrounded = player.grounded;
  const preLandVy = player.vy;
  const prevY = player.y;
  player.y += player.vy * dt;
  player.grounded = false;
  player.ridingPlatformId = null;
  player.prevPlatformPos = null;

  for (const s of solids) {
    if (rectsOverlap(player.x - halfW + 2, player.y - halfH, PHYSICS.PLAYER_W - 4, PHYSICS.PLAYER_H, s.x, s.y, s.w, s.h)) {
      if (s.oneWay) {
        const prevFeet = prevY + halfH;
        const tolerance = s.moving ? 16 : 10;
        if (player.vy >= 0 && prevFeet <= s.y + tolerance) {
          player.y = s.y - halfH;
          player.vy = 0;
          player.grounded = true;
          player.boostLaunched = false;
          player.surfaceType = s.surface;
          events.surfaceType = s.surface;
          if (s.moving) {
            player.ridingPlatformId = s.id;
            player.prevPlatformPos = { x: s.x, y: s.y };
          }
        }
      } else if (player.vy >= 0) {
        player.y = s.y - halfH;
        player.vy = 0;
        player.grounded = true;
        player.boostLaunched = false;
        player.surfaceType = s.surface;
        events.surfaceType = s.surface;
      } else if (player.vy < 0) {
        player.y = s.y + s.h + halfH;
        player.vy = 0;
      }
    }
  }

  if (!wasGrounded && player.grounded && preLandVy > 150) {
    events.landed = true;
    events.landIntensity = Math.min(1, preLandVy / 650);
    player.squashX = 1.22;
    player.squashY = 0.78;
  }

  // Footstep cadence
  if (player.grounded && Math.abs(player.vx) > 45) {
    player.footstepTimer -= dt;
    if (player.footstepTimer <= 0) {
      player.footstepTimer = 0.27;
      events.footstep = true;
    }
  } else {
    player.footstepTimer = 0.08;
  }

  // Bouncy Mushrooms
  for (const m of level.mushrooms || []) {
    const dx = player.x - m.x;
    const dy = player.y + halfH - (m.y - 12);
    if (Math.abs(dx) < m.r + 12 && Math.abs(dy) < 24 && player.vy >= -120) {
      player.vy = PHYSICS.BOUNCE_VEL;
      player.grounded = false;
      player.doubleJumpAvailable = true;
      player.boostLaunched = true;
      player.squashX = 0.72;
      player.squashY = 1.32;
      events.bouncedMushroomId = m.id;
      break;
    }
  }

  // Partner Boost (jump/fall onto partner's glowing aura)
  if (partner && !worldState.playersSpirit[partner.role] && player.vy > 40) {
    const dx = Math.abs(player.x - partner.x);
    const feetY = player.y + halfH;
    const partnerHeadY = partner.y - halfH;
    if (dx < 34 && feetY >= partnerHeadY - 8 && feetY <= partnerHeadY + 26) {
      player.vy = PHYSICS.PARTNER_BOOST_VEL;
      player.grounded = false;
      player.doubleJumpAvailable = true;
      player.boostLaunched = true;
      player.squashX = 0.75;
      player.squashY = 1.3;
      events.partnerBoosted = true;
    }
  }

  // Spirit Shards pickup
  for (const shard of level.shards || []) {
    if (worldState.collectedShards.has(shard.id)) continue;
    if (Math.hypot(player.x - shard.x, player.y - shard.y) < 34) {
      events.collectedShards.push(shard.id);
    }
  }

  // Checkpoints
  for (const cp of level.checkpoints || []) {
    if (worldState.activeCheckpoint === cp.id) continue;
    if (Math.hypot(player.x - cp.x, player.y - (cp.y - 26)) < 46) {
      events.touchedCheckpoints.push(cp.id);
    }
  }

  // Enemy, Boss Orb & Abyss hazard checks
  if (player.invulnTimer <= 0) {
    let hitHazard = false;

    for (const h of level.hazards || []) {
      if (rectsOverlap(player.x - halfW, player.y - halfH, PHYSICS.PLAYER_W, PHYSICS.PLAYER_H, h.x, h.y, h.w, h.h)) {
        hitHazard = true;
        const safe = findSafeRespawn(player, level, worldState, partner);
        player.x = safe.x;
        player.y = safe.y;
        player.vx = 0;
        player.vy = 0;
        break;
      }
    }

    if (!hitHazard) {
      for (const e of worldState.enemies || []) {
        if (!e.alive || e.stunTimer > 0) continue;
        if (Math.hypot(player.x - e.x, player.y - e.y) < 30) {
          hitHazard = true;
          player.vy = -340;
          player.vx = (player.x < e.x ? -1 : 1) * 240;
          break;
        }
      }
    }

    if (!hitHazard) {
      for (const orb of worldState.bossProjectiles || []) {
        if (Math.hypot(player.x - orb.x, player.y - orb.y) < orb.radius + 16) {
          hitHazard = true;
          player.vy = -260;
          break;
        }
      }
    }

    if (hitHazard) {
      player.invulnTimer = INVULN_DURATION;
      events.damaged = true;
    }
  }

  // Animation tag
  if (!player.grounded) {
    player.anim = player.vy < 0 ? 'jump' : 'fall';
  } else if (Math.abs(player.vx) > 25) {
    player.anim = 'run';
  } else {
    player.anim = 'idle';
  }

  return events;
}

/**
 * Updates 10-node Verlet spirit scarf trailing gracefully behind each character.
 */
export function updateScarf(player, timeSec) {
  const nodes = player.scarfNodes;
  if (!nodes || nodes.length === 0) return;

  nodes[0].x = player.x - player.facing * 7;
  nodes[0].y = player.y - 7;

  const segLen = 5.2;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const wind = Math.sin(timeSec * 5.2 + i * 0.7) * 0.7 - player.facing * 1.1;
    curr.x += wind;
    curr.y += 1.4;

    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    if (dist > segLen) {
      curr.x = prev.x + (dx / dist) * segLen;
      curr.y = prev.y + (dy / dist) * segLen;
    }
  }
}

/**
 * Smart Solo Preview Mode AI companion controller.
 * Helps solve co-op puzzles (briars, crystals, totems), fights wisps/boss, and follows human.
 */
export function computeAiCompanionInput(ai, human, level, worldState, aiState, dt) {
  aiState.jumpCooldown = Math.max(0, (aiState.jumpCooldown || 0) - dt);
  aiState.castCooldown = Math.max(0, (aiState.castCooldown || 0) - dt);

  const aiPower = ai.role === 'sola' ? 'solar' : 'lunar';
  const out = {
    moveX: 0,
    jumpHeld: false,
    jumpPressed: false,
    powerPressed: false,
    harmonyPressed: false,
    emotePressed: false,
    switchPressed: false,
  };

  // Look for nearby matching puzzle target or combat target
  let targetX = human.x - human.facing * 68;
  let targetY = human.y;
  let shootTarget = null;

  // 1. Check unburned briars (SOLA)
  if (aiPower === 'solar') {
    for (const br of level.briars || []) {
      if (worldState.burnedBriars.has(br.id)) continue;
      if (Math.hypot(br.x - ai.x, br.y - ai.y) < 360) {
        shootTarget = { x: br.x + br.w * 0.5, y: br.y + br.h * 0.5 };
        targetX = br.x - 110;
        break;
      }
    }
  }

  // 2. Check unlit matching totems/crystals
  if (!shootTarget) {
    for (const t of level.totems || []) {
      if (t.kind !== aiPower) continue;
      if (t.bossTotem) {
        if (!worldState.boss?.shielded || worldState.boss.litShieldTotems.includes(t.id)) continue;
      } else if (worldState.litTotems.has(t.id)) {
        continue;
      }
      if (Math.hypot(t.x - ai.x, t.y - ai.y) < 420) {
        shootTarget = { x: t.x, y: t.y };
        targetX = t.x < ai.x ? t.x + 95 : t.x - 95;
        targetY = t.y;
        break;
      }
    }
  }

  // 3. Check nearby enemies or Boss
  if (!shootTarget) {
    for (const e of worldState.enemies || []) {
      if (!e.alive) continue;
      if (Math.hypot(e.x - ai.x, e.y - ai.y) < 320 && Math.abs(e.y - ai.y) < 90) {
        shootTarget = { x: e.x, y: e.y };
        break;
      }
    }
  }
  if (!shootTarget && worldState.boss && worldState.boss.alive && !worldState.boss.shielded) {
    if (Math.abs(worldState.boss.y - ai.y) < 160) {
      shootTarget = { x: worldState.boss.x, y: worldState.boss.y };
    }
  }

  // Heal human via Harmony if low HP and nearby
  if (
    (worldState.playersHealth[human.role] <= 2 || worldState.playersSpirit[human.role]) &&
    Math.hypot(ai.x - human.x, ai.y - human.y) < 175
  ) {
    out.harmonyPressed = true;
  }

  // If portal is open and human is near portal, follow into portal
  if (level.portal) {
    const portalReady = level.portal.requiresGateId
      ? worldState.openedGates.has(level.portal.requiresGateId)
      : level.portal.requiresBossDefeated
        ? Boolean(worldState.boss && !worldState.boss.alive)
        : false;
    if (portalReady && Math.hypot(human.x - level.portal.x, human.y - level.portal.y) < 180) {
      targetX = level.portal.x;
      targetY = level.portal.y;
    }
  }

  const dx = targetX - ai.x;
  if (Math.abs(dx) > 22) {
    out.moveX = Math.sign(dx) * 0.92;
  }

  // Jump up ledges or when stuck horizontally
  const dy = targetY - ai.y;
  if (aiState.jumpCooldown <= 0) {
    const stuckMoving = Math.abs(out.moveX) > 0.2 && Math.abs(ai.vx) < 24;
    if ((dy < -55 && Math.abs(dx) < 220) || stuckMoving) {
      out.jumpPressed = true;
      out.jumpHeld = true;
      aiState.jumpCooldown = ai.grounded ? 0.45 : 0.35;
    }
  }
  if (!ai.grounded && ai.vy < 0) {
    out.jumpHeld = true;
  }

  // Fire toward shootTarget if aligned
  if (shootTarget && aiState.castCooldown <= 0) {
    const aimDx = shootTarget.x - ai.x;
    const aimDy = Math.abs(shootTarget.y - ai.y);
    if (aimDy < 75 && Math.abs(aimDx) < 420) {
      ai.facing = aimDx < 0 ? -1 : 1;
      out.powerPressed = true;
      aiState.castCooldown = 0.68;
    } else if (aimDy >= 75 && shootTarget.y < ai.y && aiState.jumpCooldown <= 0) {
      out.jumpPressed = true;
      out.jumpHeld = true;
      aiState.jumpCooldown = 0.45;
    }
  }

  // Safety teleport if AI falls far behind across a large gap
  if (Math.hypot(ai.x - human.x, ai.y - human.y) > 760 && human.grounded) {
    ai.x = human.x - human.facing * 48;
    ai.y = human.y - 12;
    ai.vx = 0;
    ai.vy = 0;
  }

  return out;
}
