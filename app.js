const STORAGE_KEY = "weekwrap_notes";
const RECAPS_KEY = "weekwrap_recaps";

let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let savedRecaps = JSON.parse(localStorage.getItem(RECAPS_KEY)) || {};

const noteInput = document.getElementById("noteInput");
const notesList = document.getElementById("notesList");
const emptyState = document.getElementById("emptyState");
const noteCount = document.getElementById("noteCount");
const statusBadge = document.getElementById("statusBadge");
const addButton = document.getElementById("addButton");
const testRecapButton = document.getElementById("testRecapButton");

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

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function getWeekKey(date = new Date()) {
  const start = getStartOfWeek(date);
  return start.toISOString().slice(0, 10);
}

function getCurrentWeekNotes() {
  const currentWeekKey = getWeekKey(new Date());
  return notes.filter((note) => getWeekKey(note.createdAt) === currentWeekKey);
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function saveRecaps() {
  localStorage.setItem(RECAPS_KEY, JSON.stringify(savedRecaps));
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderNotes() {
  const currentWeekNotes = getCurrentWeekNotes();
  notesList.innerHTML = "";

  noteCount.textContent =
    currentWeekNotes.length === 1 ? "1 note" : `${currentWeekNotes.length} notes`;

  if (currentWeekNotes.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  currentWeekNotes
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
    text,
    createdAt: new Date().toISOString()
  });

  saveNotes();
  renderNotes();
  maybeShowExistingRecap();
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

  if (cleanNotes.length === 0) {
    return [
      {
        type: "opening",
        kicker: "Your week",
        title: "Your week is still waiting to be written.",
        detail: "Add one small thing and your wrap will start to take shape."
      }
    ];
  }

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

function generateAndStoreRecap() {
  const currentWeekKey = getWeekKey(new Date());
  const currentWeekNotes = getCurrentWeekNotes();
  const slides = buildSlides(currentWeekNotes);

  savedRecaps[currentWeekKey] = {
    generatedAt: new Date().toISOString(),
    slides
  };

  saveRecaps();
  renderSlides(slides);
  setReadyState(true);
}

function setReadyState(isReady) {
  if (isReady) {
    statusBadge.textContent = "This week is ready";
    statusBadge.classList.add("ready");
  } else {
    statusBadge.textContent = "Waiting for Sunday";
    statusBadge.classList.remove("ready");
  }
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
      return `
        <div class="slide-inner">
          <div class="slide-kicker">Your week</div>
          <div class="slide-main">Something happened here.</div>
          <div class="slide-footer">And it mattered.</div>
        </div>
      `;
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

function updateSlidesUI() {
  slidesTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
  slideLabel.textContent = `${currentSlideIndex + 1} / ${currentSlides.length}`;
  progressBar.style.width = `${((currentSlideIndex + 1) / currentSlides.length) * 100}%`;

  prevSlideButton.disabled = currentSlideIndex === 0;
  nextSlideButton.disabled = currentSlideIndex === currentSlides.length - 1;
}

function maybeAutoGenerateSundayRecap() {
  const today = new Date();
  const isSunday = today.getDay() === 0;
  const currentWeekKey = getWeekKey(today);

  if (isSunday) {
    if (!savedRecaps[currentWeekKey]) {
      generateAndStoreRecap();
    } else {
      renderSlides(savedRecaps[currentWeekKey].slides);
      setReadyState(true);
    }
  } else {
    maybeShowExistingRecap();
  }
}

function maybeShowExistingRecap() {
  const currentWeekKey = getWeekKey(new Date());
  if (savedRecaps[currentWeekKey] && savedRecaps[currentWeekKey].slides) {
    renderSlides(savedRecaps[currentWeekKey].slides);
    setReadyState(true);
  } else {
    slidesEmpty.classList.remove("hidden");
    slidesArea.classList.add("hidden");
    setReadyState(false);
  }
}

addButton.addEventListener("click", addNote);
noteInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addNote();
});

testRecapButton.addEventListener("click", generateAndStoreRecap);

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

renderNotes();
maybeAutoGenerateSundayRecap();
