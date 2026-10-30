(() => {
  'use strict';
  // Only the display page; never the phone controller, stats or account pages.
  if (!['/', '/index.html'].includes(location.pathname) || document.getElementById('rally-assist-panel')) return;
  const KEY = 'rally.assist.v1';
  const host = document.createElement('aside');
  host.id = 'rally-assist-panel';
  host.style.cssText = 'position:fixed;z-index:2147483647;top:16px;right:16px;max-width:calc(100vw - 32px);color-scheme:dark';
  const root = host.attachShadow({ mode: 'open' });
  const icon = (paths) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const paddle = icon('<path d="M15.5 15.5c3.5-3.5 3.9-7.6.9-10.6S9.3 2.3 5.8 5.8s-3.9 7.6-.9 10.6 7.1 2.6 10.6-.9Z"/><path d="m12.4 17.6 3.8 3.8a1.8 1.8 0 0 0 2.6-2.6l-3.8-3.8M5.6 7l9.6 9.6"/>');
  root.innerHTML = `
    <style>
      :host{font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f4f3ef;--surface:#181c20;--raised:#242a2f;--line:#343b40;--muted:#aeb8bf;--accent:#fba66b;--ink:#241b16;color-scheme:dark}
      *{box-sizing:border-box}::selection{background:var(--accent);color:var(--ink)}
      button,select,input{font:inherit}button,select{color:inherit}button{cursor:pointer}
      button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
      button:disabled,select:disabled,input:disabled{cursor:not-allowed;opacity:.5}
      .panel{width:320px;max-width:calc(100vw - 32px);background:var(--surface);box-shadow:0 16px 56px #0007;border-radius:16px;overflow:hidden}
      header{display:flex;align-items:center;gap:11px;padding:19px 20px 17px;border-bottom:1px solid var(--line)}
      .mark{color:var(--accent);display:flex;flex:none}.mark svg{width:29px;height:29px}
      h1{font-size:17px;line-height:1.2;font-weight:650;letter-spacing:-.025em;margin:0}header p{color:var(--muted);font-size:11px;margin:3px 0 0}
      .icon-button{display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:var(--muted);width:32px;height:32px;margin-left:auto}
      .icon-button:hover{background:var(--raised);color:#fff}
      .body{padding:18px 20px 16px;max-height:calc(100dvh - 132px);overflow:auto;scrollbar-width:thin;scrollbar-color:#606b73 var(--surface)}
      .enable{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:45px;padding:10px 13px;font-weight:650;border:1px solid #69747d;border-radius:9px;background:var(--raised);text-align:left}
      .enable:hover{background:#30383f}.enable[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--ink)}.enable[aria-pressed=true]:hover{background:#ffb986}
      .enable kbd{font-size:10px;font-weight:500;font-family:inherit;opacity:.8;border:1px solid currentColor;border-radius:4px;padding:1px 5px}
      .connection{display:flex;align-items:baseline;gap:7px;padding:12px 0 15px;color:var(--muted);font-size:11px;min-height:43px}
      .dot{display:inline-block;height:6px;width:6px;border-radius:50%;background:#929da6;flex:none}.dot.on{background:var(--accent)}
      .rows{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:4px 0;margin-bottom:16px}
      .row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:53px;cursor:pointer}.row span{display:block}.row small{display:block;font-size:11px;color:var(--muted);margin-top:2px}
      input[type=checkbox]{appearance:none;-webkit-appearance:none;flex:none;width:33px;height:20px;border:1px solid #69747d;border-radius:12px;background:#343d44;cursor:pointer;position:relative;margin:0;transition:background .16s ease-out}
      input[type=checkbox]::after{content:"";position:absolute;left:3px;top:3px;width:12px;height:12px;border-radius:50%;background:#e8edf0;transition:transform .16s ease-out}
      input[type=checkbox]:checked{background:var(--accent);border-color:var(--accent)}input[type=checkbox]:checked::after{background:var(--ink);transform:translateX(13px)}
      .field{display:block;color:var(--muted);font-size:11px;margin-top:12px}.field:first-child{margin-top:0}
      select{display:block;width:100%;margin-top:6px;border:1px solid #56616a;background:var(--raised);border-radius:7px;padding:9px 10px;font-size:12px;min-height:37px;cursor:pointer}select:hover{border-color:#aeb8bf}
      .stats{display:flex;align-items:center;justify-content:space-between;gap:16px;border-top:1px solid var(--line);padding-top:16px;margin-top:18px}
      .metric{display:flex;align-items:baseline;gap:6px}.metric b{font-size:22px;line-height:1.1;letter-spacing:-.025em;font-weight:600;font-variant-numeric:tabular-nums}.metric small{color:var(--muted);font-size:10px}
      .last{font-size:11px;color:var(--accent);margin-top:10px}.last:empty{display:none}
      .note{color:var(--muted);font-size:11px;line-height:1.55;margin:12px 0 0}
      footer{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:12px;margin-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:10px}
      footer kbd{font:inherit;color:#e5e9ed}footer button{font-size:10px;padding:5px 0 5px 8px;background:none;color:var(--muted);border:0;border-radius:3px}footer button:hover{color:#fff;text-decoration:underline;text-underline-offset:3px}
      [hidden]{display:none!important}.mini{padding:11px 14px;border-radius:12px;background:var(--surface);color:#f4f3ef;border:0;box-shadow:0 8px 30px #0005;display:flex;align-items:center;gap:9px;font-weight:600}.mini:hover{background:var(--raised)}.mini svg{color:var(--accent)}
      @media(max-width:380px){:host{font-size:12px}.body{padding:15px 16px}header{padding:16px}.panel{width:320px}}
      @media(prefers-reduced-motion:reduce){input[type=checkbox],input[type=checkbox]::after{transition:none}}
    </style>
    <button class="mini" id="mini" hidden aria-label="Open Rally Assist">${paddle}Rally Assist<i class="dot"></i></button>
    <section class="panel" aria-label="Rally Assist controls">
      <header><span class="mark">${paddle}</span><div><h1>Rally Assist</h1><p>Your side of the table.</p></div><button class="icon-button" id="collapse" aria-label="Minimize panel">${icon('<path d="M6 12h12"/>')}</button></header>
      <div class="body">
        <button class="enable" id="enable" aria-pressed="false"><span id="enableLabel">Enable assist</span><kbd>F8</kbd></button>
        <div class="connection"><i class="dot"></i><span id="status" role="status" aria-live="polite">Waiting for Rally.</span></div>
        <div class="rows">
          <label class="row"><span>Auto-return<small>Swing at perfect contact</small></span><input type="checkbox" id="autoHit" role="switch"></label>
          <label class="row"><span>Auto-serve<small>Toss and hit at perfect timing</small></span><input type="checkbox" id="autoServe" role="switch"></label>
        </div>
        <div class="fields">
          <label class="field">Shot preset<select id="shot"><option value="smash">Always smash + topspin</option><option value="topspin">Heavy topspin loop</option><option value="chop">Heavy backspin chop</option><option value="banana">Banana flick + sidespin</option><option value="drive">Power drive</option><option value="mixed">Mix smashes + spins</option></select></label>
          <label class="field">Placement<select id="aim"><option value="auto">Away from opponent</option><option value="center">Center</option><option value="left">My left corner</option><option value="right">My right corner</option></select></label>
          <label class="field">My player<select id="player"><option value="auto">Auto-detect</option><option value="0">Player 1</option><option value="1">Player 2</option></select></label>
        </div>
        <div class="stats"><div class="metric"><b id="hits">0</b><small>assisted hits</small></div><div class="metric"><b id="perfect">—</b><small>perfect</small></div></div>
        <div class="last" id="last"></div><p class="note" id="note"></p>
        <footer><span><kbd>F9</kbd> minimize</span><button id="reset">Reset stats</button></footer>
      </div>
    </section>`;
  document.documentElement.append(host);
  const $ = id => root.getElementById(id);
  const assist = new RallyAssistCore.Assist(() => window.rally, render);
  let minimized = false, lastStatus = '', lastStatusAt = -Infinity;
  try { assist.configure(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(assist.options)); } catch {} }
  function update(patch) { assist.configure(patch); assist.sync(); save(); render(true); }
  function collapse() {
    minimized = !minimized;
    root.querySelector('.panel').hidden = minimized; $('mini').hidden = !minimized;
    (minimized ? $('mini') : $('collapse')).focus();
  }
  function render(immediate = false) {
    const o = assist.options, game = window.rally, m = game?.match;
    $('enableLabel').textContent = o.enabled ? 'Assist on · perfect timing' : 'Enable assist';
    $('enable').setAttribute('aria-pressed', String(o.enabled));
    root.querySelectorAll('.dot').forEach(dot => dot.classList.toggle('on', o.enabled && !assist.error));
    for (const k of ['autoHit', 'autoServe']) $(k).checked = o[k];
    for (const k of ['shot', 'aim', 'player']) $(k).value = o[k];
    const status = assist.error || (!game ? 'Waiting for Rally to finish loading.' : !o.enabled ? 'Off. Turn on to assist your paddle.' : !m ? 'Ready. Start a match to use assist.' : m.over ? 'Match finished. Ready for the next one.' : m.paused ? 'Paused with the game.' : m.replay ? 'Waiting for replay to finish.' : !m.startGate?.started ? "Ready. Complete the game's start prompt." : assist.selected(m) === null ? 'Select your local player.' : `Active · Player ${assist.selected(m) + 1} · ${m.rally.phase}`);
    if (status !== lastStatus && (immediate || performance.now() - lastStatusAt > 500)) {
      $('status').textContent = status; lastStatus = status; lastStatusAt = performance.now();
    }
    $('hits').textContent = String(assist.hits);
    $('perfect').textContent = assist.hits ? `${Math.round(100 * assist.perfect / assist.hits)}%` : '—';
    const hit = assist.lastHit;
    $('last').textContent = hit ? `${hit.grade} ${hit.style === 'banana' ? 'banana flick' : hit.kind} · ${Math.round(hit.kmh || 0)} km/h` : '';
    $('note').textContent = o.shot === 'smash' ? 'Always smash raises low contact points to smash height. Serves keep their normal double bounce.' : o.shot === 'banana' ? 'Banana mode moves contact over the table for a backhand flick.' : 'Perfect timing stays on for manual swings too. Turn off Auto-return if you want to swing yourself.';
  }
  $('enable').addEventListener('click', () => update({ enabled: !assist.options.enabled }));
  for (const k of ['autoHit', 'autoServe']) $(k).addEventListener('change', () => update({ [k]: $(k).checked }));
  for (const k of ['shot', 'aim', 'player']) $(k).addEventListener('change', () => update({ [k]: $(k).value }));
  $('collapse').addEventListener('click', collapse); $('mini').addEventListener('click', collapse);
  $('reset').addEventListener('click', () => { assist.hits = assist.perfect = 0; assist.lastHit = null; render(); });
  function keydown(e) {
    const target = e.composedPath()[0];
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;
    if (e.code === 'F8') { e.preventDefault(); e.stopImmediatePropagation(); update({ enabled: !assist.options.enabled }); }
    if (e.code === 'F9') { e.preventDefault(); e.stopImmediatePropagation(); collapse(); }
  }
  document.addEventListener('keydown', keydown, true);
  const timer = setInterval(() => { assist.sync(); render(); }, 200);
  window.addEventListener('pagehide', () => {
    clearInterval(timer); assist.destroy(); document.removeEventListener('keydown', keydown, true); host.remove();
  }, { once: true });
  render();
})();
