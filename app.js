const NOTES_KEY = "weekwrap_notes_v7";
const ARCHIVES_KEY = "weekwrap_archives_v7";
const ACTIVE_KEY = "weekwrap_active_week_v7";
const GENERATED_KEY = "weekwrap_generated_week_v7";

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
const openWrapButton = document.getElementById("openWrapButton");
const startNewWeekButton = document.getElementById("startNewWeekButton");
const backToThisWeekButton = document.getElementById("backToThisWeekButton");
const deleteAllWeeksButton = document.getElementById("deleteAllWeeksButton");

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


function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant(options, seedText, offset = 0) {
  if (!options || !options.length) return "";
  const index = (hashString(seedText + "::" + offset) % options.length);
  return options[index];
}

function getSlideSeed(weekNotes) {
  return weekNotes.map((n) => n.text).join("|") + "::" + weekNotes.length;
}

function getInsightAndTheme(weekNotes) {
  const joined = weekNotes.map(n => n.text.toLowerCase()).join(" ");
  if (/help|friend|family|mom|dad|partner|sister|brother/.test(joined)) {
    return {
      headline: pickVariant([
        "You showed up for other people.",
        "A lot of this week was about being there for someone.",
        "Part of this week was shaped by care for other people."
      ], joined, 1),
      theme: "connection"
    };
  }
  if (/finally|booked|called|sent|appointment|dentist|emailed|submitted|paperwork/.test(joined)) {
    return {
      headline: pickVariant([
        "You handled things you were putting off.",
        "This week included some overdue follow-through.",
        "You got to things that had been waiting."
      ], joined, 2),
      theme: "follow_through"
    };
  }
  if (/run|gym|walk|exercise|slept|rested|cook|clean|shower/.test(joined)) {
    return {
      headline: pickVariant([
        "You chose effort.",
        "You took care of yourself in practical ways.",
        "Some of this week was quiet self-maintenance."
      ], joined, 3),
      theme: "self_care"
    };
  }
  return {
    headline: pickVariant([
      "You didn't stop.",
      "You kept the week moving.",
      "You kept showing up, even quietly."
    ], joined, 4),
    theme: "steady"
  };
}

function getOpeningLine(weekNotes, seed) {
  const count = weekNotes.length;
  const options = count >= 6 ? [
    "This week held more than it looked like.",
    "You fit more into this week than it probably felt.",
    "This week had more shape than it first seemed."
  ] : [
    "This week counted.",
    "You didn't waste this week.",
    "This week mattered more than it felt."
  ];
  return pickVariant(options, seed, 5);
}

function getClosingLine(seed) {
  return pickVariant([
    "You showed up more than you think.",
    "This was a real week, and it counted.",
    "Small things still add up to a life."
  ], seed, 6);
}

function getReflectionLine(theme, seed) {
  const byTheme = {
    connection: [
      "Sometimes a week is defined by who you showed up for.",
      "Care counts, even when it looks ordinary.",
      "Not every meaningful week is loud."
    ],
    follow_through: [
      "Small acts of follow-through change the feel of a week.",
      "Getting to one delayed thing can shift a lot.",
      "Progress is often quieter than it sounds."
    ],
    self_care: [
      "A lot of real life is maintenance, and that still matters.",
      "Ordinary care is still care.",
      "Looking after yourself is part of the week too."
    ],
    steady: [
      "Nothing dramatic. Still real.",
      "Most weeks are built out of ordinary things.",
      "This is what a real week looks like."
    ]
  };
  return pickVariant(byTheme[theme] || byTheme.steady, seed, 7);
}

function getMomentKicker(index, seed) {
  const sets = [
    ["A moment", "Another moment", "One more moment"],
    ["Part of the week", "Also this", "And this too"],
    ["This happened", "Then this", "And later"]
  ];
  const chosen = sets[hashString(seed + "::kickers") % sets.length];
  return chosen[Math.min(index, chosen.length - 1)];
}

function buildSlides(weekNotes) {
  const cleanNotes = weekNotes.slice(0, 4);
  if (!cleanNotes.length) return [];

  const seed = getSlideSeed(cleanNotes);
  const insight = getInsightAndTheme(cleanNotes);
  const slides = [];

  slides.push({
    type: "opening",
    kicker: "This was your week",
    title: getOpeningLine(cleanNotes, seed),
    detail: ""
  });

  slides.push({
    type: "count",
    kicker: "You showed up",
    count: cleanNotes.length,
    label: cleanNotes.length === 1 ? "moment captured" : "moments captured",
    detail: ""
  });

  cleanNotes.slice(0, Math.min(2, cleanNotes.length)).forEach((note, index) => {
    slides.push({
      type: "moment",
      kicker: getMomentKicker(index, seed),
      moment: note.text,
      detail: ""
    });
  });

  slides.push({
    type: "pattern",
    kicker: "A thread",
    headline: insight.headline,
    detail: ""
  });

  slides.push({
    type: "reframe",
    kicker: "A thought",
    title: getReflectionLine(insight.theme, seed),
    detail: ""
  });

  slides.push({
    type: "closing",
    kicker: "What it adds up to",
    title: getClosingLine(seed),
    detail: ""
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

function updateOpenWrapButton() {
  const slides = getDisplayedSlides();
  const canOpen = slides.length > 0;
  openWrapButton.disabled = !canOpen;

  if (selectedView.type === "archive") {
    openWrapButton.textContent = canOpen ? "Open saved wrap" : "Open saved wrap";
    return;
  }

  if (canOpen) {
    openWrapButton.textContent = "Open your wrap";
  } else {
    openWrapButton.textContent = "Open your wrap (Sunday)";
  }
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

function showActiveWeek() {
  selectedView = { type: "active", id: activeWeekId };
  wrapTitle.textContent = "Your weekly wrap";
  notesTitle.textContent = "This week so far";
  renderNotes();

  const activeNotes = getNotesForWeek(activeWeekId);

  if (!activeNotes.length) {
    clearSlides();
    setStatus("Start small.", false);
    updateOpenWrapButton();
    return;
  }

  clearSlides();

  if (isSundayNow()) {
    lastGeneratedWeekId = activeWeekId;
    saveState();
    setStatus("Your week is ready", true);
  } else {
    setStatus(`${activeNotes.length} ${activeNotes.length === 1 ? "moment" : "moments"} saved. Waiting for Sunday`, false);
  }

  updateOpenWrapButton();
}

function showArchive(archiveId) {
  const archive = archives.find((item) => item.id === archiveId);
  if (!archive) return;

  selectedView = { type: "archive", id: archive.id };
  wrapTitle.textContent = archive.label;
  notesTitle.textContent = "Current week notes";
  renderNotes();
  clearSlides();
  setStatus("Saved week", true);
  updateOpenWrapButton();
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

testRecapButton.addEventListener("click", () => {
  const slides = buildSlides(getNotesForWeek(activeWeekId));
  if (!slides.length) return;
  renderSlides(slides);
  setStatus("Test wrap", true);
});

openWrapButton.addEventListener("click", () => {
  const slides = getDisplayedSlides();
  if (!slides.length) return;
  const title = selectedView.type === "archive" ? "Saved week" : "Your week is ready";
  openReveal(slides, title);
});
downloadWrapButton.addEventListener("click", downloadCurrentWrapPdf);
startNewWeekButton.addEventListener("click", startNewWeek);
backToThisWeekButton.addEventListener("click", () => {
  showActiveWeek();
  renderWeeksSidebar();
  updateOpenWrapButton();
});

deleteAllWeeksButton.addEventListener("click", () => {
  archives = [];
  notes = [];
  activeWeekId = createWeekId();
  lastGeneratedWeekId = "";
  selectedView = { type: "active", id: activeWeekId };
  saveState();
  renderWeeksSidebar();
  showActiveWeek();
  updateOpenWrapButton();
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


const revealOverlay = document.getElementById("revealOverlay");
const revealTitle = document.getElementById("revealTitle");
const revealIntro = document.getElementById("revealIntro");
const revealTrack = document.getElementById("revealTrack");
const revealStage = document.querySelector(".reveal-stage");
const revealControls = document.querySelector(".reveal-controls");
const revealPrevButton = document.getElementById("revealPrevButton");
const revealNextButton = document.getElementById("revealNextButton");
const revealCounter = document.getElementById("revealCounter");
const closeRevealButton = document.getElementById("closeRevealButton");

let revealSlides = [];
let revealIndex = 0;
let revealTouchStartX = 0;
let revealTouchEndX = 0;

function renderNotesLocked() {
  const activeNotes = getNotesForWeek(activeWeekId);
  noteCount.textContent = activeNotes.length === 1 ? "1 moment saved" : `${activeNotes.length} moments saved`;
  notesList.innerHTML = "";
  notesList.classList.add("hidden-week-content");
  emptyState.style.display = "block";
  if (activeNotes.length === 0) {
    emptyState.textContent = "Nothing yet. Start with one small thing from today.";
  } else {
    emptyState.textContent = "Your moments are tucked away until reveal day.";
  }
}

function openReveal(slides, titleText) {
  if (!slides || !slides.length) return;
  revealSlides = slides;
  revealIndex = 0;
  revealTitle.textContent = titleText || "Your week is ready";
  revealTrack.innerHTML = "";
  slides.forEach((slide) => {
    const node = document.createElement("div");
    node.className = "reveal-slide";
    node.innerHTML = renderSlideContent(slide);
    revealTrack.appendChild(node);
  });
  revealOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  revealIntro.classList.remove("hidden");
  revealStage.classList.remove("show");
  revealControls.classList.remove("show");
  updateRevealUI();
  setTimeout(() => {
    revealIntro.classList.add("hidden");
    revealStage.classList.add("show");
    revealControls.classList.add("show");
    updateRevealUI();
  }, 700);
}

function closeReveal() {
  revealOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

function updateRevealUI() {
  if (!revealSlides.length) {
    revealCounter.textContent = "0 / 0";
    revealPrevButton.disabled = true;
    revealNextButton.disabled = true;
    return;
  }
  revealTrack.style.transform = `translateX(-${revealIndex * 100}%)`;
  revealCounter.textContent = `${revealIndex + 1} / ${revealSlides.length}`;
  revealPrevButton.disabled = revealIndex === 0;
  revealNextButton.disabled = revealIndex === revealSlides.length - 1;
}

// Override showActiveWeek to lock content before Sunday
showActiveWeek = function() {
  selectedView = { type: "active", id: activeWeekId };
  wrapTitle.textContent = "Your weekly wrap";
  notesTitle.textContent = "This week so far";

  const activeNotes = getNotesForWeek(activeWeekId);
  if (isSundayNow()) {
    renderNotes();
  } else {
    renderNotesLocked();
  }

  if (!activeNotes.length) {
    clearSlides();
    setStatus("Start small.", false);
    return;
  }

  if (isSundayNow()) {
    clearSlides();
    setStatus("Your week is ready", true);
    const slides = buildSlides(activeNotes);
    if (lastGeneratedWeekId !== activeWeekId) {
      lastGeneratedWeekId = activeWeekId;
      saveState();
      setTimeout(() => openReveal(slides, "Your week is ready"), 250);
    }
  } else {
    clearSlides();
    const n = activeNotes.length;
    let anticipation = "It starts small.";
    if (n <= 2) anticipation = "It starts small.";
    else if (n <= 4) anticipation = "You're building something.";
    else if (n <= 6) anticipation = "This week has more shape than it feels.";
    else anticipation = "This is becoming a real week.";
    setStatus(`${n} moments saved. ${anticipation}`, false);
  }
};

// Override showArchive to use full-screen reveal
showArchive = function(archiveId) {
  const archive = archives.find((item) => item.id === archiveId);
  if (!archive) return;

  wrapTitle.textContent = archive.label;
  notesTitle.textContent = "This week so far";
  renderNotesLocked();
  clearSlides();
  setStatus("Saved week", true);
  openReveal(archive.slides, archive.label);
};

// Make test button open the same full-screen reveal
testRecapButton.replaceWith(testRecapButton.cloneNode(true));
const freshTestButton = document.getElementById("testRecapButton");
freshTestButton.addEventListener("click", () => {
  const slides = buildSlides(getNotesForWeek(activeWeekId));
  if (!slides.length) return;
  openReveal(slides, "Test wrap");
});

// events for reveal
closeRevealButton.addEventListener("click", closeReveal);
revealPrevButton.addEventListener("click", () => {
  if (revealIndex > 0) {
    revealIndex -= 1;
    updateRevealUI();
  }
});
revealNextButton.addEventListener("click", () => {
  if (revealIndex < revealSlides.length - 1) {
    revealIndex += 1;
    updateRevealUI();
  }
});
revealTrack.addEventListener("touchstart", (event) => {
  revealTouchStartX = event.changedTouches[0].screenX;
});
revealTrack.addEventListener("touchend", (event) => {
  revealTouchEndX = event.changedTouches[0].screenX;
  const delta = revealTouchEndX - revealTouchStartX;
  if (Math.abs(delta) < 40) return;
  if (delta < 0 && revealIndex < revealSlides.length - 1) {
    revealIndex += 1;
    updateRevealUI();
  } else if (delta > 0 && revealIndex > 0) {
    revealIndex -= 1;
    updateRevealUI();
  }
});

// Re-run current view with new behavior
showActiveWeek();
updateOpenWrapButton();
