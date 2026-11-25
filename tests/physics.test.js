import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ACTS, evaluateMovingPlatform } from '../shared/levels.js';
import { PHYSICS } from '../shared/constants.js';
import { createWorldState } from '../shared/worldSimulation.js';
import { createPlayerEntity, stepPlayerPhysics } from '../public/js/physics.js';

const NO_INPUT = {
  moveX: 0,
  jumpHeld: false,
  jumpPressed: false,
  powerPressed: false,
  harmonyPressed: false,
  emotePressed: false,
  switchPressed: false,
};

describe('Platform & Mushroom Physics', () => {
  it('allows jumping straight up through one-way shelves and landing on top', () => {
    const level = ACTS[2]; // Stage 3
    const world = createWorldState(2, null, 0);
    // Spawn directly beneath s3-p3-mid (x: 3005..3115, y: 595, h: 26) standing on s3-p3 (y: 690)
    const p = createPlayerEntity('sola', { x: 3060, y: 690 - PHYSICS.PLAYER_H * 0.5 });
    p.grounded = true;

    // Jump upward without holding jump after first frame
    stepPlayerPhysics(p, { ...NO_INPUT, jumpPressed: true, jumpHeld: true }, level, world, null, 1 / 60, 0);
    assert.ok(p.vy < -500);

    let passedAboveShelf = false;
    let landedOnShelf = false;
    for (let i = 0; i < 90; i++) {
      stepPlayerPhysics(p, { ...NO_INPUT, jumpHeld: i < 20 }, level, world, null, 1 / 60, (i + 1) / 60);
      if (p.y + PHYSICS.PLAYER_H * 0.5 < 595) {
        passedAboveShelf = true;
      }
      if (passedAboveShelf && p.grounded && Math.abs(p.y + PHYSICS.PLAYER_H * 0.5 - 595) < 2) {
        landedOnShelf = true;
        break;
      }
    }

    assert.equal(passedAboveShelf, true, 'Player should jump cleanly through underside of one-way shelf');
    assert.equal(landedOnShelf, true, 'Player should land solidly on top of one-way shelf');
  });

  it('Stage 3 mushroom launch reaches top ledge s3-p3-hi even with jumpHeld=false', () => {
    const level = ACTS[2]; // Stage 3
    const world = createWorldState(2, null, 0);
    // mush-s3-2 is at (3175, 690) directly below s3-p3-hi (x: 3040..3240, y: 495)
    const p = createPlayerEntity('luna', { x: 3175, y: 690 - PHYSICS.PLAYER_H * 0.5 });
    p.vy = 10;

    let bounced = false;
    let landedUpper = false;
    for (let i = 0; i < 110; i++) {
      const ev = stepPlayerPhysics(p, NO_INPUT, level, world, null, 1 / 60, i / 60);
      if (ev.bouncedMushroomId === 'mush-s3-2') bounced = true;
      if (bounced && p.grounded && Math.abs(p.y + PHYSICS.PLAYER_H * 0.5 - 495) < 2) {
        landedUpper = true;
        break;
      }
    }

    assert.equal(bounced, true, 'Player should bounce on mush-s3-2');
    assert.equal(landedUpper, true, 'Player should clear s3-p3-hi (y=495) and land on top without holding jump');
  });

  it('rides vertical moving platforms smoothly without falling through one-way surfaces', () => {
    const level = ACTS[5]; // Stage 6 (Crystal Falls Cavern) has mp-2 vertical lift
    const world = createWorldState(5, null, 0);
    const mp = level.movingPlatforms.find((m) => m.id === 'mp-2');
    const t0 = 0;
    const pos0 = evaluateMovingPlatform(mp, t0);
    const p = createPlayerEntity('sola', { x: pos0.x + pos0.w * 0.5, y: pos0.y - PHYSICS.PLAYER_H * 0.5 });
    p.grounded = true;
    p.ridingPlatformId = mp.id;
    p.prevPlatformPos = { x: pos0.x, y: pos0.y };

    for (let i = 1; i <= 60; i++) {
      const t = i / 60;
      stepPlayerPhysics(p, NO_INPUT, level, world, null, 1 / 60, t);
      const pos = evaluateMovingPlatform(mp, t);
      assert.equal(p.grounded, true, `Frame ${i}: player should stay grounded on moving lift`);
      assert.ok(Math.abs(p.y + PHYSICS.PLAYER_H * 0.5 - pos.y) < 3, `Frame ${i}: player feet should track lift Y`);
    }
  });
});
