import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
  const panel = await readFile('docs/media/panel.png');
  const narrow = await readFile('docs/media/narrow.png');
  const ph = panel.readUInt32BE(20), nh = narrow.readUInt32BE(20);
  const height = Math.max(ph, nh) + 88;
  const sheet = '<svg xmlns="http://www.w3.org/2000/svg" width="752" height="' + height + '" viewBox="0 0 752 ' + height + '"><rect width="752" height="100%" fill="#101418"/><g fill="#aeb8bf" font-family="sans-serif" font-size="12"><text x="24" y="28">Expanded controls</text><text x="368" y="28">Narrow window · 360 px</text><text x="24" y="' + (height - 18) + '">Actual extension UI · controlled fixture, not a live match</text></g><image x="24" y="44" width="320" height="' + ph + '" href="data:image/png;base64,' + panel.toString('base64') + '"/><image x="368" y="44" width="360" height="' + nh + '" href="data:image/png;base64,' + narrow.toString('base64') + '"/></svg>';
  await writeFile('docs/media/preview.svg', sheet);
  console.log('Captured installed-extension UI: overview, panel, minimized and narrow.');
} finally { await close(); }
