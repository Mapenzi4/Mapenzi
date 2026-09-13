# Margin — a tiny notes app

A small website with a plain Node.js backend (no npm install needed — only
built-in modules) and a vanilla JS/HTML/CSS frontend.

## Run it

```
node server.js
```

Then open http://localhost:3000 in your browser.

## How it works

- `server.js` — HTTP server. Serves the files in `public/` and exposes a
  small JSON API:
  - `GET /api/notes` — list all notes
  - `POST /api/notes` — add a note, body: `{ "text": "..." }`
  - `DELETE /api/notes/:id` — remove a note
- Notes are stored in `notes.json`, created automatically on first save.
- `public/` — the frontend: `index.html`, `style.css`, `app.js`.

No dependencies to install — just Node.js (v14+).
