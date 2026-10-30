import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserSession, ready } from './browser.mjs';
test('installed MV3 panel: settings, status, shortcuts, focus, persistence and narrow layouts', async () => {
  const { page, close } = await browserSession();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    const enable = page.locator('#enable');
    assert.equal(await enable.getAttribute('aria-pressed'), 'false');
    assert.match(await page.locator('#status').innerText(), /Waiting/);
    await ready(page); await enable.click();
    assert.equal(await enable.getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(() => document.querySelector('#rally-assist-panel').shadowRoot.querySelector('#status').textContent.includes('Active'));
    await page.locator('#shot').selectOption('banana');
    assert.match(await page.locator('#note').innerText(), /backhand flick/);
    await page.locator('#autoHit').uncheck();
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('rally.assist.v1'))).autoHit, false);
    await enable.focus(); await page.keyboard.press('F8');
    assert.equal(await enable.getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('F9'); assert.equal(await page.locator('.panel').isVisible(), false);
    assert.equal(await page.locator('#mini').evaluate(el => el.getRootNode().activeElement === el), true);
    await page.locator('#mini').click(); assert.equal(await page.locator('.panel').isVisible(), true);
    assert.equal(await page.locator('#collapse').evaluate(el => el.getRootNode().activeElement === el), true);
    await page.locator('#shot').focus(); await page.keyboard.press('F8');
    assert.equal(await enable.getAttribute('aria-pressed'), 'false');
    await page.reload(); await page.locator('#rally-assist-panel').waitFor();
    assert.equal(await page.locator('#shot').inputValue(), 'banana');
    assert.equal(await page.locator('#autoHit').isChecked(), false);
    for (const viewport of [{ width: 360, height: 640 }, { width: 1280, height: 600 }]) {
      await page.setViewportSize(viewport);
      const box = await page.locator('.panel').boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= viewport.width);
      assert.ok(box.y + box.height <= viewport.height);
      await page.locator('#reset').click();
    }
    await page.goto('http://127.0.0.1:4173/phone');
    assert.equal(await page.locator('#rally-assist-panel').count(), 0);
    await page.goto('http://127.0.0.1:4173/'); await page.locator('#rally-assist-panel').waitFor();
    await page.evaluate(() => localStorage.setItem('rally.assist.v1', '{broken'));
    await page.reload(); await page.locator('#rally-assist-panel').waitFor();
    assert.equal(await enable.getAttribute('aria-pressed'), 'false');
    await ready(page); await enable.click();
    await page.evaluate(() => window.rally.match.paused = true);
    await page.waitForFunction(() => document.querySelector('#rally-assist-panel').shadowRoot.querySelector('#status').textContent.includes('Paused'));
    await page.evaluate(() => { window.rally.match = { rally: {}, inputs: [] }; });
    await page.waitForFunction(() => document.querySelector('#rally-assist-panel').shadowRoot.querySelector('#status').textContent.includes('unsupported'));
    assert.deepEqual(errors, []);
  } finally { await close(); }
});
