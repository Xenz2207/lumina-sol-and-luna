import { ROLES, POWERS } from '../../shared/constants.js';
import { evaluateMovingPlatform } from '../../shared/levels.js';

const BIOME_PALETTES = {
  forest: {
    skyTop: '#050E18',
    skyMid: '#0B2334',
    skyBot: '#133C4B',
    aurora1: 'rgba(60, 230, 181, 0.16)',
    aurora2: 'rgba(110, 231, 255, 0.12)',
    farTree: '#081824',
    midTree: '#0B2231',
    ambientDark: 'rgba(5, 13, 24, 0.42)',
    mossTop: '#24B48C',
    mossGlow: '#3CE6B5',
    rockFill: '#0F2230',
    rockStroke: '#1D3E52',
  },
  canopy: {
    skyTop: '#071422',
    skyMid: '#123142',
    skyBot: '#29505C',
    aurora1: 'rgba(255, 198, 92, 0.15)',
    aurora2: 'rgba(60, 230, 181, 0.16)',
    farTree: '#0B202C',
    midTree: '#102C39',
    ambientDark: 'rgba(7, 17, 28, 0.36)',
    mossTop: '#34C98E',
    mossGlow: '#7BF5C2',
    rockFill: '#122937',
    rockStroke: '#295266',
  },
  cavern: {
    skyTop: '#040916',
    skyMid: '#091A33',
    skyBot: '#122E4D',
    aurora1: 'rgba(110, 231, 255, 0.15)',
    aurora2: 'rgba(155, 114, 255, 0.14)',
    farTree: '#061224',
    midTree: '#0A1C35',
    ambientDark: 'rgba(4, 9, 22, 0.56)',
    mossTop: '#31B8E8',
    mossGlow: '#6EE7FF',
    rockFill: '#0E1C33',
    rockStroke: '#25426B',
  },
  abyss: {
    skyTop: '#070615',
    skyMid: '#151232',
    skyBot: '#261C4E',
    aurora1: 'rgba(192, 132, 252, 0.16)',
    aurora2: 'rgba(110, 231, 255, 0.14)',
    farTree: '#0E0B22',
    midTree: '#161133',
    ambientDark: 'rgba(6, 5, 20, 0.5)',
    mossTop: '#A855F7',
    mossGlow: '#D8B4FE',
    rockFill: '#161330',
    rockStroke: '#3D316E',
  },
  sanctuary: {
    skyTop: '#09091A',
    skyMid: '#181838',
    skyBot: '#292149',
    aurora1: 'rgba(255, 179, 71, 0.15)',
    aurora2: 'rgba(110, 231, 255, 0.14)',
    farTree: '#111026',
    midTree: '#191736',
    ambientDark: 'rgba(8, 8, 22, 0.45)',
    mossTop: '#D99E46',
    mossGlow: '#FFD98E',
    rockFill: '#1B1A34',
    rockStroke: '#3B3766',
  },
};

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');

    this.viewW = 1280;
    this.viewH = 720;
    this.dpr = 1;

    this.camX = 0;
    this.camY = 0;
    this.shake = 0;
    this.mushroomBounce = new Map();
    this.stars = Array.from({ length: 85 }, (_, i) => ({
      x: ((i * 197) % 1000) / 1000,
      y: ((i * 313) % 580) / 1000,
      r: 0.9 + (i % 3) * 0.7,
      phase: i * 0.85,
    }));
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.canvas.width = Math.floor(this.viewW * this.dpr);
    this.canvas.height = Math.floor(this.viewH * this.dpr);
    this.canvas.style.width = `${this.viewW}px`;
    this.canvas.style.height = `${this.viewH}px`;

    const lightScale = 0.35;
    this.lightCanvas.width = Math.max(64, Math.floor(this.viewW * lightScale));
    this.lightCanvas.height = Math.max(64, Math.floor(this.viewH * lightScale));
  }

  addShake(amount) {
    this.shake = Math.min(20, this.shake + amount);
  }

  triggerMushroomBounce(id) {
    this.mushroomBounce.set(id, 1.0);
  }

  updateCamera(targetX, targetY, facing, level, dt, instant = false) {
    const scale = this.getCameraScale();
    const worldViewW = this.viewW / scale;
    const worldViewH = this.viewH / scale;

    const desiredX = targetX + facing * 65 - worldViewW * 0.48;
    const desiredY = targetY - worldViewH * 0.56;
    const clampedX = Math.max(0, Math.min(Math.max(0, level.width - worldViewW), desiredX));
    const clampedY = Math.max(0, Math.min(Math.max(0, level.height - worldViewH), desiredY));

    if (instant) {
      this.camX = clampedX;
      this.camY = clampedY;
    } else {
      const alpha = Math.min(1, dt * 6.5);
      this.camX += (clampedX - this.camX) * alpha;
      this.camY += (clampedY - this.camY) * alpha;
    }

    this.shake = Math.max(0, this.shake - dt * 36);
    for (const [id, val] of this.mushroomBounce.entries()) {
      const next = val - dt * 3.8;
      if (next <= 0) this.mushroomBounce.delete(id);
      else this.mushroomBounce.set(id, next);
    }
  }

  getCameraScale() {
    // Keep roughly 660-760 world height visible on both phones and desktops
    return Math.max(0.62, Math.min(1.18, this.viewH / 700));
  }

  render(scene) {
    const { level, worldState, players, localRole, particles, timeSec, emotes } = scene;
    const ctx = this.ctx;
    const pal = BIOME_PALETTES[level.biome] || BIOME_PALETTES.forest;
    const scale = this.getCameraScale();

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // 1. Sky, Moon, Stars & Aurora Borealis
    this.drawSkyAndAurora(ctx, pal, timeSec);

    // 2. Parallax Forest/Cavern silhouettes & volumetric rays
    this.drawParallaxBackdrop(ctx, pal, level.biome, timeSec);

    // World space transform
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-this.camX + shakeX, -this.camY + shakeY);

    const worldViewW = this.viewW / scale;
    const worldViewH = this.viewH / scale;

    // 3. Waterfalls
    for (const wf of level.waterfalls || []) {
      this.drawWaterfall(ctx, wf, timeSec);
    }

    // 4. Platforms, Moving Platforms, Bridges, Gates, Briars
    for (const p of level.platforms) {
      this.drawPlatform(ctx, p, pal, timeSec);
    }
    for (const mp of level.movingPlatforms || []) {
      const pos = evaluateMovingPlatform(mp, timeSec);
      this.drawMovingPlatform(ctx, pos, timeSec);
    }
    for (const b of level.bridges || []) {
      const active = worldState.litTotems.has(b.requiresTotemId);
      this.drawSpiritBridge(ctx, b, active, timeSec);
    }
    for (const g of level.gates || []) {
      this.drawAncientGate(ctx, g, worldState, timeSec);
    }
    for (const br of level.briars || []) {
      if (!worldState.burnedBriars.has(br.id)) {
        this.drawShadowBriars(ctx, br, timeSec);
      }
    }

    // 5. Interactive Props: Mushrooms, Checkpoints, Totems, Shards, Portal
    for (const m of level.mushrooms || []) {
      this.drawMushroom(ctx, m, timeSec);
    }
    for (const cp of level.checkpoints || []) {
      this.drawCheckpoint(ctx, cp, worldState.activeCheckpoint === cp.id, timeSec);
    }
    for (const t of level.totems || []) {
      this.drawTotem(ctx, t, worldState, timeSec);
    }
    for (const s of level.shards || []) {
      if (!worldState.collectedShards.has(s.id)) {
        this.drawShard(ctx, s, timeSec);
      }
    }
    if (level.portal) {
      this.drawPortal(ctx, level.portal, worldState, timeSec);
    }

    // 6. Enemies & Boss
    for (const e of worldState.enemies || []) {
      if (e.alive) this.drawEnemy(ctx, e, timeSec);
    }
    if (worldState.boss && worldState.boss.alive) {
      this.drawBoss(ctx, worldState.boss, level, timeSec);
    }

    // 7. Soul Tether + Characters (SOLA & LUNA)
    this.drawSoulTether(ctx, players.sola, players.luna, worldState, timeSec);
    this.drawPlayer(ctx, players.luna, worldState, timeSec);
    this.drawPlayer(ctx, players.sola, worldState, timeSec);

    // 8. Projectiles & Boss Orbs
    for (const proj of worldState.projectiles || []) {
      this.drawProjectile(ctx, proj, timeSec);
    }
    for (const orb of worldState.bossProjectiles || []) {
      this.drawBossOrb(ctx, orb, timeSec);
    }

    // 9. Particles & Emote Bubbles
    particles.draw(ctx, this.camX, this.camY, worldViewW, worldViewH);
    this.drawEmotes(ctx, emotes || [], timeSec);

    ctx.restore(); // end world transform

    // 10. Dynamic Offscreen Lightmap pass (screen space)
    this.renderLightmap(ctx, pal, scale, level, worldState, players, timeSec);

    // 11. Off-screen Partner Compass Indicator
    const partnerRole = localRole === 'sola' ? 'luna' : 'sola';
    this.drawPartnerCompass(ctx, players[partnerRole], partnerRole, scale);

    ctx.restore();
  }

  drawSkyAndAurora(ctx, pal, timeSec) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
    grad.addColorStop(0, pal.skyTop);
    grad.addColorStop(0.55, pal.skyMid);
    grad.addColorStop(1, pal.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // Twinkling starfield
    for (const s of this.stars) {
      const alpha = 0.25 + 0.7 * (0.5 + 0.5 * Math.sin(timeSec * 1.8 + s.phase));
      ctx.fillStyle = `rgba(230, 248, 255, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(s.x * this.viewW, s.y * this.viewH, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Undulating Aurora Borealis curtains
    for (let band = 0; band < 2; band++) {
      ctx.save();
      ctx.beginPath();
      const baseY = this.viewH * (0.17 + band * 0.09);
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= this.viewW; x += 48) {
        const y =
          baseY +
          Math.sin(x * 0.004 + timeSec * (0.45 + band * 0.2) + band) * 32 +
          Math.cos(x * 0.009 - timeSec * 0.35) * 16;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(this.viewW, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = band === 0 ? pal.aurora1 : pal.aurora2;
      ctx.fill();
      ctx.restore();
    }

    // Radiant Crescent Moon
    const moonX = this.viewW * 0.8 - this.camX * 0.025;
    const moonY = this.viewH * 0.2;
    const halo = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 150);
    halo.addColorStop(0, 'rgba(216, 248, 255, 0.36)');
    halo.addColorStop(0.45, 'rgba(110, 231, 255, 0.12)');
    halo.addColorStop(1, 'rgba(110, 231, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E8FAFF';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.skyTop;
    ctx.beginPath();
    ctx.arc(moonX + 13, moonY - 7, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  drawParallaxBackdrop(ctx, pal, biome, timeSec) {
    // Far silhouettes
    this.drawTreeLayer(ctx, pal.farTree, 0.12, 220, 0.58, biome);
    // Volumetric light rays
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const rx = ((i * 390 - this.camX * 0.18) % (this.viewW + 400)) - 120;
      const rayGrad = ctx.createLinearGradient(rx, 0, rx + 140, this.viewH);
      rayGrad.addColorStop(0, biome === 'sanctuary' ? 'rgba(255,179,71,0.08)' : 'rgba(110,231,255,0.07)');
      rayGrad.addColorStop(1, 'rgba(110,231,255,0)');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 85, 0);
      ctx.lineTo(rx + 260, this.viewH);
      ctx.lineTo(rx + 125, this.viewH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Mid silhouettes + hanging glowing vines
    this.drawTreeLayer(ctx, pal.midTree, 0.28, 280, 0.68, biome);

    ctx.save();
    ctx.strokeStyle = pal.mossGlow;
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const vx = ((i * 230 - this.camX * 0.32) % (this.viewW + 240));
      const x = vx < -40 ? vx + this.viewW + 240 : vx;
      const sway = Math.sin(timeSec * 1.4 + i) * 10;
      const len = 70 + (i % 3) * 45;
      ctx.globalAlpha = 0.24;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + sway * 0.5, len * 0.5, x + sway, len);
      ctx.stroke();

      ctx.globalAlpha = 0.65;
      ctx.fillStyle = i % 2 === 0 ? '#6EE7FF' : '#3CE6B5';
      ctx.beginPath();
      ctx.arc(x + sway, len, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawTreeLayer(ctx, color, parallax, spacing, baseScale, biome) {
    ctx.fillStyle = color;
    const count = Math.ceil(this.viewW / spacing) + 3;
    const offset = -((this.camX * parallax) % spacing);

    for (let i = -1; i < count; i++) {
      const x = offset + i * spacing;
      if (biome === 'cavern') {
        // Stalactite & crystal spires
        const h = this.viewH * (0.28 + ((i + 10) % 3) * 0.08) * baseScale;
        ctx.beginPath();
        ctx.moveTo(x - 45, 0);
        ctx.lineTo(x + 12, h);
        ctx.lineTo(x + 70, 0);
        ctx.closePath();
        ctx.fill();
      } else if (biome === 'sanctuary') {
        // Ruined temple arches/pillars
        const w = 36;
        ctx.fillRect(x, this.viewH * 0.22, w, this.viewH * 0.8);
        ctx.fillRect(x - 10, this.viewH * 0.22, w + 20, 14);
      } else if (biome === 'abyss') {
        // Floating crystalline monoliths
        const h = this.viewH * (0.28 + ((i + 4) % 3) * 0.08);
        const topY = this.viewH * (0.22 + ((i + 9) % 3) * 0.06);
        ctx.beginPath();
        ctx.moveTo(x + 18, topY);
        ctx.lineTo(x + 42, topY + 26);
        ctx.lineTo(x + 36, topY + h);
        ctx.lineTo(x + 18, topY + h + 18);
        ctx.lineTo(x, topY + h);
        ctx.lineTo(x - 6, topY + 26);
        ctx.closePath();
        ctx.fill();
      } else if (biome === 'canopy') {
        // Sweeping canopy boughs
        const trunkW = 28 + ((i + 4) % 3) * 10;
        const topY = this.viewH * (0.34 + ((i + 6) % 3) * 0.06);
        ctx.fillRect(x, topY, trunkW, this.viewH - topY);
        ctx.beginPath();
        ctx.ellipse(x + trunkW * 0.5, topY, trunkW * 3.1, trunkW * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ancient giant trees
        const trunkW = 34 + ((i + 5) % 3) * 14;
        const topY = this.viewH * (0.26 + ((i + 7) % 3) * 0.07);
        ctx.fillRect(x, topY, trunkW, this.viewH - topY);
        ctx.beginPath();
        ctx.arc(x + trunkW * 0.5, topY, trunkW * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawWaterfall(ctx, wf, timeSec) {
    const grad = ctx.createLinearGradient(wf.x, 0, wf.x + wf.w, 0);
    grad.addColorStop(0, 'rgba(60, 230, 181, 0.04)');
    grad.addColorStop(0.25, 'rgba(110, 231, 255, 0.26)');
    grad.addColorStop(0.5, 'rgba(216, 248, 255, 0.42)');
    grad.addColorStop(0.75, 'rgba(110, 231, 255, 0.26)');
    grad.addColorStop(1, 'rgba(60, 230, 181, 0.04)');

    ctx.fillStyle = grad;
    ctx.fillRect(wf.x, wf.y, wf.w, wf.h);

    // Flowing water shimmer streaks
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 252, 255, 0.45)';
    ctx.lineCap = 'round';
    const streams = Math.floor(wf.w / 22);
    for (let i = 0; i < streams; i++) {
      const sx = wf.x + 12 + i * 22;
      const scroll = (timeSec * (260 + (i % 3) * 45) + i * 95) % wf.h;
      ctx.lineWidth = 2 + (i % 2);
      ctx.beginPath();
      ctx.moveTo(sx, wf.y + scroll);
      ctx.lineTo(sx, wf.y + Math.min(wf.h, scroll + 75));
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPlatform(ctx, p, pal, timeSec) {
    ctx.save();
    const r = Math.min(10, p.h * 0.4, p.w * 0.2);

    // Rock body
    ctx.fillStyle = pal.rockFill;
    ctx.strokeStyle = pal.rockStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, r);
    ctx.fill();
    ctx.stroke();

    // Glowing organic top cap (unless ceiling pillar starting at y=0)
    if (p.y > 10) {
      const capGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 12);
      capGrad.addColorStop(0, pal.mossGlow);
      capGrad.addColorStop(1, pal.mossTop);
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, Math.min(11, p.h * 0.5), [r, r, 4, 4]);
      ctx.fill();

      // Swaying grass / crystal tufts along top
      ctx.strokeStyle = pal.mossGlow;
      ctx.lineWidth = 2;
      for (let gx = p.x + 14; gx < p.x + p.w - 14; gx += 26) {
        const sway = Math.sin(timeSec * 2.5 + gx * 0.05) * 3.5;
        ctx.beginPath();
        ctx.moveTo(gx, p.y);
        ctx.lineTo(gx + sway, p.y - 7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawMovingPlatform(ctx, pos, timeSec) {
    ctx.save();
    const pulse = 0.65 + 0.35 * Math.sin(timeSec * 4);
    ctx.fillStyle = `rgba(110, 231, 255, ${(0.28 * pulse).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(pos.x + pos.w * 0.5, pos.y + pos.h + 6, pos.w * 0.44, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + pos.h);
    grad.addColorStop(0, '#4EE2FF');
    grad.addColorStop(0.4, '#184A68');
    grad.addColorStop(1, '#0C2438');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#9BF3FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pos.x, pos.y, pos.w, pos.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawSpiritBridge(ctx, b, active, timeSec) {
    ctx.save();
    if (!active) {
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = 'rgba(110, 231, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.restore();
      return;
    }

    const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y);
    grad.addColorStop(0, 'rgba(110, 231, 255, 0.45)');
    grad.addColorStop(0.5, 'rgba(216, 248, 255, 0.92)');
    grad.addColorStop(1, 'rgba(110, 231, 255, 0.45)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, 12, 6);
    ctx.fill();

    // Shimmering runic motes along bridge
    for (let x = b.x + 20; x < b.x + b.w - 12; x += 34) {
      const bob = Math.sin(timeSec * 4 + x * 0.04) * 3;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, b.y + 5 + bob, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawShadowBriars(ctx, br, timeSec) {
    ctx.save();
    ctx.fillStyle = '#1B0C26';
    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(br.x + 6, br.y, br.w - 12, br.h, 10);
    ctx.fill();
    ctx.stroke();

    // Tangled glowing thorny vines
    for (let y = br.y + 16; y < br.y + br.h - 10; y += 22) {
      const wave = Math.sin(timeSec * 3.5 + y * 0.1) * 6;
      ctx.strokeStyle = '#E879F9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(br.x + 2, y);
      ctx.quadraticCurveTo(br.x + br.w * 0.5 + wave, y - 9, br.x + br.w - 2, y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTotem(ctx, t, worldState, timeSec) {
    const isBoss = Boolean(t.bossTotem);
    const isLit = isBoss
      ? Boolean(worldState.boss?.shielded && worldState.boss.litShieldTotems.includes(t.id))
      : worldState.litTotems.has(t.id);
    const inactiveBoss = isBoss && !worldState.boss?.shielded;

    ctx.save();
    const bob = Math.sin(timeSec * 2.8 + t.x * 0.02) * 4;
    const isSolar = t.kind === 'solar';
    const color = isSolar ? '#FFB347' : '#6EE7FF';
    const glow = isSolar ? '#FFF0B8' : '#D8F8FF';

    ctx.globalAlpha = inactiveBoss ? 0.35 : 1;

    // Pedestal base
    ctx.fillStyle = '#1A2D3E';
    ctx.strokeStyle = isLit ? color : '#3A5870';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(t.x - 16, t.y + 18, 32, 38, 5);
    ctx.fill();
    ctx.stroke();

    if (isSolar) {
      // Sun disc totem
      ctx.fillStyle = isLit ? color : '#5A4326';
      ctx.beginPath();
      ctx.arc(t.x, t.y + bob, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = glow;
      ctx.lineWidth = isLit ? 3 : 1.5;
      ctx.stroke();

      if (isLit) {
        for (let i = 0; i < 8; i++) {
          const a = timeSec * 1.4 + (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(t.x + Math.cos(a) * 23, t.y + bob + Math.sin(a) * 23);
          ctx.lineTo(t.x + Math.cos(a) * 31, t.y + bob + Math.sin(a) * 31);
          ctx.stroke();
        }
      }
    } else {
      // Faceted Moon Crystal
      ctx.fillStyle = isLit ? color : '#22475B';
      ctx.strokeStyle = glow;
      ctx.lineWidth = isLit ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y - 24 + bob);
      ctx.lineTo(t.x + 17, t.y + bob);
      ctx.lineTo(t.x, t.y + 22 + bob);
      ctx.lineTo(t.x - 17, t.y + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAncientGate(ctx, g, worldState, timeSec) {
    const opened = worldState.openedGates.has(g.id);
    if (opened) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#3CE6B5';
      ctx.fillRect(g.x + g.w * 0.35, g.y, g.w * 0.3, 18);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.fillStyle = '#122436';
    ctx.strokeStyle = '#3B6682';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(g.x, g.y, g.w, g.h, 8);
    ctx.fill();
    ctx.stroke();

    // Two socket medallions showing Sun & Moon activation progress
    const cy = g.y + g.h * 0.5;
    g.requiresTotemIds.forEach((tid, idx) => {
      const lit = worldState.litTotems.has(tid);
      const sy = cy + (idx === 0 ? -28 : 28);
      const isSun = tid.includes('sun');
      ctx.fillStyle = lit ? (isSun ? '#FFB347' : '#6EE7FF') : '#0A1520';
      ctx.strokeStyle = isSun ? '#FFB347' : '#6EE7FF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(g.x + g.w * 0.5, sy, 12 + (lit ? Math.sin(timeSec * 5) * 1.5 : 0), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  drawMushroom(ctx, m, timeSec) {
    const bounce = this.mushroomBounce.get(m.id) || 0;
    const scaleY = 1 - bounce * 0.32;
    const scaleX = 1 + bounce * 0.25;

    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.scale(scaleX, scaleY);

    // Stalk
    ctx.fillStyle = '#CBEFE9';
    ctx.beginPath();
    ctx.roundRect(-8, -22, 16, 22, 5);
    ctx.fill();

    // Glowing dome cap
    const pulse = 0.8 + 0.2 * Math.sin(timeSec * 3.5 + m.x);
    const capGrad = ctx.createRadialGradient(-4, -26, 4, 0, -20, m.r);
    capGrad.addColorStop(0, '#99FFE8');
    capGrad.addColorStop(0.55, '#2DD4BF');
    capGrad.addColorStop(1, '#0F766E');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.ellipse(0, -20, m.r * pulse, 15, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#E6FFFA';
    ctx.beginPath();
    ctx.arc(-10, -26, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -28, 2.8, 0, Math.PI * 2);
    ctx.arc(1, -23, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCheckpoint(ctx, cp, active, timeSec) {
    ctx.save();
    // Wooden/stone post
    ctx.fillStyle = '#1E3446';
    ctx.fillRect(cp.x - 4, cp.y - 52, 8, 52);
    ctx.fillRect(cp.x - 4, cp.y - 52, 22, 5);

    // Hanging lantern
    const swing = Math.sin(timeSec * 2 + cp.x) * 2;
    const lx = cp.x + 14 + swing;
    const ly = cp.y - 38;
    ctx.strokeStyle = '#537D99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cp.x + 14, cp.y - 47);
    ctx.lineTo(lx, ly - 8);
    ctx.stroke();

    ctx.fillStyle = active ? '#FFB347' : '#132737';
    ctx.strokeStyle = active ? '#FFF0B8' : '#4C7691';
    ctx.beginPath();
    ctx.roundRect(lx - 8, ly - 8, 16, 20, 4);
    ctx.fill();
    ctx.stroke();

    if (active) {
      ctx.fillStyle = '#FFF8DC';
      ctx.beginPath();
      ctx.arc(lx, ly + 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawShard(ctx, s, timeSec) {
    ctx.save();
    const bob = Math.sin(timeSec * 3.4 + s.x * 0.03) * 5;
    ctx.translate(s.x, s.y + bob);
    ctx.rotate(Math.sin(timeSec * 2 + s.x) * 0.14);

    ctx.fillStyle = '#8FF7E0';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawPortal(ctx, portal, worldState, timeSec) {
    const unlocked = portal.requiresGateId
      ? worldState.openedGates.has(portal.requiresGateId)
      : portal.requiresBossDefeated
        ? Boolean(worldState.boss && !worldState.boss.alive)
        : true;

    ctx.save();
    ctx.translate(portal.x, portal.y);

    // Stone arch frame
    ctx.strokeStyle = unlocked ? '#6EE7FF' : '#355369';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 54, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (unlocked) {
      const swirl = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      swirl.addColorStop(0, '#FFFFFF');
      swirl.addColorStop(0.35, '#6EE7FF');
      swirl.addColorStop(0.75, '#3CE6B5');
      swirl.addColorStop(1, 'rgba(60, 230, 181, 0)');
      ctx.fillStyle = swirl;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 6; i++) {
        const a = timeSec * 2.5 + (Math.PI * 2 * i) / 6;
        ctx.fillStyle = i % 2 === 0 ? '#FFB347' : '#D8F8FF';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 20, Math.sin(a) * 32, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawEnemy(ctx, e, timeSec) {
    ctx.save();
    const bob = Math.sin(timeSec * 5 + e.x * 0.05) * 5;
    ctx.translate(e.x, e.y + bob);

    // Dark spectral cloak
    ctx.fillStyle = e.stunTimer > 0 ? '#3E5573' : '#1E1132';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Glowing elemental core indicating best weakness
    const coreColor = e.affinity === 'solar' ? '#FFB347' : '#6EE7FF';
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, -1, 8 + Math.sin(timeSec * 8) * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const dir = e.vx >= 0 ? 1 : -1;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(dir * 5 - 3, -4, 2.4, 0, Math.PI * 2);
    ctx.arc(dir * 5 + 5, -4, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Mini HP bar when damaged
    if (e.hp < e.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-18, -32, 36, 5);
      ctx.fillStyle = coreColor;
      ctx.fillRect(-18, -32, 36 * Math.max(0, e.hp / e.maxHp), 5);
    }
    ctx.restore();
  }

  drawBoss(ctx, boss, level, timeSec) {
    ctx.save();
    const flap = Math.sin(timeSec * (boss.stunTimer > 0 ? 3 : 7.5)) * 18;

    // Beam connecting boss shield to active shield totems
    if (boss.shielded) {
      for (const tid of [boss.sunTotemId, boss.moonTotemId]) {
        const totem = (level.totems || []).find((t) => t.id === tid);
        if (!totem) continue;
        const lit = boss.litShieldTotems.includes(tid);
        ctx.save();
        ctx.strokeStyle = lit ? '#3CE6B5' : totem.kind === 'solar' ? 'rgba(255,179,71,0.45)' : 'rgba(110,231,255,0.45)';
        ctx.lineWidth = lit ? 4 : 2;
        ctx.setLineDash(lit ? [] : [8, 8]);
        ctx.beginPath();
        ctx.moveTo(boss.x, boss.y);
        ctx.lineTo(totem.x, totem.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.translate(boss.x, boss.y);

    const coreColor = boss.weakness === 'solar' ? '#FFB347' : '#6EE7FF';

    if (boss.style === 'wraith') {
      // Solstice Wraith Mini-Boss: Sleek emerald-gold wind spirit with orbiting rings
      ctx.save();
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 2.5;
      ctx.rotate(timeSec * 1.6);
      ctx.beginPath();
      ctx.ellipse(0, 0, 56, 22, 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 56, 22, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.fillStyle = '#0F2E36';
        ctx.strokeStyle = '#3CE6B5';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.quadraticCurveTo(64, -52 + flap, 78, -6 + flap * 0.4);
        ctx.quadraticCurveTo(44, 18, 10, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = '#0A1E26';
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(22, 0);
      ctx.lineTo(0, 36);
      ctx.lineTo(-22, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // 4 Articulated Shadow Moth Wings (Umbra Noctis)
      const wingColor = boss.phase === 3 ? '#3A124F' : '#23123D';
      const wingTrim = coreColor;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.scale(side, 1);
        // Upper wing
        ctx.fillStyle = wingColor;
        ctx.strokeStyle = wingTrim;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(10, -8);
        ctx.quadraticCurveTo(68, -68 + flap, 92, -16 + flap * 0.6);
        ctx.quadraticCurveTo(58, 12, 12, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing wing eye-spot
        ctx.fillStyle = wingTrim;
        ctx.beginPath();
        ctx.arc(54, -22 + flap * 0.45, 7, 0, Math.PI * 2);
        ctx.fill();

        // Lower wing
        ctx.fillStyle = '#180B2B';
        ctx.beginPath();
        ctx.moveTo(10, 6);
        ctx.quadraticCurveTo(58, 20 - flap * 0.3, 66, 54 - flap * 0.4);
        ctx.quadraticCurveTo(28, 48, 8, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Core Body
      ctx.fillStyle = '#130824';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 36, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pulsing Weakness Core
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, 4, 13 + Math.sin(timeSec * 6) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = '#FFF5D6';
    ctx.beginPath();
    ctx.arc(-9, -14, 3.5, 0, Math.PI * 2);
    ctx.arc(9, -14, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eclipse Shield Dome
    if (boss.shielded) {
      ctx.strokeStyle = '#C084FC';
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 66 + Math.sin(timeSec * 8) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Stun indicator
    if (boss.stunTimer > 0) {
      for (let i = 0; i < 3; i++) {
        const a = timeSec * 4.5 + (Math.PI * 2 * i) / 3;
        ctx.fillStyle = '#FFE680';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 30, -44 + Math.sin(a) * 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawSoulTether(ctx, sola, luna, worldState, timeSec) {
    if (!sola || !luna) return;
    const dist = Math.hypot(sola.x - luna.x, sola.y - luna.y);
    if (dist > POWERS.HARMONY_RADIUS) return;

    const strength = 1 - dist / POWERS.HARMONY_RADIUS;
    ctx.save();
    const grad = ctx.createLinearGradient(sola.x, sola.y, luna.x, luna.y);
    grad.addColorStop(0, ROLES.sola.primary);
    grad.addColorStop(0.5, '#FFFFFF');
    grad.addColorStop(1, ROLES.luna.primary);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.28 + strength * 0.52;
    ctx.lineWidth = 2 + strength * 2;
    ctx.beginPath();
    ctx.moveTo(sola.x, sola.y);
    const midX = (sola.x + luna.x) * 0.5;
    const midY = (sola.y + luna.y) * 0.5 + Math.sin(timeSec * 5) * 14;
    ctx.quadraticCurveTo(midX, midY, luna.x, luna.y);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer(ctx, p, worldState, timeSec) {
    if (!p) return;
    const roleCfg = ROLES[p.role];
    const isSpirit = Boolean(worldState.playersSpirit[p.role]);

    // Invulnerability blink
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 16) % 2 === 0) return;

    ctx.save();

    // Spirit Wisp mode rendering
    if (isSpirit) {
      const pulse = 1 + 0.16 * Math.sin(timeSec * 8);
      ctx.fillStyle = roleCfg.primary;
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '600 12px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('แตะเพื่อฟื้นพลัง', p.x, p.y - 26);
      ctx.restore();
      return;
    }

    // Verlet flowing spirit scarf
    if (p.scarfNodes && p.scarfNodes.length > 1) {
      ctx.save();
      ctx.strokeStyle = roleCfg.primary;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < p.scarfNodes.length; i++) {
        ctx.lineWidth = Math.max(2, 9 - i * 0.75);
        ctx.globalAlpha = Math.max(0.25, 0.95 - i * 0.08);
        ctx.beginPath();
        ctx.moveTo(p.scarfNodes[i - 1].x, p.scarfNodes[i - 1].y);
        ctx.lineTo(p.scarfNodes[i].x, p.scarfNodes[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    const idleBob = p.anim === 'idle' ? Math.sin(timeSec * 3.5 + (p.role === 'sola' ? 0 : 1.5)) * 2 : 0;
    const tilt = p.anim === 'run' ? p.facing * 0.1 : 0;

    ctx.translate(p.x, p.y + idleBob);
    ctx.rotate(tilt);
    ctx.scale(p.squashX || 1, p.squashY || 1);

    // Character Crown / Halo above hood
    if (p.role === 'sola') {
      ctx.strokeStyle = '#FFF0B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -30, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFB347';
      ctx.beginPath();
      ctx.arc(0, -30, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#D8F8FF';
      ctx.beginPath();
      ctx.arc(0, -31, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#07131D';
      ctx.beginPath();
      ctx.arc(3.5, -32.5, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cloak body
    const cloakGrad = ctx.createLinearGradient(0, -22, 0, 24);
    cloakGrad.addColorStop(0, roleCfg.primary);
    cloakGrad.addColorStop(1, roleCfg.accent);
    ctx.fillStyle = cloakGrad;
    ctx.beginPath();
    ctx.moveTo(-14, 22);
    ctx.quadraticCurveTo(-16, -4, 0, -22);
    ctx.quadraticCurveTo(16, -4, 14, 22);
    ctx.closePath();
    ctx.fill();

    // Inner dark mask face
    ctx.fillStyle = '#0B1726';
    ctx.beginPath();
    ctx.ellipse(p.facing * 2.5, -7, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Expressive glowing eyes (periodic blink)
    const blinking = Math.sin(timeSec * 1.3 + (p.role === 'sola' ? 0 : 2)) > 0.98;
    ctx.fillStyle = roleCfg.glow;
    if (blinking) {
      ctx.fillRect(p.facing * 3 - 4, -8, 9, 1.8);
    } else {
      ctx.beginPath();
      ctx.arc(p.facing * 4 - 2.5, -8, 2.2, 0, Math.PI * 2);
      ctx.arc(p.facing * 4 + 3.5, -8, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Clean character badge above
    ctx.save();
    ctx.font = '700 11px "Cinzel", "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = roleCfg.glow;
    ctx.globalAlpha = 0.85;
    ctx.fillText(roleCfg.name, p.x, p.y - 43);
    ctx.restore();
  }

  drawProjectile(ctx, proj, timeSec) {
    ctx.save();
    const isSolar = proj.power === 'solar';
    const outer = isSolar ? '#FF6B2B' : '#4B8BFF';
    const core = isSolar ? '#FFF4C8' : '#E0FBFF';

    const grad = ctx.createRadialGradient(proj.x, proj.y, 2, proj.x, proj.y, proj.radius * 1.9);
    grad.addColorStop(0, core);
    grad.addColorStop(0.5, isSolar ? '#FFB347' : '#6EE7FF');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = core;
    ctx.strokeStyle = outer;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isSolar) {
      ctx.arc(proj.x, proj.y, proj.radius * 0.65, 0, Math.PI * 2);
    } else {
      const dir = proj.vx >= 0 ? 1 : -1;
      ctx.arc(proj.x, proj.y, proj.radius * 0.85, dir > 0 ? -1.1 : Math.PI - 1.1, dir > 0 ? 1.1 : Math.PI + 1.1);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawBossOrb(ctx, orb, timeSec) {
    ctx.save();
    const grad = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, orb.radius * 1.8);
    grad.addColorStop(0, '#F5D0FE');
    grad.addColorStop(0.45, '#A855F7');
    grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 5 + Math.sin(timeSec * 14) * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawEmotes(ctx, emotes, timeSec) {
    for (const em of emotes) {
      const roleCfg = ROLES[em.role] || ROLES.sola;
      const alpha = Math.min(1, em.life * 2);
      const bob = Math.sin(timeSec * 7) * 4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(7, 19, 29, 0.88)';
      ctx.strokeStyle = roleCfg.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(em.x - 46, em.y - 84 + bob, 92, 26, 13);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 12px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = roleCfg.glow;
      ctx.fillText('มาตรงนี้!', em.x, em.y - 67 + bob);
      ctx.restore();
    }
  }

  renderLightmap(ctx, pal, scale, level, worldState, players, timeSec) {
    const lctx = this.lightCtx;
    const lw = this.lightCanvas.width;
    const lh = this.lightCanvas.height;
    const ratio = lw / this.viewW;

    lctx.save();
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = pal.ambientDark;
    lctx.fillRect(0, 0, lw, lh);

    lctx.globalCompositeOperation = 'destination-out';
    const punch = (wx, wy, worldRadius, strength = 1.0) => {
      const sx = (wx - this.camX) * scale * ratio;
      const sy = (wy - this.camY) * scale * ratio;
      const sr = worldRadius * scale * ratio;
      if (sx < -sr || sx > lw + sr || sy < -sr || sy > lh + sr) return;
      const g = lctx.createRadialGradient(sx, sy, sr * 0.1, sx, sy, sr);
      g.addColorStop(0, `rgba(0,0,0,${strength})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(sx, sy, sr, 0, Math.PI * 2);
      lctx.fill();
    };

    if (players.sola) punch(players.sola.x, players.sola.y, 195 + Math.sin(timeSec * 4) * 8, 1);
    if (players.luna) punch(players.luna.x, players.luna.y, 195 + Math.cos(timeSec * 4) * 8, 1);

    for (const s of level.shards || []) {
      if (!worldState.collectedShards.has(s.id)) punch(s.x, s.y, 75, 0.85);
    }
    for (const m of level.mushrooms || []) punch(m.x, m.y - 16, 95, 0.8);
    for (const t of level.totems || []) {
      const lit = t.bossTotem
        ? worldState.boss?.shielded
        : worldState.litTotems.has(t.id);
      punch(t.x, t.y, lit ? 165 : 85, lit ? 1 : 0.7);
    }
    for (const cp of level.checkpoints || []) {
      punch(cp.x + 14, cp.y - 38, worldState.activeCheckpoint === cp.id ? 165 : 70, 0.9);
    }
    for (const proj of worldState.projectiles || []) punch(proj.x, proj.y, 115, 0.95);
    if (worldState.boss && worldState.boss.alive) {
      punch(worldState.boss.x, worldState.boss.y, 240, 0.95);
    }
    if (level.portal) punch(level.portal.x, level.portal.y, 155, 0.9);
    lctx.restore();

    ctx.drawImage(this.lightCanvas, 0, 0, this.viewW, this.viewH);

    // Subtle additive warm/cool aura halos for characters
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of ['sola', 'luna']) {
      const pl = players[r];
      if (!pl) continue;
      const sx = (pl.x - this.camX) * scale;
      const sy = (pl.y - this.camY) * scale;
      const sr = 65 * scale;
      const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, sr);
      g.addColorStop(0, r === 'sola' ? 'rgba(255, 179, 71, 0.16)' : 'rgba(110, 231, 255, 0.16)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPartnerCompass(ctx, partner, partnerRole, scale) {
    if (!partner) return;
    const sx = (partner.x - this.camX) * scale;
    const sy = (partner.y - this.camY) * scale;
    const margin = 42;
    if (sx >= 16 && sx <= this.viewW - 16 && sy >= 16 && sy <= this.viewH - 16) {
      return;
    }

    const cx = Math.max(margin, Math.min(this.viewW - margin, sx));
    const cy = Math.max(margin + 46, Math.min(this.viewH - 110, sy));
    const cfg = ROLES[partnerRole];
    const distMeters = Math.max(1, Math.round(Math.hypot(sx - cx, sy - cy) / 38));

    ctx.save();
    ctx.fillStyle = 'rgba(7, 19, 29, 0.85)';
    ctx.strokeStyle = cfg.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 38, cy - 15, 76, 30, 15);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 12px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.glow;
    ctx.fillText(`${cfg.name} ${distMeters}m`, cx, cy + 4);
    ctx.restore();
  }
}
