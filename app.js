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
const dictateButton = document.getElementById("dictateButton");
const dictateStatus = document.getElementById("dictateStatus");
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
const wrapSummaryCard = document.getElementById("wrapSummaryCard");
const wrapHeadline = document.getElementById("wrapHeadline");
const wrapInsight = document.getElementById("wrapInsight");
const wrapStats = document.getElementById("wrapStats");
const shareImageButton = document.getElementById("shareImageButton");
const downloadImageButton = document.getElementById("downloadImageButton");
const copyCaptionButton = document.getElementById("copyCaptionButton");

const slidesEmpty = document.getElementById("slidesEmpty");
const slidesArea = document.getElementById("slidesArea");
const slidesTrack = document.getElementById("slidesTrack");
const prevSlideButton = document.getElementById("prevSlide");
const nextSlideButton = document.getElementById("nextSlide");
const slideLabel = document.getElementById("slideLabel");
const progressBar = document.getElementById("progressBar");
const revealOverlay = document.getElementById("revealOverlay");
const revealTitle = document.getElementById("revealTitle");
const revealIntro = document.getElementById("revealIntro");
const revealStage = document.querySelector(".reveal-stage");
const revealTrack = document.getElementById("revealTrack");
const revealPrevButton = document.getElementById("revealPrevButton");
const revealNextButton = document.getElementById("revealNextButton");
const revealCounter = document.getElementById("revealCounter");
const closeRevealButton = document.getElementById("closeRevealButton");

let currentSlides = [];
let currentSlideIndex = 0;
let touchStartX = 0;
let touchEndX = 0;
let revealSlides = [];
let revealIndex = 0;
let revealTouchStartX = 0;
let revealTouchEndX = 0;
let currentRevealMood = "mood-default";
let currentWrapTheme = { mood: "warm_progress" };
let currentWrapMeta = null;
let recognition = null;
let isDictating = false;

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


function normalizeMood(mood) {
  const allowed = new Set([
    "warm_progress",
    "gentle_reflective",
    "social_bright",
    "calm_recovery"
  ]);
  return allowed.has(mood) ? mood : "warm_progress";
}

function moodClassFromTheme(theme) {
  const mood = normalizeMood(theme?.mood);
  if (mood === "gentle_reflective") return "mood-reflective";
  if (mood === "social_bright") return "mood-social";
  if (mood === "calm_recovery") return "mood-calm";
  if (mood === "warm_progress") return "mood-progress";
  return "mood-default";
}

function applyRevealMood(theme) {
  const classes = ["mood-default", "mood-progress", "mood-reflective", "mood-social", "mood-calm"];
  revealOverlay.classList.remove(...classes);
  currentRevealMood = moodClassFromTheme(theme);
  revealOverlay.classList.add(currentRevealMood);
}


function applyWrapMood(theme) {
  const classes = ["mood-default", "mood-progress", "mood-reflective", "mood-social", "mood-calm"];
  const moodClass = moodClassFromTheme(theme);
  document.body.classList.remove(...classes);
  document.body.classList.add(moodClass);
  currentWrapTheme = { mood: normalizeMood(theme?.mood) };
}

function getShareMoodLabel(theme) {
  const mood = normalizeMood(theme?.mood);
  if (mood === "gentle_reflective") return "Reflective week";
  if (mood === "social_bright") return "Social week";
  if (mood === "calm_recovery") return "Reset week";
  return "Momentum week";
}

function getThemePalette(theme) {
  const mood = normalizeMood(theme?.mood);
  if (mood === "gentle_reflective") {
    return {
      bg: [54, 41, 74],
      bg2: [142, 105, 167],
      text: [247, 240, 255],
      muted: [225, 213, 243],
      chipBg: [233, 221, 255],
      chipText: [86, 53, 118]
    };
  }
  if (mood === "social_bright") {
    return {
      bg: [255, 137, 92],
      bg2: [255, 204, 92],
      text: [63, 35, 17],
      muted: [103, 70, 45],
      chipBg: [255, 240, 216],
      chipText: [132, 74, 29]
    };
  }
  if (mood === "calm_recovery") {
    return {
      bg: [96, 158, 132],
      bg2: [196, 228, 202],
      text: [21, 52, 39],
      muted: [49, 93, 73],
      chipBg: [232, 247, 236],
      chipText: [46, 95, 74]
    };
  }
  return {
    bg: [94, 91, 212],
    bg2: [252, 180, 108],
    text: [35, 24, 18],
    muted: [85, 66, 55],
    chipBg: [246, 234, 225],
    chipText: [111, 74, 55]
  };
}

function getWrapDates(weekNotes) {
  const ordered = weekNotes.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return ordered.map((note) => new Date(note.createdAt));
}

function deriveStreaks(weekNotes) {
  const dates = getWrapDates(weekNotes);
  if (!dates.length) {
    return { longestStreak: 0, activeDays: 0, busiestDay: "No notes yet" };
  }

  const uniqueDays = [];
  const countsByDay = new Map();
  dates.forEach((date) => {
    const key = date.toISOString().slice(0, 10);
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
  });

  const dayKeys = Array.from(countsByDay.keys()).sort();
  let longestStreak = 1;
  let streak = 1;
  for (let i = 1; i < dayKeys.length; i += 1) {
    const prev = new Date(dayKeys[i - 1] + "T00:00:00");
    const curr = new Date(dayKeys[i] + "T00:00:00");
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  let busiestDayKey = dayKeys[0];
  dayKeys.forEach((key) => {
    if (countsByDay.get(key) > countsByDay.get(busiestDayKey)) busiestDayKey = key;
  });

  const busiestDayDate = new Date(busiestDayKey + "T00:00:00");
  return {
    longestStreak,
    activeDays: dayKeys.length,
    busiestDay: busiestDayDate.toLocaleDateString([], { weekday: "long" })
  };
}

function buildLocalWrapMeta(weekNotes, themeOverride = null) {
  const pattern = detectPattern(weekNotes);
  const streaks = deriveStreaks(weekNotes);
  const theme = themeOverride || inferThemeFromNotes(weekNotes);
  const headline = streaks.longestStreak >= 3
    ? `You built momentum across ${streaks.longestStreak} days in a row.`
    : weekNotes.length >= 5
      ? "This week had more shape and movement than it first seemed."
      : "A few small moments still made a real week.";
  const insight = pattern.headline;
  const shareCaption = `${getDisplayedLabel()} — ${headline} ${insight}`;
  return {
    theme,
    headline,
    insight,
    shareCaption,
    stats: [
      { label: "Notes", value: String(weekNotes.length) },
      { label: "Active days", value: String(streaks.activeDays) },
      { label: "Best streak", value: `${streaks.longestStreak} day${streaks.longestStreak === 1 ? "" : "s"}` },
      { label: "Busiest day", value: streaks.busiestDay }
    ]
  };
}

function inferThemeFromNotes(weekNotes) {
  const joined = weekNotes.map((n) => n.text.toLowerCase()).join(" | ");
  if (/friend|party|dinner|family|birthday|coffee|visited|together/.test(joined)) return { mood: "social_bright" };
  if (/rest|slept|reset|recovery|nap|quiet|walk|breathe|calm/.test(joined)) return { mood: "calm_recovery" };
  if (/thought|journal|read|reflect|therapy|museum|grateful|felt/.test(joined)) return { mood: "gentle_reflective" };
  return { mood: "warm_progress" };
}

function renderWrapSummary(meta) {
  currentWrapMeta = meta || null;
  if (!meta) {
    wrapSummaryCard.classList.add("hidden");
    wrapHeadline.textContent = "Your week will show up here.";
    wrapInsight.textContent = "Add notes through the week and the app will pull out the thread.";
    wrapStats.innerHTML = "";
    shareImageButton.disabled = true;
    downloadImageButton.disabled = true;
    copyCaptionButton.disabled = true;
    return;
  }

  applyWrapMood(meta.theme);
  wrapSummaryCard.classList.remove("hidden");
  wrapHeadline.textContent = meta.headline || "This week had a shape of its own.";
  wrapInsight.textContent = meta.insight || "A thread will appear here once your wrap is ready.";
  wrapStats.innerHTML = "";
  (meta.stats || []).forEach((stat) => {
    const pill = document.createElement("div");
    pill.className = "wrap-stat-pill";
    pill.innerHTML = `<span class="wrap-stat-label">${stat.label}</span><strong>${stat.value}</strong>`;
    wrapStats.appendChild(pill);
  });
  shareImageButton.disabled = false;
  downloadImageButton.disabled = false;
  copyCaptionButton.disabled = false;
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
  if (!weekNotes.length) {
    renderWrapSummary(null);
    return [];
  }

  try {
    const ai = await generateAiWrap(
      weekNotes.map(n => n.text),
      getWeekLabelForNotes(weekNotes)
    );

    if (ai && Array.isArray(ai.cards) && ai.cards.length) {
      const theme = ai.theme || inferThemeFromNotes(weekNotes);
      applyRevealMood(theme);
      applyWrapMood(theme);
      renderWrapSummary({
        theme,
        headline: ai.headline || buildLocalWrapMeta(weekNotes, theme).headline,
        insight: ai.insight || buildLocalWrapMeta(weekNotes, theme).insight,
        shareCaption: ai.share_caption || `${getWeekLabelForNotes(weekNotes)} — ${ai.headline || "A week with a story to tell."}`,
        stats: Array.isArray(ai.stats) && ai.stats.length ? ai.stats : buildLocalWrapMeta(weekNotes, theme).stats
      });
      return convertAiCardsToSlides(ai.cards);
    }
  } catch (error) {
    console.error("AI wrap failed, falling back to local wrap:", error);
  }

  const localMeta = buildLocalWrapMeta(weekNotes);
  applyRevealMood(localMeta.theme);
  applyWrapMood(localMeta.theme);
  renderWrapSummary(localMeta);
  return buildSlides(weekNotes);
}

function renderNotes() {
  const activeNotes = getNotesForWeek(activeWeekId);
  notesList.innerHTML = "";

  noteCount.textContent = activeNotes.length === 1 ? "1 note" : `${activeNotes.length} notes`;

  if (!activeNotes.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "Nothing yet. Start with one small thing from today.";
    return;
  }

  if (selectedView.type === "active" && !isSundayNow()) {
    emptyState.style.display = "block";
    emptyState.textContent = "Your notes are safely tucked away until Sunday.";
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
  renderWrapSummary(null);
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
  if (selectedView.type === "archive") {
    const archive = archives.find((item) => item.id === selectedView.id);
    const canOpenArchive = !!(archive && archive.slides && archive.slides.length);
    openWrapButton.disabled = !canOpenArchive;
    openWrapButton.textContent = "Open saved wrap";
    return;
  }

  const activeNotes = getNotesForWeek(activeWeekId);
  const canOpenCurrent = activeNotes.length > 0 && isSundayNow();
  openWrapButton.disabled = !canOpenCurrent;
  openWrapButton.textContent = canOpenCurrent ? "Open your wrap" : "Open your wrap (Sunday)";
}

function renderRevealSlides(slides) {
  revealSlides = slides || [];
  revealIndex = 0;
  revealTrack.innerHTML = "";

  revealSlides.forEach((slide) => {
    const slideEl = document.createElement("div");
    slideEl.className = "reveal-slide";
    slideEl.innerHTML = renderSlideContent(slide);
    revealTrack.appendChild(slideEl);
  });

  updateRevealUI();
}

function updateRevealUI() {
  revealTrack.style.transform = `translateX(-${revealIndex * 100}%)`;
  revealCounter.textContent = revealSlides.length ? `${revealIndex + 1} / ${revealSlides.length}` : "0 / 0";
  revealPrevButton.disabled = revealIndex === 0;
  revealNextButton.disabled = revealIndex >= revealSlides.length - 1;
  const controls = document.querySelector(".reveal-controls");
  if (controls) controls.classList.add("show");
}

function openReveal(slides, title, theme = null) {
  if (theme) {
    applyRevealMood(theme);
  } else if (selectedView.type === "archive") {
    applyRevealMood({ mood: "gentle_reflective" });
  } else if (!currentRevealMood) {
    applyRevealMood({ mood: "warm_progress" });
  }

  renderRevealSlides(slides);
  revealTitle.textContent = title || "Your week is ready";
  revealOverlay.classList.remove("hidden");
  revealOverlay.setAttribute("aria-hidden", "false");
  revealIntro.classList.remove("hidden");
  if (revealStage) revealStage.classList.remove("show");
  const controls = document.querySelector(".reveal-controls");
  if (controls) controls.classList.remove("show");

  window.clearTimeout(window.__weekwrapRevealTimer);
  window.__weekwrapRevealTimer = window.setTimeout(() => {
    revealIntro.classList.add("hidden");
    if (revealStage) revealStage.classList.add("show");
    updateRevealUI();
  }, 900);
}

function closeReveal() {
  revealOverlay.classList.add("hidden");
  revealOverlay.setAttribute("aria-hidden", "true");
  revealIntro.classList.remove("hidden");
  if (revealStage) revealStage.classList.remove("show");
  const controls = document.querySelector(".reveal-controls");
  if (controls) controls.classList.remove("show");
  window.clearTimeout(window.__weekwrapRevealTimer);
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
      const moodLabel = archive.meta ? ` • ${getShareMoodLabel(archive.meta.theme)}` : "";
      subtitle.textContent = `${archive.noteCount} ${archive.noteCount === 1 ? "note" : "notes"} saved${moodLabel}`;

      button.appendChild(title);
      button.appendChild(subtitle);
      weeksList.appendChild(button);
    });
}

async function showActiveWeek() {
  selectedView = { type: "active", id: activeWeekId };
  wrapTitle.textContent = "Your weekly wrap";
  notesTitle.textContent = isSundayNow() ? "This week so far" : "Your week is being saved";
  renderNotes();

  const activeNotes = getNotesForWeek(activeWeekId);
  clearSlides();

  if (!activeNotes.length) {
    applyWrapMood({ mood: "warm_progress" });
    setStatus("Waiting for Sunday", false);
    updateOpenWrapButton();
    return;
  }

  setStatus(isSundayNow() ? "Ready for Sunday wrap" : "Waiting for Sunday", false);
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
  if (archive.meta) {
    renderWrapSummary(archive.meta);
    applyWrapMood(archive.meta.theme);
  }
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
      slides: currentSlides.length ? currentSlides : buildSlides(activeNotes),
      meta: currentWrapMeta || buildLocalWrapMeta(activeNotes)
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
  updateOpenWrapButton();
}

function getDisplayedMeta() {
  if (selectedView.type === "archive") {
    const archive = archives.find((item) => item.id === selectedView.id);
    return archive ? archive.meta : null;
  }
  return currentWrapMeta;
}

function getDisplayedSlides() {
  if (selectedView.type === "archive") {
    const archive = archives.find((item) => item.id === selectedView.id);
    return archive ? archive.slides : [];
  }

  if (!isSundayNow()) return [];
  return currentSlides.length ? currentSlides : [];
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

function buildShareCanvasData() {
  const meta = getDisplayedMeta();
  const slides = getDisplayedSlides();
  if (!meta || !slides.length) return null;
  const palette = getThemePalette(meta.theme);
  const summaryBits = (meta.stats || []).slice(0, 4).map((s) => `${s.label}: ${s.value}`);
  return {
    meta,
    slides,
    palette,
    title: getDisplayedLabel(),
    bullets: summaryBits
  };
}

function renderShareCanvas() {
  const data = buildShareCanvasData();
  if (!data) return null;
  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `rgb(${data.palette.bg.join(",")})`);
  gradient.addColorStop(1, `rgb(${data.palette.bg2.join(",")})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(930, 160, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(180, 1180, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgb(${data.palette.chipBg.join(",")})`;
  roundRect(ctx, 72, 72, 240, 56, 28, true, false);
  ctx.fillStyle = `rgb(${data.palette.chipText.join(",")})`;
  ctx.font = "700 28px Inter, sans-serif";
  ctx.fillText("WeekWrap", 112, 109);

  ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
  ctx.font = "800 42px Inter, sans-serif";
  ctx.fillText(data.title, 72, 190);

  ctx.font = "700 76px Inter, sans-serif";
  wrapCanvasText(ctx, data.meta.headline, 72, 300, 880, 88);

  ctx.font = "500 34px Inter, sans-serif";
  ctx.fillStyle = `rgb(${data.palette.muted.join(",")})`;
  const insightY = wrapCanvasText(ctx, data.meta.insight, 72, 520, 860, 46);

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  roundRect(ctx, 72, insightY + 26, 936, 320, 36, true, false);

  ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
  ctx.font = "700 30px Inter, sans-serif";
  ctx.fillText(getShareMoodLabel(data.meta.theme), 112, insightY + 88);

  const stats = data.meta.stats || [];
  stats.slice(0, 4).forEach((stat, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 112 + col * 420;
    const y = insightY + 146 + row * 94;
    ctx.fillStyle = `rgb(${data.palette.muted.join(",")})`;
    ctx.font = "600 24px Inter, sans-serif";
    ctx.fillText(stat.label.toUpperCase(), x, y);
    ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
    ctx.font = "800 38px Inter, sans-serif";
    ctx.fillText(String(stat.value), x, y + 42);
  });

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  roundRect(ctx, 72, 980, 936, 220, 36, true, false);
  ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
  ctx.font = "700 26px Inter, sans-serif";
  ctx.fillText("A few moments from the week", 112, 1038);
  ctx.font = "500 28px Inter, sans-serif";
  const moments = data.slides.filter((s) => s.moment).slice(0, 3).map((s) => `• ${s.moment}`);
  wrapCanvasText(ctx, moments.join("\n"), 112, 1094, 840, 42);

  ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
  ctx.font = "600 24px Inter, sans-serif";
  ctx.fillText("Made with WeekWrap", 72, 1288);
  return canvas;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const paragraphs = String(text || "").split("\n");
  let currentY = y;
  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/);
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
        line = word;
      } else {
        line = test;
      }
    });
    if (line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  });
  return currentY;
}

async function shareCurrentWrapImage() {
  const canvas = renderShareCanvas();
  if (!canvas) return;
  const meta = getDisplayedMeta();
  const fileName = `weekwrap-${getDisplayedLabel().replace(/\s+/g, "-").toLowerCase()}.png`;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: getDisplayedLabel(),
      text: meta?.shareCaption || getDisplayedLabel(),
      files: [file]
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadCurrentWrapImage() {
  const canvas = renderShareCanvas();
  if (!canvas) return;
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = `weekwrap-${getDisplayedLabel().replace(/\s+/g, "-").toLowerCase()}.png`;
  link.click();
}

async function copyCurrentCaption() {
  const meta = getDisplayedMeta();
  if (!meta?.shareCaption) return;
  await navigator.clipboard.writeText(meta.shareCaption);
  copyCaptionButton.textContent = "Copied";
  window.setTimeout(() => {
    copyCaptionButton.textContent = "Copy caption";
  }, 1300);
}


function setDictateStatus(message) {
  if (dictateStatus) dictateStatus.textContent = message || "";
}

function stopDictation(resetLabel = true) {
  isDictating = false;
  if (recognition) {
    try { recognition.stop(); } catch (error) {}
  }
  if (dictateButton && resetLabel) dictateButton.textContent = "Dictate";
}

function setupDictation() {
  if (!dictateButton) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    dictateButton.disabled = true;
    setDictateStatus("Dictation is not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isDictating = true;
    dictateButton.textContent = "Stop";
    setDictateStatus("Listening…");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0]?.transcript || "").join(" ").trim();
    if (transcript) noteInput.value = transcript;
    setDictateStatus(transcript ? "Captured speech." : "Listening…");
  };

  recognition.onerror = (event) => {
    const label = event?.error === "not-allowed" ? "Microphone permission was denied." : "Dictation could not start.";
    setDictateStatus(label);
    isDictating = false;
    dictateButton.textContent = "Dictate";
  };

  recognition.onend = () => {
    isDictating = false;
    dictateButton.textContent = "Dictate";
    if (!noteInput.value.trim()) {
      setDictateStatus("Dictation stopped.");
    }
  };

  dictateButton.addEventListener("click", async () => {
    if (isDictating) {
      stopDictation();
      setDictateStatus("Dictation stopped.");
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      noteInput.focus();
      recognition.start();
    } catch (error) {
      setDictateStatus("Microphone permission is needed for dictation.");
    }
  });
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
  if (!weekNotes.length || !isSundayNow()) return;
  setStatus("Generating your wrap...", false);
  const slides = await generateSlidesForWeek(weekNotes);
  renderSlides(slides);
  openReveal(slides, "Your week is ready", currentWrapTheme);
  setStatus("Wrap ready", true);
  updateOpenWrapButton();
});

openWrapButton.addEventListener("click", async () => {
  if (selectedView.type === "archive") {
    const slides = getDisplayedSlides();
    if (!slides.length) return;
    openReveal(slides, "Saved week", getDisplayedMeta()?.theme || { mood: "gentle_reflective" });
    return;
  }

  const weekNotes = getNotesForWeek(activeWeekId);
  if (!weekNotes.length || !isSundayNow()) return;

  setStatus("Generating your wrap...", false);
  const slides = await generateSlidesForWeek(weekNotes);
  renderSlides(slides);
  openReveal(slides, "Your week is ready", currentWrapTheme);
  setStatus("Wrap ready", true);
  updateOpenWrapButton();
});

downloadWrapButton.addEventListener("click", downloadCurrentWrapPdf);
shareImageButton.addEventListener("click", () => shareCurrentWrapImage().catch(console.error));
downloadImageButton.addEventListener("click", downloadCurrentWrapImage);
copyCaptionButton.addEventListener("click", () => copyCurrentCaption().catch(console.error));
startNewWeekButton.addEventListener("click", startNewWeek);
backToThisWeekButton.addEventListener("click", async () => {
  await showActiveWeek();
  renderWeeksSidebar();
  updateOpenWrapButton();
});

deleteAllWeeksButton.addEventListener("click", async () => {
  archives = [];
  notes = [];
  activeWeekId = createWeekId();
  lastGeneratedWeekId = "";
  selectedView = { type: "active", id: activeWeekId };
  saveState();
  renderWeeksSidebar();
  await showActiveWeek();
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
closeRevealButton.addEventListener("click", closeReveal);
revealOverlay.addEventListener("click", (event) => {
  if (event.target === revealOverlay || event.target.classList.contains("reveal-backdrop")) {
    closeReveal();
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

applyRevealMood({ mood: "warm_progress" });
setupDictation();
saveState();
renderWeeksSidebar();
showActiveWeek();
maybeAutoGenerateSundayRecap();
