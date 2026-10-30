import assert from 'node:assert/strict';
import { test } from 'node:test';
import '../core.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
// Point at a compatible Rally checkout's public directory. Game sources are not redistributed.
const source = process.env.RALLY_SOURCE_DIR;
if (!source) throw new Error('Set RALLY_SOURCE_DIR to a compatible Rally public/ directory. See docs/testing.md.');
const load = path => import(pathToFileURL(resolve(source, path)).href);
const { Rally } = await load('js/display/rally.js');
const { Match } = await load('js/display/match.js');
const { Segment } = await load('js/display/physics.js');
const { makeShot } = await load('js/display/shots.js');
const { Assist, sanitize } = globalThis.RallyAssistCore;

function setup(options = {}, side = 0, seed = 7) {
  const hits = [], sent = [], score = new Match({ points: 1000, firstServer: side });
  const players = [0, 1].map(() => ({ local: true, latency: 0, shift: 0, handed: 'R', cpu: null, errorScale: 0.92 }));
  const r = new Rally({ match: score, players, settings: { pace: 1 }, seed, hooks: { hit: h => hits.push(h), sendHit: h => sent.push(h) } });
  const inputs = side === 0 ? [{ kind: 'keyboard' }, { kind: 'cpu' }] : [{ kind: 'cpu' }, { kind: 'phone' }];
  const m = { rally: r, inputs, startGate: { started: true }, paused: false, over: false, replay: null };
  const game = { match: m };
  const assist = new Assist(() => game);
  assist.configure({ enabled: true, ...options });
  assist.sync(); r.startPoint();
  return { r, m, hits, sent, assist, game, score };
}

function feed(ctx, receiver = 0, height = 1.0) {
  const hitter = 1 - receiver, hs = hitter === 0 ? 1 : -1;
  const shot = makeShot({ contact: [0.15, height, hs * 1.55], hs, d: 0, power: .8, lift: .5, stroke: 'fh', read: { resid: 0 }, rand: Object.assign(() => .5, { gauss: () => 0 }) });
  const seg = new Segment(shot.state);
  ctx.r.simT = 0; ctx.r.wall = 0;
  ctx.r._setSegment(seg, 0, hitter, 'shot'); ctx.r.phase = 'flight';
  assert.ok(ctx.r.fate.legal && !ctx.r.fate.edge, 'test feed is reachable');
  return ctx.r.segT0 + ctx.r.fate.contact.t;
}

test('real simulation: auto toss + perfect legal serve, both human sides, multiple frame rates', () => {
  for (const pi of [0, 1]) for (const fps of [15, 30, 60, 144]) {
    const c = setup({}, pi);
    for (let n = 1; n < fps * 5 && !c.hits.length; n++) c.r.update(1 / fps, n * 1000 / fps);
    assert.equal(c.hits.length, 1, `served side ${pi} at ${fps}fps`);
    assert.equal(c.hits[0].grade, 'perfect'); assert.equal(c.hits[0].serve, true);
    assert.ok(c.r.fate.legal, 'serve physically lands');
    assert.equal(c.sent.length, 1); assert.equal(c.sent[0].perfect, true);
    c.assist.destroy();
  }
});

test('real physics: presets produce perfect smashes, loops, chops and banana flicks', () => {
  const expected = { smash: 'smash', topspin: 'loop', chop: 'chop', banana: 'flick', drive: 'drive' };
  for (const [shot, kind] of Object.entries(expected)) for (const pi of [0, 1]) for (const fps of [15, 60, 144]) {
    const c = setup({ shot, autoServe: false }, pi);
    feed(c, pi);
    for (let n = 1; n < fps * 4 && !c.hits.length; n++) c.r.update(1 / fps, n * 1000 / fps);
    assert.equal(c.hits.length, 1, `${shot} side ${pi} fps ${fps}`);
    const h = c.hits[0];
    assert.equal(h.kind, kind, `${shot} creates ${kind}`);
    assert.equal(h.grade, 'perfect'); assert.equal(h.perfect, true);
    assert.equal(h.read.band, 'clean');
    assert.ok(c.r.fate.legal, `${shot} is physically legal`);
    assert.ok(c.sent[0].state.every(Number.isFinite));
    if (shot === 'chop') assert.ok(h.spin.sp < -.5);
    if (shot === 'topspin') assert.ok(h.spin.sp > .5);
    if (shot === 'banana') { assert.equal(h.style, 'banana'); assert.ok(Math.abs(h.spin.side) > .1); }
    c.assist.destroy();
  }
});

test('manual early swing is held until contact and becomes a perfect smash', () => {
  const c = setup({ autoHit: false, autoServe: false });
  const at = feed(c);
  c.r.swing(0, { wall: 0, power: .2, lift: -1, path: -1, doubt: 'backswing' });
  assert.ok(c.r.pending); assert.equal(c.hits.length, 0);
  for (let n = 1; n < 300 && !c.hits.length; n++) c.r.update(1 / 60, n * 1000 / 60);
  assert.equal(c.hits[0].kind, 'smash'); assert.equal(c.hits[0].grade, 'perfect');
  assert.ok(c.r.lastHit[0].simT >= at - 1e-5);
  c.assist.destroy();
});

test('disable restores methods and cancels assist pending hit', () => {
  const c = setup({ autoHit: false, autoServe: false }); feed(c);
  const original = c.assist.binding.original;
  c.r.swing(0, { wall: 0 }); assert.ok(c.r.pending);
  c.assist.configure({ enabled: false });
  assert.equal(c.r.swing, original.swing); assert.equal(c.r.update, original.update); assert.equal(c.r._launch, original.launch);
  assert.equal(c.r.hooks.hit, original.hit); assert.equal(c.r.pending, null); assert.equal(c.r.resolved, false);
});

test('pause, replay, start gate, CPU and remote inputs are respected', () => {
  for (const state of ['paused', 'replay', 'over', 'gate']) {
    const c = setup();
    if (state === 'gate') c.m.startGate.started = false; else c.m[state] = true;
    c.r.update(1 / 60, 100); assert.equal(c.r.phase, 'ready'); c.assist.destroy();
  }
  const c = setup(); c.m.inputs = [{ kind: 'cpu' }, { kind: 'remote' }];
  assert.equal(c.assist.selected(c.m), null); c.r.update(.016, 100); assert.equal(c.r.phase, 'ready'); c.assist.destroy();
});

test('online local side wins over player selection; opponent swing stays unmodified', () => {
  const c = setup({ player: '0', autoHit: false, autoServe: false }, 1); c.m.online = { me: 1 };
  assert.equal(c.assist.selected(c.m), 1);
  feed(c, 0); const at = c.r.fate.contact.t; c.r.simT = at;
  c.r.swing(0, { sim: at, wall: 0, power: .5, lift: .1, side: 'fh', dSet: .3, read: { resid: 0 } });
  assert.equal(c.hits[0].grade, 'good'); assert.notEqual(c.hits[0].kind, 'smash'); assert.equal(c.assist.hits, 0); c.assist.destroy();
});

test('new match attaches and old match detaches, mixed attack rotates', () => {
  const c = setup({ shot: 'mixed', autoServe: false });
  const kinds = [];
  for (let k = 0; k < 4; k++) {
    feed(c); c.r.swing(0, { wall: 0 });
    for (let n = 1; n < 300 && c.hits.length <= k; n++) c.r.update(1 / 60, n * 1000 / 60);
    kinds.push(c.hits[k].kind);
  }
  assert.deepEqual(kinds, ['smash', 'loop', 'flick', 'chop']);
  const old = c.r, original = c.assist.binding.original;
  const next = setup(); c.game.match = next.m; c.assist.sync();
  assert.equal(old.swing, original.swing); assert.equal(c.assist.binding.r, next.r);
  c.assist.destroy(); next.assist.destroy();
});

test('sanitizes malformed saved options', () => {
  const o = sanitize({ enabled: 'yes', shot: 'invalid', aim: 'invalid', player: '-1' });
  assert.equal(o.enabled, false); assert.equal(o.shot, 'smash'); assert.equal(o.aim, 'auto'); assert.equal(o.player, 'auto');
});
