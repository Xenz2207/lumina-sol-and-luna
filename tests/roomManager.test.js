import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../server/roomManager.js';
import { ACTS } from '../shared/levels.js';
import { MSG, ROOM_CODE_ALPHABET } from '../shared/constants.js';
import {
  createWorldState,
  castPower,
  stepWorld,
  collectShard,
  triggerHarmony,
  recordDamage,
  isPortalUnlocked,
} from '../shared/worldSimulation.js';

function makeMockClient() {
  const inbox = [];
  return {
    inbox,
    last(type) {
      for (let i = inbox.length - 1; i >= 0; i--) {
        if (!type || inbox[i].type === type) return inbox[i];
      }
      return null;
    },
  };
}

describe('RoomManager', () => {
  it('creates rooms, joins Luna, rejects 3rd player, swaps roles, and reconnects via sessionToken', () => {
    let now = 10_000;
    const mgr = new RoomManager((client, msg) => client.inbox.push(msg), () => now);
    const c1 = makeMockClient();
    const c2 = makeMockClient();
    const c3 = makeMockClient();

    mgr.handleMessage(c1, { type: MSG.CREATE_ROOM, name: 'Alice' });
    const created = c1.last(MSG.ROOM_CREATED);
    assert.ok(created);
    assert.equal(created.code.length, 4);
    for (const ch of created.code) {
      assert.ok(ROOM_CODE_ALPHABET.includes(ch));
    }
    assert.equal(created.role, 'sola');

    mgr.handleMessage(c2, { type: MSG.JOIN_ROOM, code: created.code.toLowerCase(), name: 'Bob' });
    const joined = c2.last(MSG.ROOM_JOINED);
    assert.ok(joined);
    assert.equal(joined.role, 'luna');

    // Reject 3rd player when room is full
    mgr.handleMessage(c3, { type: MSG.JOIN_ROOM, code: created.code, name: 'Eve' });
    const err = c3.last(MSG.ROOM_ERROR);
    assert.ok(err);
    assert.match(err.error, /เต็ม/);

    // Swap roles in lobby
    mgr.handleMessage(c1, { type: MSG.SWAP_ROLES });
    assert.equal(c1.last(MSG.ROOM_STATE).yourRole, 'luna');
    assert.equal(c2.last(MSG.ROOM_STATE).yourRole, 'sola');

    // Start game & test reconnection via sessionToken
    mgr.handleMessage(c1, { type: MSG.START_GAME, actIndex: 0 });
    assert.ok(c1.last(MSG.GAME_STARTED));
    assert.ok(c2.last(MSG.GAME_STARTED));

    const savedToken = joined.sessionToken;
    mgr.disconnect(c2);
    const c2Reconnected = makeMockClient();
    mgr.handleMessage(c2Reconnected, {
      type: MSG.JOIN_ROOM,
      code: created.code,
      name: 'Bob',
      sessionToken: savedToken,
    });
    const rej = c2Reconnected.last(MSG.ROOM_JOINED);
    assert.ok(rej);
    assert.equal(rej.reconnected, true);
    assert.equal(rej.role, 'sola');
    assert.ok(rej.worldState);

    // Stage selection via SELECT_ACT
    mgr.handleMessage(c1, { type: MSG.SELECT_ACT, actIndex: 4 });
    const changed = c1.last(MSG.ACT_CHANGED);
    assert.ok(changed);
    assert.equal(changed.worldState.actIndex, 4);
  });
});

describe('Co-op WorldSimulation mechanics', () => {
  it('enforces Solar vs Briar and Lunar vs Moon Crystal bridge mechanics', () => {
    // Stage 2 (Act 1) has briar-1, totem-moon-1, bridge-1, gate-1
    const world = createWorldState(1, null, 0);
    const events = [];

    // Lunar wave should NOT burn briar-1 (x=1030..1078, y=540..720)
    castPower(world, 'luna', 980, 650, 1, 1);
    for (let i = 0; i < 12; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.burnedBriars.has('briar-1'), false);

    // Solar bolt SHOULD burn briar-1
    castPower(world, 'sola', 980, 650, 1, 2);
    for (let i = 0; i < 12; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.burnedBriars.has('briar-1'), true);
    assert.ok(events.some((e) => e.type === 'briar_burned' && e.briarId === 'briar-1'));

    // Solar bolt should NOT light Moon Crystal totem-moon-1 (x=1350, y=658)
    castPower(world, 'sola', 1290, 658, 1, 3);
    for (let i = 0; i < 12; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.litTotems.has('totem-moon-1'), false);

    // Lunar wave SHOULD light totem-moon-1 and activate bridge-1
    castPower(world, 'luna', 1290, 658, 1, 4);
    for (let i = 0; i < 12; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.litTotems.has('totem-moon-1'), true);
    assert.ok(events.some((e) => e.type === 'bridge_activated' && e.bridgeId === 'bridge-1'));

    // Dual Sun + Moon totems open gate-1
    castPower(world, 'sola', 2610, 672, 1, 5);
    castPower(world, 'luna', 2710, 475, 1, 5);
    for (let i = 0; i < 15; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.openedGates.has('gate-1'), true);
    assert.ok(events.some((e) => e.type === 'gate_opened' && e.gateId === 'gate-1'));
  });

  it('deduplicates shards, handles Harmony heal/revive, and defeats enemies', () => {
    const world = createWorldState(1, null, 0);
    const first = collectShard(world, 'sola', 'a0-s1');
    const dup = collectShard(world, 'luna', 'a0-s1');
    assert.ok(first);
    assert.equal(dup, null);
    assert.equal(world.totalShardsCollected, 1);

    // Damage luna down to spirit mode, then revive via Harmony when close
    for (let i = 0; i < 5; i++) recordDamage(world, 'luna', 1);
    assert.equal(world.playersSpirit.luna, true);
    world.playerPositions.sola = { x: 200, y: 690, vx: 0, vy: 0, facing: 1 };
    world.playerPositions.luna = { x: 500, y: 690, vx: 0, vy: 0, facing: 1 };
    const tooFar = triggerHarmony(world, 'sola', 10, false);
    assert.equal(tooFar.ok, false);
    assert.equal(tooFar.reason, 'too_far');

    world.playerPositions.luna.x = 260;
    const revived = triggerHarmony(world, 'sola', 10, false);
    assert.equal(revived.ok, true);
    assert.equal(world.playersSpirit.luna, false);
    assert.equal(world.playersHealth.luna, 3);

    // Enemy defeat
    const enemy = world.enemies[0];
    castPower(world, 'sola', enemy.x - 40, enemy.y, 1, 20);
    castPower(world, 'sola', enemy.x - 40, enemy.y, 1, 22);
    for (let i = 0; i < 20; i++) stepWorld(world, 0.05);
    assert.equal(enemy.alive, false);
  });

  it('Stage 5 Mini-Boss unlocks portal without premature Victory', () => {
    const world = createWorldState(4, null, 0);
    assert.ok(world.boss);
    assert.equal(world.boss.isMiniBoss, true);
    assert.equal(isPortalUnlocked(world), false);

    world.boss.hp = 10;
    castPower(world, 'sola', world.boss.x - 35, world.boss.y, 1, 2);
    for (let i = 0; i < 12; i++) stepWorld(world, 0.05);

    assert.equal(world.boss.alive, false);
    assert.equal(world.victory, false);
    assert.equal(isPortalUnlocked(world), true);
  });

  it('runs Stage 10 Final Boss 3-phase transitions, Eclipse Shield break, and Victory', () => {
    const world = createWorldState(9, null, 0);
    const events = [];
    assert.ok(world.boss);
    assert.equal(world.boss.phase, 1);
    assert.equal(world.boss.isMiniBoss, false);

    // Reduce boss HP below 66% to trigger Phase 2 + Eclipse Shield
    world.boss.hp = Math.round(world.boss.maxHp * 0.66) + 5;
    castPower(world, 'sola', world.boss.x - 40, world.boss.y, 1, 1);
    for (let i = 0; i < 12; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.boss.phase, 2);
    assert.equal(world.boss.shielded, true);
    assert.ok(events.some((e) => e.type === 'boss_shield_up'));

    // Ignite both boss totems (sun at 425,432 and moon at 1275,432) to shatter shield
    castPower(world, 'sola', 375, 432, 1, 5);
    castPower(world, 'luna', 1225, 432, 1, 5);
    for (let i = 0; i < 15; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.boss.shielded, false);
    assert.ok(world.boss.stunTimer > 0);
    assert.ok(events.some((e) => e.type === 'boss_shield_broken'));

    // Defeat final boss -> victory
    world.boss.hp = 10;
    castPower(world, 'sola', world.boss.x - 35, world.boss.y, 1, 10);
    for (let i = 0; i < 12; i++) stepWorld(world, 0.05, (e) => events.push(e));
    assert.equal(world.boss.alive, false);
    assert.equal(world.victory, true);
    assert.ok(events.some((e) => e.type === 'boss_defeated'));
  });
});

describe('Level integrity validation across all 10 Stages', () => {
  it('verifies spawn safety, hints/objectives, valid totem/gate references, and bounds', () => {
    assert.equal(ACTS.length, 10);
    for (const act of ACTS) {
      assert.ok(act.objective && act.objective.length > 5, `Stage ${act.id} missing objective`);
      assert.ok(Array.isArray(act.stageHints) && act.stageHints.length >= 3, `Stage ${act.id} needs >= 3 stageHints`);

      const totemIds = new Set((act.totems || []).map((t) => t.id));
      const gateIds = new Set((act.gates || []).map((g) => g.id));

      for (const role of ['sola', 'luna']) {
        const sp = act.spawns[role];
        assert.ok(sp.x >= 0 && sp.x <= act.width);
        assert.ok(sp.y >= 0 && sp.y <= act.height);
        const hasFloor = act.platforms.some(
          (p) => sp.x >= p.x && sp.x <= p.x + p.w && p.y >= sp.y && p.y - sp.y < 140
        );
        assert.ok(hasFloor, `Spawn ${role} in Stage ${act.stageNumber} lacks platform underneath`);
      }

      for (const b of act.bridges || []) {
        assert.ok(totemIds.has(b.requiresTotemId), `Missing totem ${b.requiresTotemId} for bridge ${b.id}`);
      }
      for (const g of act.gates || []) {
        for (const tid of g.requiresTotemIds) {
          assert.ok(totemIds.has(tid), `Missing totem ${tid} for gate ${g.id}`);
        }
      }
      if (act.portal?.requiresGateId) {
        assert.ok(gateIds.has(act.portal.requiresGateId), `Missing gate ${act.portal.requiresGateId}`);
      }
      for (const s of act.shards || []) {
        assert.ok(s.x > 0 && s.x < act.width && s.y > 0 && s.y < act.height, `Shard ${s.id} out of bounds`);
      }
    }
  });
});
