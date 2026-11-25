/**
 * High-performance pooled particle & floating text manager for 60fps mobile play.
 */

const MAX_PARTICLES = 550;

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.ambient = [];
  }

  clear() {
    this.particles.length = 0;
    this.rings.length = 0;
    this.texts.length = 0;
    this.ambient.length = 0;
  }

  seedAmbient(level) {
    this.ambient.length = 0;
    const count = Math.min(90, Math.round(level.width / 42));
    const palette =
      level.biome === 'cavern'
        ? ['#6EE7FF', '#A78BFA', '#3CE6B5']
        : level.biome === 'sanctuary'
          ? ['#FFB347', '#6EE7FF', '#FFE699']
          : ['#3CE6B5', '#FFB347', '#6EE7FF'];

    for (let i = 0; i < count; i++) {
      this.ambient.push({
        x: Math.random() * level.width,
        y: 80 + Math.random() * (level.height - 160),
        vx: (Math.random() - 0.5) * 18,
        vy: -8 - Math.random() * 14,
        r: 1.8 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2.2,
        color: palette[i % palette.length],
      });
    }
  }

  spawnParticle(p) {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    this.particles.push({
      x: p.x,
      y: p.y,
      vx: p.vx || 0,
      vy: p.vy || 0,
      ax: p.ax || 0,
      ay: p.ay || 0,
      r: p.r || 3,
      life: p.life || 0.5,
      maxLife: p.life || 0.5,
      color: p.color || '#FFF0B8',
      kind: p.kind || 'glow',
      drag: p.drag ?? 0.96,
    });
  }

  emitRing(x, y, maxR, color, life = 0.45, lineWidth = 3) {
    this.rings.push({ x, y, r: 6, maxR, color, life, maxLife: life, lineWidth });
  }

  emitFloatingText(x, y, text, color = '#FFF0B8') {
    this.texts.push({ x, y, vy: -42, text, color, life: 1.15, maxLife: 1.15 });
  }

  emitJumpRing(x, y, color = '#6EE7FF') {
    this.emitRing(x, y + 18, 38, color, 0.32, 2.5);
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + (Math.random() - 0.5) * 2.2;
      const spd = 40 + Math.random() * 80;
      this.spawnParticle({
        x,
        y: y + 18,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd * 0.4,
        r: 2.4 + Math.random() * 2,
        life: 0.35 + Math.random() * 0.2,
        color,
      });
    }
  }

  emitFootstepDust(x, y, color = '#7EE8C7') {
    for (let i = 0; i < 3; i++) {
      this.spawnParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 20,
        vx: (Math.random() - 0.5) * 38,
        vy: -15 - Math.random() * 28,
        r: 2 + Math.random() * 2,
        life: 0.28 + Math.random() * 0.15,
        color,
      });
    }
  }

  emitCastTrail(x, y, power) {
    const color = power === 'solar' ? '#FFB347' : '#6EE7FF';
    this.spawnParticle({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30 - 8,
      r: 2.5 + Math.random() * 2.5,
      life: 0.26 + Math.random() * 0.14,
      color,
    });
  }

  emitExplosion(x, y, color, count = 22, speed = 190) {
    this.emitRing(x, y, 68, color, 0.45, 3.5);
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const s = speed * (0.35 + Math.random() * 0.75);
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 25,
        ay: 140,
        r: 2.6 + Math.random() * 3.6,
        life: 0.45 + Math.random() * 0.4,
        color,
      });
    }
  }

  emitHarmonyWave(x, y) {
    this.emitRing(x, y, 185, '#FFB347', 0.65, 4);
    this.emitRing(x, y, 150, '#6EE7FF', 0.55, 3);
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28;
      const spd = 90 + Math.random() * 140;
      this.spawnParticle({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 3 + Math.random() * 3,
        life: 0.6 + Math.random() * 0.35,
        color: i % 2 === 0 ? '#FFB347' : '#6EE7FF',
      });
    }
  }

  emitWaterfallMist(wf) {
    if (Math.random() > 0.48) return;
    const baseY = Math.min(wf.y + wf.h - 28, 760);
    this.spawnParticle({
      x: wf.x + Math.random() * wf.w,
      y: baseY + (Math.random() - 0.5) * 16,
      vx: (Math.random() - 0.5) * 48,
      vy: -20 - Math.random() * 40,
      r: 5 + Math.random() * 7,
      life: 0.55 + Math.random() * 0.45,
      color: 'rgba(180, 245, 255, 0.55)',
      kind: 'mist',
      drag: 0.94,
    });
  }

  update(dt, level) {
    if (level) {
      for (const a of this.ambient) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.phase += a.speed * dt;
        if (a.y < 60) a.y = level.height - 80;
        if (a.x < 0) a.x = level.width;
        if (a.x > level.width) a.x = 0;
      }
      for (const wf of level.waterfalls || []) {
        this.emitWaterfallMist(wf);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }
      p.vx = p.vx * p.drag + p.ax * dt;
      p.vy = p.vy * p.drag + p.ay * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        this.rings.splice(i, 1);
        continue;
      }
      const prog = 1 - r.life / r.maxLife;
      r.r = 8 + (r.maxR - 8) * (1 - Math.pow(1 - prog, 2));
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.vy *= 0.96;
    }
  }

  draw(ctx, camX, camY, viewW, viewH) {
    // Ambient fireflies
    for (const a of this.ambient) {
      if (a.x < camX - 40 || a.x > camX + viewW + 40 || a.y < camY - 40 || a.y > camY + viewH + 40) {
        continue;
      }
      const alpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(a.phase));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.28;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r * 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Active particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = p.kind === 'mist' ? alpha * 0.42 : alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (p.kind === 'mist' ? 1.5 - alpha * 0.4 : 0.4 + alpha * 0.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Expanding shockwave rings
    for (const r of this.rings) {
      const alpha = Math.max(0, r.life / r.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lineWidth * alpha;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Floating Thai / numeric feedback
    for (const t of this.texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 15px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(7, 19, 29, 0.75)';
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}
