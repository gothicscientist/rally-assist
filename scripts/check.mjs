import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, JSON.parse(readFileSync('package.json', 'utf8')).version);
assert.ok(manifest.content_scripts[0].matches.includes('https://playrally.cc/*'));
assert.equal(manifest.content_scripts[0].world, 'MAIN');
assert.ok(!manifest.permissions?.length);
for (const file of manifest.content_scripts[0].js) {
  assert.ok(existsSync(file));
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
for (const file of ['README.md', 'docs/architecture.md', 'docs/media/README.md']) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(https?:|chrome:|edge:)/.test(target)) continue;
    const { resolve, dirname } = await import('node:path');
    assert.ok(existsSync(resolve(dirname(file), target)), `${file}: missing ${target}`);
  }
}
console.log('Manifest, script syntax and local documentation links verified.');
