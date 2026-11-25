/**
 * Unified Mobile Multi-Touch + Desktop Keyboard Input Handler.
 */

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.joyPointerId = null;
    this.joyOrigin = { x: 0, y: 0 };
    this.joyAxis = 0;

    this.buttonPointers = new Map();
    this.jumpHeld = false;
    this.jumpPressed = false;
    this.powerPressed = false;
    this.harmonyPressed = false;
    this.emotePressed = false;
    this.switchPressed = false;

    this.joyZoneEl = null;
    this.joyKnobEl = null;
    this.maxJoyRadius = 46;
  }

  attach({ joyZone, joyKnob, btnJump, btnPower, btnHarmony, btnEmote }) {
    this.joyZoneEl = joyZone;
    this.joyKnobEl = joyKnob;

    if (joyZone) {
      joyZone.addEventListener('pointerdown', (e) => {
        if (this.joyPointerId !== null) return;
        e.preventDefault();
        joyZone.setPointerCapture?.(e.pointerId);
        this.joyPointerId = e.pointerId;
        const rect = joyZone.getBoundingClientRect();
        this.joyOrigin = {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.5,
        };
        this.updateJoystick(e.clientX);
      });

      joyZone.addEventListener('pointermove', (e) => {
        if (e.pointerId !== this.joyPointerId) return;
        e.preventDefault();
        this.updateJoystick(e.clientX);
      });

      const endJoy = (e) => {
        if (e.pointerId !== this.joyPointerId) return;
        this.joyPointerId = null;
        this.joyAxis = 0;
        if (this.joyKnobEl) {
          this.joyKnobEl.style.transform = 'translate(0px, 0px)';
        }
      };
      joyZone.addEventListener('pointerup', endJoy);
      joyZone.addEventListener('pointercancel', endJoy);
    }

    this.bindButton(btnJump, 'jump');
    this.bindButton(btnPower, 'power');
    this.bindButton(btnHarmony, 'harmony');
    this.bindButton(btnEmote, 'emote');

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.resetAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetAll();
    });
  }

  updateJoystick(clientX) {
    const dx = clientX - this.joyOrigin.x;
    const clamped = Math.max(-this.maxJoyRadius, Math.min(this.maxJoyRadius, dx));
    const norm = clamped / this.maxJoyRadius;
    this.joyAxis = Math.abs(norm) < 0.16 ? 0 : norm;
    if (this.joyKnobEl) {
      this.joyKnobEl.style.transform = `translate(${Math.round(clamped)}px, 0px)`;
    }
  }

  bindButton(el, action) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      this.buttonPointers.set(e.pointerId, { action, el });
      el.classList.add('pressed');

      if (action === 'jump') {
        this.jumpHeld = true;
        this.jumpPressed = true;
      } else if (action === 'power') {
        this.powerPressed = true;
      } else if (action === 'harmony') {
        this.harmonyPressed = true;
      } else if (action === 'emote') {
        this.emotePressed = true;
      }
    });

    const release = (e) => {
      const info = this.buttonPointers.get(e.pointerId);
      if (!info) return;
      this.buttonPointers.delete(e.pointerId);
      info.el.classList.remove('pressed');
      if (info.action === 'jump') {
        const stillJump = [...this.buttonPointers.values()].some((v) => v.action === 'jump');
        this.jumpHeld = stillJump || this.isJumpKeyDown();
      }
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  isJumpKeyDown() {
    return this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
  }

  onKeyDown(e) {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
      e.preventDefault();
    }
    const wasDown = this.keys.has(e.code);
    this.keys.add(e.code);
    if (wasDown) return;

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.jumpHeld = true;
      this.jumpPressed = true;
    } else if (e.code === 'KeyJ' || e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Enter') {
      this.powerPressed = true;
    } else if (e.code === 'KeyK' || e.code === 'KeyQ') {
      this.harmonyPressed = true;
    } else if (e.code === 'KeyH' || e.code === 'KeyC') {
      this.emotePressed = true;
    } else if (e.code === 'Tab') {
      this.switchPressed = true;
    }
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      const stillTouchJump = [...this.buttonPointers.values()].some((v) => v.action === 'jump');
      this.jumpHeld = stillTouchJump || this.isJumpKeyDown();
    }
  }

  resetAll() {
    this.keys.clear();
    this.joyPointerId = null;
    this.joyAxis = 0;
    if (this.joyKnobEl) {
      this.joyKnobEl.style.transform = 'translate(0px, 0px)';
    }
    for (const info of this.buttonPointers.values()) {
      info.el.classList.remove('pressed');
    }
    this.buttonPointers.clear();
    this.jumpHeld = false;
    this.jumpPressed = false;
    this.powerPressed = false;
    this.harmonyPressed = false;
    this.emotePressed = false;
    this.switchPressed = false;
  }

  consumeFrame() {
    let moveX = this.joyAxis;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) moveX -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) moveX += 1;
    moveX = Math.max(-1, Math.min(1, moveX));

    const snapshot = {
      moveX,
      jumpHeld: this.jumpHeld,
      jumpPressed: this.jumpPressed,
      powerPressed: this.powerPressed,
      harmonyPressed: this.harmonyPressed,
      emotePressed: this.emotePressed,
      switchPressed: this.switchPressed,
    };

    this.jumpPressed = false;
    this.powerPressed = false;
    this.harmonyPressed = false;
    this.emotePressed = false;
    this.switchPressed = false;

    return snapshot;
  }
}
