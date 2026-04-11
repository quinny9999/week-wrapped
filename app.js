let notes = JSON.parse(localStorage.getItem("notes")) || [];

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function renderNotes() {
  const list = document.getElementById("notesList");
  list.innerHTML = "";
  notes.forEach(note => {
    const li = document.createElement("li");
    li.textContent = note.text;
    list.appendChild(li);
  });
}

function addNote() {
  const input = document.getElementById("noteInput");
  const text = input.value.trim();
  if (!text) return;

  const note = {
    id: Date.now(),
    text: text,
    createdAt: new Date().toISOString()
  };

  notes.push(note);
  saveNotes();
  renderNotes();
  input.value = "";
}

function generateRecap() {
  const recapDiv = document.getElementById("recap");

  if (notes.length === 0) {
    recapDiv.textContent = "Your week is still unwritten.";
    return;
  }

  let intro = "This week may not have felt big, but you still showed up.\n\n";
  let highlights = notes.slice(0, 3).map(n => "• " + n.text).join("\n");

  let ending = "\n\nThat counts more than you think.";

  recapDiv.textContent = intro + highlights + ending;
}

renderNotes();
