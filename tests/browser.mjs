import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
export async function browserSession() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const profile = await mkdtemp(resolve(tmpdir(), 'rally-assist-test-'));
  const extension = resolve('.');
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : { channel: 'chromium' }),
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    ignoreDefaultArgs: ['--disable-extensions'],
    viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await context.route('http://127.0.0.1:4173/**', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8"><title>Rally Assist · UI fixture</title><style>html,body{margin:0;min-height:100%;background:#101418;color:#f4f3ef;font-family:system-ui}main{padding:80px;max-width:620px}h1{font-weight:550;font-size:62px;letter-spacing:-.04em;line-height:1.06;margin:0 0 24px}p{font-size:18px;color:#aeb8bf;line-height:1.65}small{color:#fba66b;font-size:13px}input{margin-top:25px}</style></head><body><main><h1>Your side<br>of the table.</h1><p>Perfect contact. Deliberate placement.<br>A compact control panel for Rally.</p><small>Rally Assist / Browser extension</small><p style="font-size:12px;margin-top:180px">UI demonstration · Local fixture, not a live match.</p></main></body></html>` }));
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#rally-assist-panel').waitFor();
  return { context, page, close: async () => { await context.close(); await rm(profile, { recursive: true, force: true }); } };
}
export async function ready(page, state = {}) {
  await page.evaluate(state => {
    window.rally = { match: { paused: false, over: false, replay: null, startGate: { started: true }, inputs: [{ kind: 'keyboard' }, { kind: 'cpu' }],
      rally: { phase: 'ready', players: [{ local: true }, { local: true, cpu: {} }], hooks: {}, swing() {}, update() {}, _launch() {}, expectedWall() {}, ...state } } };
  }, state);
}
