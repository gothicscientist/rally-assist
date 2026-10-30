import { mkdir } from 'node:fs/promises';
import { browserSession } from '../tests/browser.mjs';
const { page, close } = await browserSession();
try {
  await mkdir('docs/media', { recursive: true });
  await page.evaluate(() => { window.rally = {}; });
  await page.locator('#enable').click();
  await page.screenshot({ path: 'docs/media/overview.png' });
  await page.locator('.panel').screenshot({ path: 'docs/media/panel.png' });
  await page.locator('#collapse').click();
  await page.locator('#mini').screenshot({ path: 'docs/media/minimized.png' });
  await page.locator('#mini').click();
  await page.setViewportSize({ width: 360, height: 640 });
  await page.screenshot({ path: 'docs/media/narrow.png' });
  console.log('Captured installed-extension UI: overview, panel, minimized and narrow.');
} finally { await close(); }
