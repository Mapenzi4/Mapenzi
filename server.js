// Tiny Node.js backend — no external dependencies required.
// Serves a static frontend and a small JSON API backed by a file on disk.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'notes.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function loadNotes() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(PUBLIC_DIR, decodeURIComponent(filePath.split('?')[0]));

  // Prevent directory traversal outside of PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  // --- API routes ---
  if (url === '/api/notes' && method === 'GET') {
    return sendJSON(res, 200, loadNotes());
  }

  if (url === '/api/notes' && method === 'POST') {
    try {
      const body = await readBody(req);
      const { text } = JSON.parse(body || '{}');
      if (!text || !text.trim()) {
        return sendJSON(res, 400, { error: 'Note text is required.' });
      }
      const notes = loadNotes();
      const note = {
        id: crypto.randomUUID(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      notes.unshift(note);
      saveNotes(notes);
      return sendJSON(res, 201, note);
    } catch (e) {
      return sendJSON(res, 400, { error: 'Invalid request body.' });
    }
  }

  const deleteMatch = url.match(/^\/api\/notes\/([^/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const id = deleteMatch[1];
    const notes = loadNotes();
    const filtered = notes.filter((n) => n.id !== id);
    if (filtered.length === notes.length) {
      return sendJSON(res, 404, { error: 'Note not found.' });
    }
    saveNotes(filtered);
    return sendJSON(res, 200, { deleted: id });
  }

  // --- Static frontend ---
  if (method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
