const NOTES_KEY = "weekwrap_notes_v7";
const ARCHIVES_KEY = "weekwrap_archives_v7";
const ACTIVE_KEY = "weekwrap_active_week_v7";
const GENERATED_KEY = "weekwrap_generated_week_v7";
const AI_WRAP_URL = "https://weekwrap-worker.weekwrap.workers.dev/api/generate-wrap";

let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || [];
let archives = JSON.parse(localStorage.getItem(ARCHIVES_KEY)) || [];
let activeWeekId = localStorage.getItem(ACTIVE_KEY) || createWeekId();
let lastGeneratedWeekId = localStorage.getItem(GENERATED_KEY) || "";
let selectedView = { type: "active", id: activeWeekId };

const noteInput = document.getElementById("noteInput");
const notesList = document.getElementById("notesList");
const emptyState = document.getElementById("emptyState");
const noteCount = document.getElementById("noteCount");
const statusBadge = document.getElementById("statusBadge");
const addButton = document.getElementById("addButton");
const testRecapButton = document.getElementById("testRecapButton");
const weeksList = document.getElementById("weeksList");
const weeksEmpty = document.getElementById("weeksEmpty");
const wrapTitle = document.getElementById("wrapTitle");
const notesTitle = document.getElementById("notesTitle");
const downloadWrapButton = document.getElementById("downloadWrapButton");
const startNewWeekButton = document.getElementById("startNewWeekButton");
const backToThisWeekButton = document.getElementById("backToThisWeekButton");

const slidesEmpty = document.getElementById("slidesEmpty");
const slidesArea = document.getElementById("slidesArea");
const slidesTrack = document.getElementById("slidesTrack");
const prevSlideButton = document.getElementById("prevSlide");
const nextSlideButton = document.getElementById("nextSlide");
const slideLabel = document.getElementById("slideLabel");
const progressBar = document.getElementById("progressBar");

let currentSlides = [];
let currentSlideIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

function createWeekId() {
  return "week_" + Date.now();
}

function saveState() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  localStorage.setItem(ARCHIVES_KEY, JSON.stringify(archives));
  localStorage.setItem(ACTIVE_KEY, activeWeekId);
  localStorage.setItem(GENERATED_KEY, lastGeneratedWeekId);
}

function getNotesForWeek(weekId) {
  return notes.filter((note) => note.weekId === weekId);
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatWeekLabelFromDate(dateString) {
  const start = new Date(dateString);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return start.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " - " +
    end.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getWeekLabelForNotes(weekNotes) {
  if (!weekNotes.length) return "New week";
  const sorted = weekNotes.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return formatWeekLabelFromDate(sorted[0].createdAt);
}

function isSundayNow() {
  return new Date().getDay() === 0;
}

async function generateAiWrap(notes, weekLabel) {
  const response = await fetch(AI_WRAP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      notes,
      weekLabel
    })
  });

  if (!response.ok) {
    throw new Error("Failed to generate AI wrap");
  }

  return await response.json();
}

function convertAiCardsToSlides(cards) {
  return cards.map((card, index) => {
    if (card.type === "opening") {
      return {
        type: "opening",
        kicker: "This was your week",
        title: card.text,
        detail: ""
      };
    }

    if (card.type === "moment") {
      return {
        type: "moment",
        kicker: index <= 1 ? "A moment" : "Another moment",
        moment: card.text,
        detail: ""
      };
    }

    if (card.type === "insight") {
      return {
        type: "pattern",
        kicker: "A thread",
        headline: card.text,
        detail: ""
      };
    }

    return {
      type: "closing",
      kicker: "What it adds up to",
      title: card.text,
      detail: ""
    };
  });
}

async function generateSlidesForWeek(weekNotes) {
  if (!weekNotes.length) return [];

  try {
    const ai = await generateAiWrap(
      weekNotes.map(n => n.text),
      getWeekLabelForNotes(weekNotes)
    );

    if (ai && Array.isArray(ai.cards) && ai.cards.length) {
      return convertAiCardsToSlides(ai.cards);
    }
  } catch (error) {
    console.error("AI wrap failed, falling back to local wrap:", error);
  }

  return buildSlides(weekNotes);
}

function renderNotes() {
  const activeNotes = getNotesForWeek(activeWeekId);
  notesList.innerHTML = "";

  noteCount.textContent = activeNotes.length === 1 ? "1 note" : `${activeNotes.length} notes`;

  if (activeNotes.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  activeNotes
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((note) => {
      const li = document.createElement("li");
      li.className = "note-item";

      const text = document.createElement("div");
      text.className = "note-text";
      text.textContent = note.text;

      const time = document.createElement("div");
      time.className = "note-time";
      time.textContent = formatTime(note.createdAt);

      li.appendChild(text);
      li.appendChild(time);
      notesList.appendChild(li);
    });
}

function addNote() {
  const text = noteInput.value.trim();
  if (!text) return;

  notes.push({
    id: String(Date.now()),
    weekId: activeWeekId,
    text,
    createdAt: new Date().toISOString()
  });

  saveState();
  renderNotes();

  if (selectedView.type === "active") {
    showActiveWeek();
  }

  noteInput.value = "";
  noteInput.focus();
}

function detectPattern(weekNotes) {
  const joined = weekNotes.map(n => n.text.toLowerCase()).join(" | ");

  if (/friend|mom|dad|family|sister|brother|partner|helped/.test(joined)) {
    return {
      headline: "You made space for other people this week.",
      detail: "Not every meaningful week is about big milestones. Sometimes it is about showing up where you were needed."
    };
  }

  if (/booked|finally|sent|called|appointment|dentist|emailed|submitted/.test(joined)) {
    return {
      headline: "You handled things you had been meaning to do.",
      detail: "Those small acts of follow-through matter because they clear mental space and move life forward."
    };
  }

  if (/ran|walked|gym|exercise|slept|rested|ate|cooked|cleaned|shower/.test(joined)) {
    return {
      headline: "You took care of yourself in real, practical ways.",
      detail: "It might not feel dramatic in the moment, but self-maintenance is still effort, and still worth noticing."
    };
  }

  return {
    headline: "Your week was built out of small, real moments.",
    detail: "A life is rarely made of grand highlights. Most of it is lived here, in the ordinary things you actually did."
  };
}

function buildSlides(weekNotes) {
  const cleanNotes = weekNotes.map((n) => n.text).slice(0, 5);
  const pattern = detectPattern(weekNotes);

  if (!cleanNotes.length) return [];

  const slides = [];

  slides.push({
    type: "opening",
    kicker: "This was your week",
    title: cleanNotes.length >= 5
      ? "You fit more into this week than it probably felt like."
      : "Even this week had more shape to it than it first seemed.",
    detail: "Small moments count because they are still your life."
  });

  slides.push({
    type: "count",
    kicker: "You showed up",
    count: cleanNotes.length,
    label: cleanNotes.length === 1 ? "moment captured" : "moments captured",
    detail: "Not every week looks dramatic while you are living it."
  });

  cleanNotes.slice(0, 3).forEach((text, index) => {
    slides.push({
      type: "moment",
      kicker: `Moment ${index + 1}`,
      moment: text,
      detail: "This was one of the things that made up your week."
    });
  });

  slides.push({
    type: "pattern",
    kicker: "A pattern",
    headline: pattern.headline,
    detail: pattern.detail
  });

  slides.push({
    type: "reframe",
    kicker: "The reframe",
    title: "It may not have felt like much while it was happening.",
    detail: "But looking back, this was still a week in which you kept moving."
  });

  slides.push({
    type: "closing",
    kicker: "What it adds up to",
    title: "You were here for your actual life.",
    detail: "And that matters more than it usually gets credit for."
  });

  return slides;
}

function renderSlideContent(slide) {
  switch (slide.type) {
    case "opening":
      return `
        <div class="slide-inner slide-opening">
          <div class="slide-kicker">${slide.kicker}</div>
          <div class="slide-main">
            <div class="big-serif">${slide.title}</div>
            <div class="support-copy">${slide.detail}</div>
          </div>
          <div class="slide-footer">Take your time with this one.</div>
        </div>
      `;
    case "count":
      return `
        <div class="slide-inner slide-count">
          <div class="slide-kicker">${slide.kicker}</div>
          <div class="slide-main">
            <div class="count-number">${slide.count}</div>
            <div class="count-label">${slide.label}</div>
          </div>
          <div class="slide-footer">${slide.detail}</div>
        </div>
      `;
    case "moment":
      return `
        <div class="slide-inner slide-moment">
          <div class="slide-kicker">${slide.kicker}</div>
          <div class="slide-main">
            <div class="moment-text">${slide.moment}</div>
            <div class="moment-index">One of the pieces of your week</div>
          </div>
          <div class="slide-footer">${slide.detail}</div>
        </div>
      `;
    case "pattern":
      return `
        <div class="slide-inner slide-pattern">
          <div class="slide-kicker">${slide.kicker}</div>
          <div class="slide-main">
            <div class="pattern-text">${slide.headline}</div>
            <div class="pattern-detail">${slide.detail}</div>
          </div>
          <div class="slide-footer">Sometimes the shape of a week only appears afterward.</div>
        </div>
      `;
    case "reframe":
      return `
        <div class="slide-inner slide-reframe">
          <div class="slide-kicker">${slide.kicker}</div>
          <div class="slide-main">
            <div class="big-serif">${slide.title}</div>
            <div class="support-copy">${slide.detail}</div>
          </div>
          <div class="slide-footer">That counts more than you might think.</div>
        </div>
      `;
    case "closing":
      return `
        <div class="slide-inner slide-closing">
          <div class="slide-kicker">${slide.kicker}</div>
          <div class="slide-main">
            <div class="big-serif">${slide.title}</div>
            <div class="support-copy">${slide.detail}</div>
          </div>
          <div class="slide-footer">See you next Sunday.</div>
        </div>
      `;
    default:
      return "";
  }
}

function renderSlides(slides) {
  currentSlides = slides;
  currentSlideIndex = 0;
  slidesTrack.innerHTML = "";

  slides.forEach((slide) => {
    const slideCard = document.createElement("div");
    slideCard.className = "slide-card";
    slideCard.innerHTML = renderSlideContent(slide);
    slidesTrack.appendChild(slideCard);
  });

  slidesEmpty.classList.add("hidden");
  slidesArea.classList.remove("hidden");
  updateSlidesUI();
}

function clearSlides() {
  currentSlides = [];
  currentSlideIndex = 0;
  slidesTrack.innerHTML = "";
  slidesArea.classList.add("hidden");
  slidesEmpty.classList.remove("hidden");
  updateSlidesUI();
}

function updateSlidesUI() {
  if (!currentSlides.length) {
    slideLabel.textContent = "0 / 0";
    progressBar.style.width = "0%";
    prevSlideButton.disabled = true;
    nextSlideButton.disabled = true;
    slidesTrack.style.transform = "translateX(0)";
    return;
  }

  slidesTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
  slideLabel.textContent = `${currentSlideIndex + 1} / ${currentSlides.length}`;
  progressBar.style.width = `${((currentSlideIndex + 1) / currentSlides.length) * 100}%`;

  prevSlideButton.disabled = currentSlideIndex === 0;
  nextSlideButton.disabled = currentSlideIndex === currentSlides.length - 1;
}

function setStatus(text, isReady) {
  statusBadge.textContent = text;
  statusBadge.classList.toggle("ready", !!isReady);
}

function renderWeeksSidebar() {
  weeksList.innerHTML = "";

  if (!archives.length) {
    weeksEmpty.style.display = "block";
    return;
  }

  weeksEmpty.style.display = "none";

  archives
    .slice()
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
    .forEach((archive) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "week-card" + (
        selectedView.type === "archive" && selectedView.id === archive.id ? " active" : ""
      );

      button.addEventListener("click", () => {
        selectedView = { type: "archive", id: archive.id };
        showArchive(archive.id);
        renderWeeksSidebar();
      });

      const title = document.createElement("div");
      title.className = "week-title";
      title.textContent = archive.label;

      const subtitle = document.createElement("div");
      subtitle.className = "week-subtitle";
      subtitle.textContent = `${archive.noteCount} ${archive.noteCount === 1 ? "note" : "notes"} saved`;

      button.appendChild(title);
      button.appendChild(subtitle);
      weeksList.appendChild(button);
    });
}

async function showActiveWeek() {
  selectedView = { type: "active", id: activeWeekId };
  wrapTitle.textContent = "Your weekly wrap";
  notesTitle.textContent = "This week so far";
  renderNotes();

  const activeNotes = getNotesForWeek(activeWeekId);

  if (!activeNotes.length) {
    clearSlides();
    setStatus("Waiting for Sunday", false);
    return;
  }

  if (isSundayNow()) {
    clearSlides();
    setStatus("Generating your wrap...", false);
    const slides = await generateSlidesForWeek(activeNotes);
    renderSlides(slides);
    lastGeneratedWeekId = activeWeekId;
    saveState();
    setStatus("Wrap ready", true);
  } else {
    clearSlides();
    setStatus("Waiting for Sunday", false);
  }
}

function showArchive(archiveId) {
  const archive = archives.find((item) => item.id === archiveId);
  if (!archive) return;

  wrapTitle.textContent = archive.label;
  notesTitle.textContent = "Current week notes";
  renderNotes();
  renderSlides(archive.slides);
  setStatus("Saved week", true);
}

function startNewWeek() {
  const activeNotes = getNotesForWeek(activeWeekId);

  if (activeNotes.length) {
    const archive = {
      id: "archive_" + Date.now(),
      originalWeekId: activeWeekId,
      label: getWeekLabelForNotes(activeNotes),
      noteCount: activeNotes.length,
      archivedAt: new Date().toISOString(),
      slides: buildSlides(activeNotes)
    };
    archives.unshift(archive);
    notes = notes.filter((note) => note.weekId !== activeWeekId);
  }

  activeWeekId = createWeekId();
  lastGeneratedWeekId = "";
  selectedView = { type: "active", id: activeWeekId };

  saveState();
  renderWeeksSidebar();
  showActiveWeek();
}

function maybeAutoGenerateSundayRecap() {
  if (!isSundayNow()) return;

  const activeNotes = getNotesForWeek(activeWeekId);
  if (!activeNotes.length) return;

  if (lastGeneratedWeekId !== activeWeekId) {
    lastGeneratedWeekId = activeWeekId;
    saveState();
  }

  if (selectedView.type === "active") {
    showActiveWeek();
  }
}

function getDisplayedSlides() {
  if (selectedView.type === "archive") {
    const archive = archives.find((item) => item.id === selectedView.id);
    return archive ? archive.slides : [];
  }

  if (!isSundayNow()) return [];
  return buildSlides(getNotesForWeek(activeWeekId));
}

function getDisplayedLabel() {
  if (selectedView.type === "archive") {
    const archive = archives.find((item) => item.id === selectedView.id);
    return archive ? archive.label : "WeekWrap";
  }

  const activeNotes = getNotesForWeek(activeWeekId);
  return activeNotes.length ? getWeekLabelForNotes(activeNotes) : "Current week";
}

function wrapTextLines(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

function downloadCurrentWrapPdf() {
  const slides = getDisplayedSlides();
  if (!slides.length || !window.jspdf) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = pageWidth - (margin * 2);

  doc.setFillColor(250, 244, 236);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor(47, 36, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("WeekWrap", margin, 72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(getDisplayedLabel(), margin, 98);

  let y = 140;

  slides.forEach((slide, index) => {
    if (y > pageHeight - 150) {
      doc.addPage();
      doc.setFillColor(250, 244, 236);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      y = 72;
    }

    doc.setDrawColor(225, 210, 198);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 92, 16, 16, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(115, 75, 55);
    doc.text(slide.kicker || `Slide ${index + 1}`, margin + 18, y + 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(47, 36, 28);

    let body = "";
    if (slide.title) body = slide.title;
    else if (slide.count !== undefined) body = `${slide.count} ${slide.label}`;
    else if (slide.moment) body = slide.moment;
    else if (slide.headline) body = slide.headline;
    else body = "Your week";

    let textY = wrapTextLines(doc, body, margin + 18, y + 48, contentWidth - 36, 18);

    if (slide.detail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(119, 104, 93);
      wrapTextLines(doc, slide.detail, margin + 18, Math.min(textY + 8, y + 74), contentWidth - 36, 13);
    }

    y += 110;
  });

  doc.save(`weekwrap-${getDisplayedLabel().replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

addButton.addEventListener("click", addNote);
noteInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addNote();
});

testRecapButton.addEventListener("click", async () => {
  const weekNotes = getNotesForWeek(activeWeekId);
  if (!weekNotes.length) return;
  setStatus("Generating test wrap...", false);
  const slides = await generateSlidesForWeek(weekNotes);
  renderSlides(slides);
  setStatus("Test wrap", true);
});

downloadWrapButton.addEventListener("click", downloadCurrentWrapPdf);
startNewWeekButton.addEventListener("click", startNewWeek);
backToThisWeekButton.addEventListener("click", async () => {
  await showActiveWeek();
  renderWeeksSidebar();
});

prevSlideButton.addEventListener("click", () => {
  if (currentSlideIndex > 0) {
    currentSlideIndex -= 1;
    updateSlidesUI();
  }
});

nextSlideButton.addEventListener("click", () => {
  if (currentSlideIndex < currentSlides.length - 1) {
    currentSlideIndex += 1;
    updateSlidesUI();
  }
});

slidesTrack.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX;
});

slidesTrack.addEventListener("touchend", (event) => {
  touchEndX = event.changedTouches[0].screenX;
  const delta = touchEndX - touchStartX;

  if (Math.abs(delta) < 40) return;

  if (delta < 0 && currentSlideIndex < currentSlides.length - 1) {
    currentSlideIndex += 1;
    updateSlidesUI();
  } else if (delta > 0 && currentSlideIndex > 0) {
    currentSlideIndex -= 1;
    updateSlidesUI();
  }
});

saveState();
renderWeeksSidebar();
showActiveWeek();
maybeAutoGenerateSundayRecap();
