import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = { '/': ['scripts/preview.html','text/html'], '/index.html': ['scripts/preview.html','text/html'], '/phone': ['scripts/preview.html','text/html'], '/demo.js': ['scripts/demo.js','text/javascript'], '/core.js': ['core.js','text/javascript'], '/panel.js': ['panel.js','text/javascript'] };
const port = Number(process.env.PORT || 4173);
createServer(async (req,res) => {
  const route = routes[new URL(req.url, 'http://127.0.0.1').pathname];
  if (!route) { res.writeHead(404); res.end('Not found'); return; }
  try { res.writeHead(200, {'Content-Type': route[1] + '; charset=utf-8','Cache-Control':'no-store'}); res.end(await readFile(route[0])); }
  catch { res.writeHead(500); res.end('Preview file unavailable'); }
}).listen(port, '127.0.0.1', () => console.log(`UI fixture: http://127.0.0.1:${port}/ (not a live match)`));
