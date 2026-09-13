const form = document.getElementById('note-form');
const textarea = document.getElementById('note-text');
const list = document.getElementById('notes-list');

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function render(notes) {
  list.innerHTML = '';
  if (notes.length === 0) {
    list.innerHTML = '<p class="empty-state">Nothing here yet — your first note will show up below.</p>';
    return;
  }
  for (const note of notes) {
    const row = document.createElement('div');
    row.className = 'note';
    row.innerHTML = `
      <span class="note-meta">${formatTime(note.createdAt)}</span>
      <p class="note-text"></p>
      <button class="note-delete" data-id="${note.id}">remove</button>
    `;
    row.querySelector('.note-text').textContent = note.text;
    list.appendChild(row);
  }
}

async function loadNotes() {
  const res = await fetch('/api/notes');
  const notes = await res.json();
  render(notes);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = textarea.value.trim();
  if (!text) return;
  await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  textarea.value = '';
  loadNotes();
});

list.addEventListener('click', async (e) => {
  if (!e.target.matches('.note-delete')) return;
  const id = e.target.dataset.id;
  await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  loadNotes();
});

loadNotes();
