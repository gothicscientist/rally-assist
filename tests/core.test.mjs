import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../core.js';
const { Assist, sanitize } = globalThis.RallyAssistCore;
function fixture() {
  const calls = [];
  const rally = { phase: 'ready', players: [{ local: true }, { local: false }], hooks: { hit(h) { calls.push(h); } },
    swing() {}, update() {}, _launch() {}, expectedWall(t) { return t * 1000; }, toss() {} };
  const match = { rally, inputs: [{ kind: 'keyboard' }, { kind: 'remote' }], startGate: { started: true } };
  const game = { match };
  const assist = new Assist(() => game);
  return { assist, rally, match, game, calls };
}
test('saved options reject invalid values and preserve valid values', () => {
  assert.deepEqual(sanitize({ enabled: 'yes', shot: 'bad', aim: 'bad', player: '5' }),
    { enabled: false, autoHit: true, autoServe: true, shot: 'smash', aim: 'auto', player: 'auto' });
  assert.equal(sanitize({ shot: 'banana', enabled: true }).shot, 'banana');
});
test('off is inert; enabling wraps methods; disabling restores original identities', () => {
  const { assist, rally } = fixture();
  const original = [rally.swing, rally.update, rally._launch, rally.hooks.hit];
  assist.sync(); assert.equal(assist.binding, null);
  assist.configure({ enabled: true }); assist.sync();
  assert.notEqual(rally.swing, original[0]);
  assist.configure({ enabled: false });
  assert.deepEqual([rally.swing, rally.update, rally._launch, rally.hooks.hit], original);
});
test('replacement matches detach the previous instance; later wrappers are preserved', () => {
  const c = fixture(), next = fixture();
  const original = c.rally.swing;
  c.assist.configure({ enabled: true }); c.assist.sync();
  c.game.match = next.match; c.assist.sync();
  assert.equal(c.rally.swing, original);
  const laterWrapper = () => {};
  next.rally.swing = laterWrapper;
  c.assist.destroy(); assert.equal(next.rally.swing, laterWrapper);
});
test('unsupported interfaces report an error without installing hooks', () => {
  const { assist, rally } = fixture(); rally._launch = null;
  const original = rally.swing;
  assist.configure({ enabled: true }); assist.sync();
  assert.match(assist.error, /unsupported/); assert.equal(rally.swing, original);
});
test('pause, replay, finished matches and start gates block assistance', () => {
  for (const state of ['paused', 'replay', 'over', 'gate']) {
    const { assist, match } = fixture(); assist.configure({ enabled: true });
    if (state === 'gate') match.startGate.started = false; else match[state] = true;
    assert.equal(assist.active(match), false);
  }
});
test('local side detection excludes CPU and remote paddles; online side takes precedence', () => {
  const { assist, match, rally } = fixture(); assist.configure({ enabled: true });
  assert.equal(assist.selected(match), 0);
  match.inputs[0].kind = 'cpu'; assert.equal(assist.selected(match), null);
  match.online = { me: 1 }; assist.configure({ player: '0' });
  assert.equal(assist.selected(match), 1); assert.equal(assist.ours(match, 1), false);
  rally.players[1].local = true; rally.players[1].cpu = {}; assert.equal(assist.ours(match, 1), false);
});
test('hit accounting excludes remote hits and forwards the original hook', () => {
  const { assist, rally, calls } = fixture(); assist.configure({ enabled: true }); assist.sync();
  rally.hooks.hit({ pi: 0, perfect: true, kind: 'smash' });
  rally.hooks.hit({ pi: 0, perfect: true, remote: true });
  rally.hooks.hit({ pi: 1, perfect: true });
  assert.equal(assist.hits, 1); assert.equal(assist.perfect, 1); assert.equal(calls.length, 3);
  assist.destroy();
});
test('a runtime failure disables assistance, restores hooks and still advances the game', () => {
  const { assist, rally } = fixture(); let updates = 0;
  rally.update = () => updates++; rally.toss = () => { throw Error('test failure'); }; rally.server = 0;
  const original = rally.swing;
  assist.configure({ enabled: true }); assist.sync(); rally.update(.016, 100);
  assert.equal(assist.options.enabled, false); assert.match(assist.error, /test failure/);
  assert.equal(rally.swing, original); assert.equal(updates, 1);
});
