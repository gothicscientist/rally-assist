// Local UI fixture only. This file is never loaded by the extension manifest.
if (new URLSearchParams(location.search).has('capture')) document.body.classList.add('capture');
window.rally = {};
function match() {
  return { paused: false, over: false, replay: null, startGate: { started: true }, inputs: [{ kind: 'keyboard' }, { kind: 'cpu' }],
    rally: { phase: 'ready', players: [{ local: true }, { local: true, cpu: {} }], hooks: {}, swing() {}, update() {}, _launch() {}, expectedWall() {} } };
}
document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => {
  const state = button.dataset.state;
  if (state === 'waiting') { delete window.rally; return; }
  window.rally = state === 'ready' ? {} : { match: match() };
  if (state === 'paused') window.rally.match.paused = true;
  if (state === 'replay') window.rally.match.replay = {};
  if (state === 'unsupported') window.rally.match.rally = {};
}));
document.querySelector('#demo-hit').addEventListener('click', () => window.rally?.match?.rally?.hooks?.hit?.({ pi: 0, perfect: true, kind: 'smash', grade: 'perfect', kmh: 72 }));
document.querySelector('#demo-corrupt').addEventListener('click', () => localStorage.setItem('rally.assist.v1', '{broken'));
