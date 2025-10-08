// Minimal static server + submission API (no dependencies)
// Usage: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT = __dirname;
const SUBMIT_DIR = path.join(ROOT, 'submissions');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, code, body, headers = {}) {
  const defaultHeaders = { 'Content-Type': 'text/plain; charset=utf-8' };
  res.writeHead(code, { ...defaultHeaders, ...headers });
  res.end(body);
}

function safeJoin(base, target) {
  const resolved = path.resolve(base, '.' + target);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function formatTs(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const server = http.createServer((req, res) => {
  // Basic CORS for API convenience
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/submit') {
    let buf = '';
    req.on('data', (chunk) => { buf += chunk; if (buf.length > 10 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(buf || '{}');
        ensureDir(SUBMIT_DIR);
        const id = (payload && payload.id) ? String(payload.id).replace(/[^a-z0-9-_]+/gi, '_') : 'submission';
        const ts = formatTs();
        const filename = `${id}-${ts}.json`;
        const filePath = path.join(SUBMIT_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
        return send(res, 200, JSON.stringify({ ok: true, id: filename, path: `submissions/${filename}` }), { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
      } catch (err) {
        return send(res, 400, JSON.stringify({ ok: false, error: String(err) }), { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
      }
    });
    return;
  }

  // Static files
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = safeJoin(ROOT, urlPath);
  if (!filePath) return send(res, 403, 'Forbidden');
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Fallback to index.html for client routing
      const indexPath = path.join(ROOT, 'index.html');
      return fs.readFile(indexPath, (e, data) => {
        if (e) return send(res, 404, 'Not Found');
        return send(res, 200, data, { 'Content-Type': MIME['.html'] || 'text/html', 'Cache-Control': 'no-cache' });
      });
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (e, data) => {
      if (e) return send(res, 500, 'Server Error');
      return send(res, 200, data, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Saving submissions to ${SUBMIT_DIR}`);
});

