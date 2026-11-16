// Serves a built site the way Vercel does for this project (clean URLs, immutable /_astro assets),
// so before/after builds can be benchmarked side by side. Usage: node scripts/serve-static.mjs <dir> [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const [dir = 'dist', port = '4330'] = process.argv.slice(2);
const root = path.resolve(dir);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.glb': 'model/gltf-binary' };
http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const candidates = url === '/' ? ['index.html'] : [url, url + '.html', path.join(url, 'index.html')];
  let file = null;
  for (const c of candidates) {
    const p = path.join(root, c);
    if (p.startsWith(root) && fs.existsSync(p) && fs.statSync(p).isFile()) { file = p; break; }
  }
  const status = file ? 200 : 404;
  file ??= path.join(root, '404.html');
  const cache = url.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate';
  const type = types[path.extname(file)] ?? 'application/octet-stream';
  // Brotli for text, like Vercel's edge, so transfer sizes match production.
  const br = /text|javascript|json|svg|xml|manifest/.test(type) && /\bbr\b/.test(req.headers['accept-encoding'] ?? '');
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': cache, ...(br ? { 'Content-Encoding': 'br', Vary: 'Accept-Encoding' } : {}) });
  const stream = fs.createReadStream(file);
  (br ? stream.pipe(zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } })) : stream).pipe(res);
}).listen(+port, () => console.log(`serving ${root} on http://localhost:${port}`));
