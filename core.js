/* Rally Assist — uses Rally's existing window.rally handle. No network requests. */
(() => {
  'use strict';
  const DEFAULTS = Object.freeze({ enabled: false, autoHit: true, autoServe: true, shot: 'smash', aim: 'auto', player: 'auto' });
  const SHOTS = ['smash', 'topspin', 'chop', 'banana', 'drive', 'mixed'];
  const sanitize = (s = {}) => ({
    enabled: typeof s.enabled === 'boolean' ? s.enabled : DEFAULTS.enabled,
    autoHit: typeof s.autoHit === 'boolean' ? s.autoHit : DEFAULTS.autoHit,
    autoServe: typeof s.autoServe === 'boolean' ? s.autoServe : DEFAULTS.autoServe,
    shot: SHOTS.includes(s.shot) ? s.shot : DEFAULTS.shot,
    aim: ['auto', 'center', 'left', 'right'].includes(s.aim) ? s.aim : DEFAULTS.aim,
    player: ['auto', '0', '1'].includes(s.player) ? s.player : DEFAULTS.player,
  });

  class Assist {
    constructor(getGame, onChange = () => {}) {
      this.getGame = getGame;
      this.onChange = onChange;
      this.options = { ...DEFAULTS };
      this.binding = null;
      this.hits = 0;
      this.perfect = 0;
      this.lastHit = null;
      this.error = null;
      this.stopped = false;
    }
    configure(patch) {
      this.options = sanitize({ ...this.options, ...patch });
      if (!this.options.enabled) this.detach();
      this.onChange();
    }
    selected(m) {
      if (!m?.inputs) return null;
      if (m.online && Number.isInteger(m.online.me)) return m.online.me;
      const localHuman = (pi) => ['phone', 'keyboard'].includes(m.inputs[pi]?.kind) && m.rally?.players?.[pi]?.local;
      if (this.options.player !== 'auto') {
        const pi = Number(this.options.player);
        return localHuman(pi) ? pi : null;
      }
      return [0, 1].find(localHuman) ?? null;
    }
    active(m) {
      return this.options.enabled && !!m && !m.paused && !m.over && !m.replay && m.startGate?.started === true;
    }
    ours(m, pi) {
      return this.active(m) && this.selected(m) === pi && m.rally.players?.[pi]?.local === true && !m.rally.players[pi].cpu;
    }
    preset(r, pi, source = {}) {
      let shot = this.options.shot;
      if (shot === 'mixed') shot = ['smash', 'topspin', 'banana', 'chop'][this.hits % 4];
      const lift = { smash: 0.55, topspin: 1, chop: -1, banana: 1, drive: 0.05 }[shot];
      const power = { smash: 1.6, topspin: 1.3, chop: 1.1, banana: 1.2, drive: 1.35 }[shot];
      const pos = r.fate?.contact?.pos;
      const handed = r.players[pi].handed === 'L' ? -1 : 1;
      const hs = pi === 0 ? 1 : -1;
      const side = shot === 'banana' ? 'bh' : pos && (pos[0] * hs + 0.08 * handed) * handed < -0.06 ? 'bh' : 'fh';
      // Aim away from the opposing figure. Left/right are in this player's frame.
      const opposite = r.bodyX?.[1 - pi] ?? 0;
      const aim = this.options.aim === 'center' ? 0 : this.options.aim === 'left' ? -0.7 : this.options.aim === 'right' ? 0.7 : (opposite * hs >= 0 ? -0.7 : 0.7);
      const sw = { ...source, power, lift, side, stroke: side, aim, faceYaw: 0,
        path: undefined, twist: undefined, dy: undefined, brush: undefined, doubt: null,
        lead: 0, acc: 40, read: { resid: 0, miss: 0, sigma: 0 }, d: 0, dSet: 0, assistCreated: true };
      // Serve spin has its own model. Keep its real toss and double-bounce physics.
      if (r.phase === 'toss') {
        sw.power = 1.2;
        sw.type = undefined;
        sw.spin = undefined;
        sw.sideSpin = undefined;
        sw.fault = undefined;
      }
      return { sw, shot };
    }
    perfectSwing(m, pi, source, original) {
      const r = m.rally;
      if (!this.ours(m, pi)) return original.call(r, pi, source);
      let at;
      if (r.phase === 'toss' && r.server === pi && r.tossWin) at = r.segT0 + r.tossWin.ideal;
      else if (r.phase === 'flight' && r.receiver === pi && r.fate?.legal && !r.fate.let && !r.fate.edge && !r.resolved) at = r.segT0 + r.fate.contact.t;
      else return; // Don't turn an outgoing-ball swing into a future queued hit.
      const { sw } = this.preset(r, pi, source);
      sw.sim = at - 0.000001;
      sw.wall = r.expectedWall(at);
      return original.call(r, pi, sw);
    }
    tick(m, dt, wall, swing) {
      if (!this.active(m) || m.rally.paused) return;
      const r = m.rally, pi = this.selected(m);
      if (pi === null || !this.ours(m, pi)) return;
      if (r.phase === 'ready' && r.server === pi && this.options.autoServe) r.toss(pi);
      const ahead = Math.max(0, dt) * r.pace * Math.max(1, r.rate || 1) + 0.025 * r.pace;
      let at = null;
      if (this.options.autoServe && r.phase === 'toss' && r.server === pi && r.tossWin && !r.pending?.serve) at = r.segT0 + r.tossWin.ideal;
      else if (this.options.autoHit && r.phase === 'flight' && r.receiver === pi && !r.resolved && r.fate?.legal && !r.fate.let && !r.fate.edge) at = r.segT0 + r.fate.contact.t;
      if (at === null || r.simT + ahead < at) return;
      const { sw } = this.preset(r, pi, { wall });
      // Animate keyboard paddles through the input's existing animation planner.
      m.inputs[pi]?.anim?.setPlan?.({ at, side: sw.side, power: sw.power, lift: sw.lift });
      this.perfectSwing(m, pi, sw, swing);
    }
    sync() {
      if (this.stopped) return;
      const m = this.getGame()?.match, r = m?.rally;
      if (!this.options.enabled || !r) { this.detach(); return; }
      if (this.binding?.r === r) return;
      this.detach();
      if (!['swing', 'update', '_launch', 'expectedWall'].every(k => typeof r[k] === 'function') || !r.hooks) {
        this.error = 'This Rally version is unsupported.'; this.onChange(); return;
      }
      this.error = null;
      const self = this, original = { swing: r.swing, update: r.update, launch: r._launch, hit: r.hooks.hit };
      const wrapped = {
        swing(pi, sw) { return self.perfectSwing(m, pi, sw, original.swing); },
        update(dt, wall) {
          try { self.tick(m, dt, wall, original.swing); }
          catch (e) { self.error = `Assist stopped: ${e.message}`; self.options.enabled = false; self.detach(); self.onChange(); }
          return original.update.call(this, dt, wall);
        },
        launch(pi, at, C, kind, sw) {
          if (self.ours(m, pi)) {
            const preset = self.preset(r, pi, sw);
            sw = { ...preset.sw, sim: sw.sim, wall: sw.wall };
            if (kind === 'shot' && preset.shot === 'smash') {
              // Real smash threshold: TABLE.H (.76) + SMASH_H[1] (.37).
              C = [C[0], Math.max(C[1], 1.16), C[2]];
            } else if (kind === 'shot' && preset.shot === 'banana') {
              C = [C[0], C[1], Math.sign(C[2] || (pi === 0 ? 1 : -1)) * Math.min(Math.abs(C[2]), 1.25)];
            }
          }
          return original.launch.call(this, pi, at, C, kind, sw);
        },
        hit(h) {
          if (self.ours(m, h.pi) && !h.remote) {
            self.hits++; if (h.perfect) self.perfect++;
            self.lastHit = { kind: h.kind, grade: h.grade, kmh: h.kmh, spin: h.spin, style: h.style, serve: h.serve };
            self.onChange();
          }
          return original.hit?.call(this, h);
        },
      };
      this.binding = { r, original, wrapped };
      r.swing = wrapped.swing; r.update = wrapped.update; r._launch = wrapped.launch; r.hooks.hit = wrapped.hit;
      this.onChange();
    }
    detach() {
      const b = this.binding; if (!b) return;
      if (b.r.swing === b.wrapped.swing) b.r.swing = b.original.swing;
      if (b.r.update === b.wrapped.update) b.r.update = b.original.update;
      if (b.r._launch === b.wrapped.launch) b.r._launch = b.original.launch;
      if (b.r.hooks.hit === b.wrapped.hit) b.r.hooks.hit = b.original.hit;
      this.binding = null;
      // Cancel an assist-created held swing when toggled off.
      if (b.r.pending?.params?.assistCreated) {
        if (!b.r.pending.serve) b.r.resolved = false;
        b.r.pending = null;
      }
    }
    destroy() { this.stopped = true; this.detach(); }
  }
  Object.defineProperty(globalThis, 'RallyAssistCore', { value: { Assist, DEFAULTS, sanitize }, configurable: true });
})();
