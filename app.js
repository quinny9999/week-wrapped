
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const signUpButton = document.getElementById("signUpButton");
const signInButton = document.getElementById("signInButton");
const logoutButton = document.getElementById("logoutButton");
const loginStatus = document.getElementById("loginStatus");
const openTutorialButton = document.getElementById("openTutorialButton");
const loadDemoButton = document.getElementById("loadDemoButton");
const tutorialOverlay = document.getElementById("tutorialOverlay");
const closeTutorialButton = document.getElementById("closeTutorialButton");
const tutorialDemoButton = document.getElementById("tutorialDemoButton");
const tutorialExitButton = document.getElementById("tutorialExitButton");
const openSignInModalButton = document.getElementById("openSignInModalButton");
const openSignUpModalButton = document.getElementById("openSignUpModalButton");
const authModal = document.getElementById("authModal");
const authModalBackdrop = document.getElementById("authModalBackdrop");
const closeAuthModalButton = document.getElementById("closeAuthModalButton");
const authModalTitle = document.getElementById("authModalTitle");
const authModalSubtitle = document.getElementById("authModalSubtitle");
const togglePasswordButton = document.getElementById("togglePasswordButton");
const authStatePill = document.getElementById("authStatePill");
const heroLoginStatus = document.getElementById("heroLoginStatus");
const menuToggleButton = document.getElementById("menuToggleButton");
const closeMenuButton = document.getElementById("closeMenuButton");
const historyDrawer = document.getElementById("historyDrawer");
const drawerScrim = document.getElementById("drawerScrim");


let firebaseAuth = null;
let signedInUser = null;

function setLoginStatus(message, isError = false) {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.classList.toggle("error", !!isError);
}

function updateAuthUI(user) {
  signedInUser = user || null;
  if (signedInUser) {
    setLoginStatus(`Signed in as ${signedInUser.email}`);
    if (authStatePill) authStatePill.textContent = signedInUser.email;
    if (heroLoginStatus) heroLoginStatus.textContent = "Account active. Your saved weeks travel with you.";
    openSignInModalButton?.classList.add("hidden");
    openSignUpModalButton?.classList.add("hidden");
    logoutButton?.classList.remove("hidden");
    closeAuthModal();
  } else {
    setLoginStatus("Not signed in.");
    if (authStatePill) authStatePill.textContent = "Not signed in";
    if (heroLoginStatus) heroLoginStatus.textContent = "Log in to keep your weeks saved across devices.";
    openSignInModalButton?.classList.remove("hidden");
    openSignUpModalButton?.classList.remove("hidden");
    logoutButton?.classList.add("hidden");
  }
}

function getLoginCredentials() {
  const email = (loginEmailInput?.value || "").trim();
  const password = loginPasswordInput?.value || "";
  if (!email) {
    setLoginStatus("Enter your email first.", true);
    return null;
  }
  if (!password || password.length < 6) {
    setLoginStatus("Password must be at least 6 characters.", true);
    return null;
  }
  return { email, password };
}

async function signUpWithPassword() {
  if (!firebaseAuth) {
    setLoginStatus("Firebase is not configured yet.", true);
    return;
  }
  const creds = getLoginCredentials();
  if (!creds) return;
  setLoginStatus("Creating account...");
  try {
    await firebaseAuth.createUserWithEmailAndPassword(creds.email, creds.password);
    setLoginStatus(`Account created. Signed in as ${creds.email}.`);
  } catch (err) {
    console.error(err);
    const msg = err?.code === "auth/email-already-in-use"
      ? "That email already has an account. Try Log in."
      : (err?.message || "Could not create account.");
    setLoginStatus(msg, true);
  }
}

async function signInWithPassword() {
  if (!firebaseAuth) {
    setLoginStatus("Firebase is not configured yet.", true);
    return;
  }
  const creds = getLoginCredentials();
  if (!creds) return;
  setLoginStatus("Signing in...");
  try {
    await firebaseAuth.signInWithEmailAndPassword(creds.email, creds.password);
    setLoginStatus(`Signed in as ${creds.email}.`);
  } catch (err) {
    console.error(err);
    const msg = err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential"
      ? "Wrong email or password."
      : err?.code === "auth/user-not-found"
      ? "No account found for that email. Try Sign up."
      : (err?.message || "Could not sign in.");
    setLoginStatus(msg, true);
  }
}

async function logoutFirebaseUser() {
  if (!firebaseAuth) return;
  try {
    await firebaseAuth.signOut();
    setLoginStatus("Signed out.");
  } catch (err) {
    console.error(err);
    setLoginStatus(err?.message || "Could not sign out.", true);
  }
}


function openAuthModal(mode = "signin") {
  if (!authModal) return;
  const isSignUp = mode === "signup";
  authModal.dataset.mode = isSignUp ? "signup" : "signin";
  if (authModalTitle) authModalTitle.textContent = isSignUp ? "Create your account" : "Log in";
  if (authModalSubtitle) authModalSubtitle.textContent = isSignUp
    ? "Create an account so your weeks stay saved and synced."
    : "Sign in to open your saved weeks and keep building your archive.";
  if (signInButton) signInButton.textContent = isSignUp ? "Create account" : "Log in";
  if (signUpButton) signUpButton.textContent = isSignUp ? "I already have an account" : "Create account";
  authModal.classList.remove("hidden");
  authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.add("hidden");
  authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function toggleDrawer(forceOpen = null) {
  if (!historyDrawer || !drawerScrim) return;
  const willOpen = forceOpen === null ? !historyDrawer.classList.contains("open") : !!forceOpen;
  historyDrawer.classList.toggle("open", willOpen);
  drawerScrim.classList.toggle("hidden", !willOpen);
  document.body.classList.toggle("drawer-open", willOpen);
}

function initFirebaseAuth() {
  if (!window.firebase || !window.WEEKWRAP_FIREBASE_CONFIG) {
    setLoginStatus("Firebase config missing. Add your config file.", true);
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(window.WEEKWRAP_FIREBASE_CONFIG);
  }
  firebaseAuth = firebase.auth();
  firebaseAuth.onAuthStateChanged((user) => {
    updateAuthUI(user);
  });
  signInButton?.addEventListener("click", async () => {
    if (authModal?.dataset.mode === "signup") {
      await signUpWithPassword();
    } else {
      await signInWithPassword();
    }
  });
  signUpButton?.addEventListener("click", async () => {
    if (authModal?.dataset.mode === "signup") {
      openAuthModal("signin");
    } else {
      openAuthModal("signup");
    }
  });
  logoutButton?.addEventListener("click", logoutFirebaseUser);
  openSignInModalButton?.addEventListener("click", () => openAuthModal("signin"));
  openSignUpModalButton?.addEventListener("click", () => openAuthModal("signup"));
  closeAuthModalButton?.addEventListener("click", closeAuthModal);
  authModalBackdrop?.addEventListener("click", closeAuthModal);
  togglePasswordButton?.addEventListener("click", () => {
    if (!loginPasswordInput) return;
    const isHidden = loginPasswordInput.type === "password";
    loginPasswordInput.type = isHidden ? "text" : "password";
    togglePasswordButton.textContent = isHidden ? "Hide" : "Show";
  });
}


const NOTES_KEY = "weekwrap_notes_v7";
const ARCHIVES_KEY = "weekwrap_archives_v7";
const ACTIVE_KEY = "weekwrap_active_week_v7";
const GENERATED_KEY = "weekwrap_generated_week_v7";
const ACTIVE_GENERATED_WRAP_KEY = "weekwrap_active_generated_wrap_v1";
const DEMO_USED_KEY = "weekwrap_demo_used_v1";
const EXPORT_STYLE_KEY = "weekwrap_export_style_v1";
const AI_WRAP_URL = "https://weekwrap-worker.weekwrap.workers.dev/api/generate-wrap";

let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || [];
let archives = JSON.parse(localStorage.getItem(ARCHIVES_KEY)) || [];
let activeWeekId = localStorage.getItem(ACTIVE_KEY) || createWeekId();
let lastGeneratedWeekId = localStorage.getItem(GENERATED_KEY) || "";
let activeGeneratedWrap = JSON.parse(localStorage.getItem(ACTIVE_GENERATED_WRAP_KEY) || "null");
if (activeGeneratedWrap && activeGeneratedWrap.weekId !== activeWeekId) activeGeneratedWrap = null;
let selectedView = { type: "active", id: activeWeekId };
let exportStyleChoice = localStorage.getItem(EXPORT_STYLE_KEY) || "instagram";

const noteInput = document.getElementById("noteInput");
const notesList = document.getElementById("notesList");
const emptyState = document.getElementById("emptyState");
const noteCount = document.getElementById("noteCount");
const deleteLastNoteButton = document.getElementById("deleteLastNoteButton");
const deleteThisWeekButton = document.getElementById("deleteThisWeekButton");
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
const exportStyleSelect = document.getElementById("exportStyleSelect");
const momentPromptButtons = Array.from(document.querySelectorAll(".moment-chip"));

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
  if (activeGeneratedWrap) {
    localStorage.setItem(ACTIVE_GENERATED_WRAP_KEY, JSON.stringify(activeGeneratedWrap));
  } else {
    localStorage.removeItem(ACTIVE_GENERATED_WRAP_KEY);
  }
}

function getSelectedExportStyle() {
  const value = exportStyleSelect?.value || exportStyleChoice || "instagram";
  return ["spotify", "apple", "instagram", "editorial"].includes(value) ? value : "instagram";
}

function syncExportStyleUI() {
  exportStyleChoice = getSelectedExportStyle();
  localStorage.setItem(EXPORT_STYLE_KEY, exportStyleChoice);
  if (exportStyleSelect && exportStyleSelect.value !== exportStyleChoice) {
    exportStyleSelect.value = exportStyleChoice;
  }
}

function updateDemoButtonVisibility() {
  const used = localStorage.getItem(DEMO_USED_KEY) === "1";
  loadDemoButton?.classList.toggle("hidden", used);
  tutorialDemoButton?.classList.toggle("hidden", used);
}

function hasGeneratedActiveWrap() {
  return !!(activeGeneratedWrap && activeGeneratedWrap.weekId === activeWeekId && Array.isArray(activeGeneratedWrap.slides) && activeGeneratedWrap.slides.length && activeGeneratedWrap.meta);
}

function clearActiveGeneratedWrap(save = true) {
  activeGeneratedWrap = null;
  currentSlides = [];
  currentWrapMeta = null;
  lastGeneratedWeekId = "";
  if (save) saveState();
}

function invalidateActiveGeneratedWrap(save = true) {
  clearActiveGeneratedWrap(save);
}

function storeActiveGeneratedWrap(slides, meta) {
  if (!slides?.length || !meta) return;
  activeGeneratedWrap = {
    weekId: activeWeekId,
    slides,
    meta,
    generatedAt: new Date().toISOString()
  };
  currentSlides = slides;
  currentWrapMeta = meta;
  lastGeneratedWeekId = activeWeekId;
  saveState();
}

function getCurrentGeneratedWrap() {
  return hasGeneratedActiveWrap() ? activeGeneratedWrap : null;
}


const DEMO_NOTES = [
  "Grabbed coffee with a friend and laughed way longer than expected.",
  "Finished a task I had been putting off all month.",
  "Went for a long walk and cleared my head.",
  "Cooked something decent instead of defaulting to snacks.",
  "Had one of those quiet evenings that actually felt good."
];

function openTutorial() {
  if (!tutorialOverlay) return;
  tutorialOverlay.classList.remove("hidden");
  tutorialOverlay.setAttribute("aria-hidden", "false");
}

function closeTutorial() {
  if (!tutorialOverlay) return;
  tutorialOverlay.classList.add("hidden");
  tutorialOverlay.setAttribute("aria-hidden", "true");
}

async function loadDemoWeek() {
  const alreadyUsed = localStorage.getItem(DEMO_USED_KEY) === "1";
  if (alreadyUsed) return;

  const existingNotes = getNotesForWeek(activeWeekId);
  if (existingNotes.length) {
    const shouldReplace = window.confirm("Load the demo week and replace the notes in your current week?");
    if (!shouldReplace) return;
    notes = notes.filter((note) => note.weekId !== activeWeekId);
  }

  const now = new Date();
  const demoDates = [5, 4, 3, 2, 1].map((daysAgo) => {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo);
    d.setHours(18, 0, 0, 0);
    return d.toISOString();
  });

  DEMO_NOTES.forEach((text, index) => {
    notes.push({
      id: `demo_${Date.now()}_${index}`,
      weekId: activeWeekId,
      text,
      createdAt: demoDates[index] || new Date().toISOString()
    });
  });

  invalidateActiveGeneratedWrap(false);
  saveState();
  renderNotes();
  await showActiveWeek();
  closeTutorial();

  setStatus("Generating your demo wrap...", false);
  const weekNotes = getNotesForWeek(activeWeekId);
  const slides = await generateSlidesForWeek(weekNotes);
  renderSlides(slides);
  storeActiveGeneratedWrap(slides, currentWrapMeta);

  localStorage.setItem(DEMO_USED_KEY, "1");
  updateDemoButtonVisibility();

  openReveal(slides, "Your demo week is ready", currentWrapTheme);
  setStatus("Demo wrap ready", true);
  updateOpenWrapButton();
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
  if (notesList) notesList.innerHTML = "";

  if (noteCount) noteCount.textContent = activeNotes.length === 1 ? "1 note" : `${activeNotes.length} notes`;
  if (deleteLastNoteButton) deleteLastNoteButton.disabled = activeNotes.length === 0 || selectedView.type !== "active";
  if (deleteThisWeekButton) deleteThisWeekButton.disabled = activeNotes.length === 0 || selectedView.type !== "active";

  if (!emptyState) return;

  emptyState.style.display = "block";
  if (!activeNotes.length) {
    emptyState.textContent = "Nothing yet. Start with one small thing from today.";
  } else if (selectedView.type === "archive") {
    emptyState.textContent = "Your current week notes are hidden here. Open the saved wrap to see that week.";
  } else {
    emptyState.textContent = `You have ${activeNotes.length} hidden ${activeNotes.length === 1 ? "moment" : "moments"} saved. They will appear inside the wrap.`;
  }
}

function deleteLastNote() {
  const activeNotes = getNotesForWeek(activeWeekId).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!activeNotes.length) return;
  const latest = activeNotes[0];
  const ok = window.confirm("Delete the last note you added? This cannot be undone.");
  if (!ok) return;

  notes = notes.filter((note) => note.id !== latest.id);
  invalidateActiveGeneratedWrap(false);
  saveState();
  renderNotes();
  showActiveWeek();
  setStatus("Last note deleted", false);
}

function deleteThisWeek() {
  const activeNotes = getNotesForWeek(activeWeekId);
  if (!activeNotes.length) return;
  const ok = window.confirm("Delete all notes from this week? This cannot be undone.");
  if (!ok) return;

  notes = notes.filter((note) => note.weekId !== activeWeekId);
  invalidateActiveGeneratedWrap(false);
  saveState();
  renderNotes();
  showActiveWeek();
  setStatus("This week was deleted", false);
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

  invalidateActiveGeneratedWrap(false);
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
    if (testRecapButton) {
      testRecapButton.textContent = "Saved wrap";
      testRecapButton.disabled = true;
    }
    return;
  }

  const activeNotes = getNotesForWeek(activeWeekId);
  const generated = hasGeneratedActiveWrap();
  openWrapButton.disabled = activeNotes.length === 0;
  openWrapButton.textContent = generated ? "Open generated wrap" : "Generate wrap";
  if (testRecapButton) {
    testRecapButton.textContent = generated ? "Wrap generated" : "Generate wrap";
    testRecapButton.disabled = activeNotes.length === 0 || generated;
  }
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
  notesTitle.textContent = hasGeneratedActiveWrap() ? "This week is wrapped" : "Your week is being saved";
  renderNotes();

  const activeNotes = getNotesForWeek(activeWeekId);
  clearSlides();

  if (!activeNotes.length) {
    applyWrapMood({ mood: "warm_progress" });
    setStatus("Start capturing your week", false);
    updateOpenWrapButton();
    if (shareImageButton) shareImageButton.disabled = true;
    if (downloadImageButton) downloadImageButton.disabled = true;
    if (copyCaptionButton) copyCaptionButton.disabled = true;
    return;
  }

  if (hasGeneratedActiveWrap()) {
    renderWrapSummary(activeGeneratedWrap.meta);
    applyWrapMood(activeGeneratedWrap.meta.theme);
    setStatus("Wrap generated. Reopen or export it anytime.", true);
    if (copyCaptionButton) copyCaptionButton.disabled = false;
  } else {
    applyWrapMood({ mood: "warm_progress" });
    setStatus("Ready to generate your wrap", false);
    if (shareImageButton) shareImageButton.disabled = true;
    if (downloadImageButton) downloadImageButton.disabled = true;
    if (copyCaptionButton) copyCaptionButton.disabled = true;
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
  if (archive.meta) {
    renderWrapSummary(archive.meta);
    applyWrapMood(archive.meta.theme);
  }
  setStatus("Saved week", true);
  updateOpenWrapButton();
}

function startNewWeek() {
  const activeNotes = getNotesForWeek(activeWeekId);
  const generatedWrap = getCurrentGeneratedWrap();

  if (activeNotes.length) {
    const archive = {
      id: "archive_" + Date.now(),
      originalWeekId: activeWeekId,
      label: getWeekLabelForNotes(activeNotes),
      noteCount: activeNotes.length,
      archivedAt: new Date().toISOString(),
      slides: generatedWrap?.slides?.length ? generatedWrap.slides : (currentSlides.length ? currentSlides : buildSlides(activeNotes)),
      meta: generatedWrap?.meta || currentWrapMeta || buildLocalWrapMeta(activeNotes)
    };
    archives.unshift(archive);
    notes = notes.filter((note) => note.weekId !== activeWeekId);
  }

  activeWeekId = createWeekId();
  clearActiveGeneratedWrap(false);
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
  if (hasGeneratedActiveWrap()) return activeGeneratedWrap.meta;
  return currentWrapMeta;
}

function getDisplayedSlides() {
  if (selectedView.type === "archive") {
    const archive = archives.find((item) => item.id === selectedView.id);
    return archive ? archive.slides : [];
  }

  if (hasGeneratedActiveWrap()) return activeGeneratedWrap.slides;
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

async function ensureDisplayedWrapForExport() {
  if (selectedView.type === "archive") {
    return !!(getDisplayedMeta() && getDisplayedSlides().length);
  }

  const weekNotes = getNotesForWeek(activeWeekId);
  if (!weekNotes.length) return false;

  if (hasGeneratedActiveWrap()) return true;
  if (currentWrapMeta && currentSlides.length) return true;

  setStatus("Preparing export...", false);
  const slides = await generateSlidesForWeek(weekNotes);
  if (!slides.length) return false;
  renderSlides(slides);
  storeActiveGeneratedWrap(slides, currentWrapMeta);
  setStatus("Wrap generated", true);
  updateOpenWrapButton();
  return true;
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

  const moments = slides
    .map((slide) => String(slide?.moment || slide?.text || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const closingSlide = slides.find((slide) => slide.type === "closing") || slides[slides.length - 1] || null;

  return {
    meta,
    slides,
    title: getDisplayedLabel(),
    moments,
    closingSlide
  };
}

function getExportPalette(theme, styleChoice = getSelectedExportStyle()) {
  if (styleChoice === "editorial") {
    return {
      bg: "#ffffff",
      card: "#ffffff",
      text: "#111111",
      muted: "#555555",
      accent: "#111111",
      border: "#d9d9d9",
      darkBg: "#111111",
      darkText: "#ffffff",
      darkMuted: "#d4d4d4"
    };
  }
  if (styleChoice === "apple") {
    return {
      bg: "#f5f5f7",
      card: "#ffffff",
      text: "#1d1d1f",
      muted: "#6e6e73",
      accent: "#8e8e93",
      border: "#e5e5ea",
      darkBg: "#1d1d1f",
      darkText: "#ffffff",
      darkMuted: "#d2d2d7"
    };
  }
  if (styleChoice === "spotify") {
    return {
      bg: "#150920",
      card: "rgba(255,255,255,0.12)",
      text: "#ffffff",
      muted: "rgba(255,255,255,0.78)",
      accent: "#1ed760",
      border: "rgba(255,255,255,0.14)",
      darkBg: "#070707",
      darkText: "#ffffff",
      darkMuted: "rgba(255,255,255,0.7)"
    };
  }
  return {
    bg: "#fff7f2",
    card: "#ffffff",
    text: "#291d16",
    muted: "#7a665c",
    accent: "#ff7b54",
    border: "#f3dcd1",
    darkBg: "#2f1b19",
    darkText: "#fff8f5",
    darkMuted: "#ead4cb"
  };
}

function splitCanvasLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function fitCanvasFontSize(ctx, text, maxWidth, maxLines, startSize, minSize, weight = 700, family = "Inter, sans-serif") {
  let size = startSize;
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = splitCanvasLines(ctx, text, maxWidth);
    if (lines.length <= maxLines) return size;
    size -= 2;
  }
  return minSize;
}

function drawFittedCanvasText(ctx, text, x, y, maxWidth, maxLines, size, lineHeight, color, weight = 700, family = "Inter, sans-serif") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}`;
  let lines = splitCanvasLines(ctx, text, maxWidth);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[lines.length - 1];
    while (last.length && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}…`;
  }
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + (index * lineHeight));
  });
  return y + (lines.length * lineHeight);
}

function sanitizeShareFileName(text) {
  return String(text || "weekwrap")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "weekwrap";
}

function roundRect(ctx, x, y, width, height, radius = 12, fill = false, stroke = true) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function paintExportBackground(ctx, palette, styleChoice, width, height, dark = false) {
  if (styleChoice === "spotify") {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, dark ? "#050505" : "#4b148f");
    gradient.addColorStop(0.45, dark ? "#16051f" : "#170b4d");
    gradient.addColorStop(1, dark ? "#031d14" : "#09171f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(30,215,96,0.18)";
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.18, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(width * 0.18, height * 0.8, 200, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (styleChoice === "instagram") {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (dark) {
      gradient.addColorStop(0, "#3f1b21");
      gradient.addColorStop(1, "#6f2f38");
    } else {
      gradient.addColorStop(0, "#fff7ef");
      gradient.addColorStop(0.5, "#ffe9ef");
      gradient.addColorStop(1, "#fff4dc");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  ctx.fillStyle = dark ? palette.darkBg : palette.bg;
  ctx.fillRect(0, 0, width, height);
}

function drawCapsule(ctx, x, y, width, height, radius, fillColor, text, textColor, font = "800 18px Inter, sans-serif") {
  ctx.fillStyle = fillColor;
  roundRect(ctx, x, y, width, height, radius, true, false);
  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.fillText(text, x + 22, y + (height / 2) + 6);
}

function renderExportHeader(ctx, palette, pageLabel, title, styleChoice = getSelectedExportStyle(), dark = false) {
  if (styleChoice === "editorial") {
    ctx.fillStyle = dark ? palette.darkText : palette.text;
    ctx.font = "700 16px Inter, sans-serif";
    ctx.fillText(pageLabel.toUpperCase(), 70, 82);
    ctx.font = "700 22px Inter, sans-serif";
    ctx.fillText(title, 70, 120);
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.2)" : palette.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 142);
    ctx.lineTo(1010, 142);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText("WEEKWRAP", 1010, 82);
    ctx.textAlign = "left";
    return;
  }
  if (styleChoice === "apple") {
    drawCapsule(ctx, 70, 56, 200, 42, 21, dark ? "rgba(255,255,255,0.16)" : "#ffffff", pageLabel, dark ? palette.darkText : palette.text, "700 17px Inter, sans-serif");
    ctx.fillStyle = dark ? palette.darkText : palette.text;
    ctx.font = "700 22px Inter, sans-serif";
    ctx.fillText(title, 70, 135);
    ctx.textAlign = "right";
    ctx.fillStyle = dark ? palette.darkMuted : palette.muted;
    ctx.font = "700 18px Inter, sans-serif";
    ctx.fillText("WeekWrap", 1010, 87);
    ctx.textAlign = "left";
    return;
  }
  if (styleChoice === "spotify") {
    drawCapsule(ctx, 70, 58, 220, 46, 23, "rgba(255,255,255,0.12)", pageLabel, palette.text);
    ctx.fillStyle = palette.text;
    ctx.font = "800 26px Inter, sans-serif";
    ctx.fillText(title, 70, 145);
    ctx.textAlign = "right";
    ctx.font = "900 18px Inter, sans-serif";
    ctx.fillStyle = palette.accent;
    ctx.fillText("WeekWrap", 1010, 88);
    ctx.textAlign = "left";
    return;
  }
  drawCapsule(ctx, 70, 60, 238, 44, 22, palette.accent, pageLabel, "#ffffff");
  ctx.fillStyle = palette.text;
  ctx.font = "800 24px Inter, sans-serif";
  ctx.fillText(title, 70, 140);
  ctx.textAlign = "right";
  ctx.fillStyle = palette.muted;
  ctx.font = "700 18px Inter, sans-serif";
  ctx.fillText("WeekWrap", 1010, 88);
  ctx.textAlign = "left";
}

function renderExportFooter(ctx, palette, footerText, pageNumber, totalPages, dark = false, styleChoice = getSelectedExportStyle()) {
  const textColor = dark ? palette.darkMuted : palette.muted;
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.14)" : palette.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 1270);
  ctx.lineTo(1010, 1270);
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = styleChoice === "spotify" ? "700 18px Inter, sans-serif" : "600 18px Inter, sans-serif";
  ctx.fillText(footerText, 70, 1306);
  ctx.textAlign = "right";
  ctx.fillText(`${pageNumber} / ${totalPages}`, 1010, 1306);
  ctx.textAlign = "left";
}

function createCanvas(width = 1080, height = 1350) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function renderCoverExportPage(data, totalPages) {
  const styleChoice = getSelectedExportStyle();
  const palette = getExportPalette(data.meta.theme, styleChoice);
  const canvas = createCanvas();
  const ctx = canvas.getContext("2d");
  paintExportBackground(ctx, palette, styleChoice, canvas.width, canvas.height, false);
  renderExportHeader(ctx, palette, styleChoice === "spotify" ? "Your Week Wrapped" : "Your week", data.title || "This week", styleChoice, false);

  const headline = String(data.meta.headline || "This week had a story.");
  const insight = String(data.meta.insight || "A few small moments added up into something worth remembering.");
  const stats = (data.meta.stats || []).slice(0, 4);

  if (styleChoice === "spotify") {
    ctx.fillStyle = "rgba(255,255,255,0.11)";
    roundRect(ctx, 56, 188, 968, 1022, 36, true, false);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    roundRect(ctx, 56, 188, 968, 1022, 36, false, true);
    const headlineSize = fitCanvasFontSize(ctx, headline, 860, 4, 72, 38, 900);
    let y = drawFittedCanvasText(ctx, headline, 96, 278, 860, 4, headlineSize, Math.round(headlineSize * 1.02), palette.text, 900) + 26;
    const insightSize = fitCanvasFontSize(ctx, insight, 860, 4, 28, 18, 500);
    y = drawFittedCanvasText(ctx, insight, 96, y, 860, 4, insightSize, Math.round(insightSize * 1.32), palette.muted, 500) + 44;
    stats.forEach((stat, index) => {
      const boxX = 96 + ((index % 2) * 436);
      const boxY = y + (Math.floor(index / 2) * 126);
      ctx.fillStyle = index % 2 === 0 ? "rgba(30,215,96,0.18)" : "rgba(255,255,255,0.09)";
      roundRect(ctx, boxX, boxY, 410, 108, 26, true, false);
      ctx.fillStyle = palette.muted;
      ctx.font = "700 16px Inter, sans-serif";
      ctx.fillText(String(stat.label || "").toUpperCase(), boxX + 22, boxY + 30);
      const valueSize = fitCanvasFontSize(ctx, String(stat.value || ""), 366, 2, 34, 18, 800);
      drawFittedCanvasText(ctx, String(stat.value || ""), boxX + 22, boxY + 70, 366, 2, valueSize, Math.round(valueSize * 1.12), palette.text, 800);
    });
    let momentY = y + (stats.length > 2 ? 292 : 148) + 52;
    ctx.fillStyle = palette.accent;
    ctx.font = "900 22px Inter, sans-serif";
    ctx.fillText("TOP MOMENTS", 96, momentY);
    momentY += 38;
    data.moments.slice(0, 3).forEach((moment) => {
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      roundRect(ctx, 96, momentY, 834, 96, 24, true, false);
      const size = fitCanvasFontSize(ctx, String(moment), 780, 2, 28, 18, 600);
      drawFittedCanvasText(ctx, String(moment), 122, momentY + 38, 780, 2, size, Math.round(size * 1.25), palette.text, 600);
      momentY += 114;
    });
    renderExportFooter(ctx, palette, "Bright, bold, and worth sharing", 1, totalPages, false, styleChoice);
    return canvas;
  }

  if (styleChoice === "editorial") {
    ctx.fillStyle = palette.card;
    roundRect(ctx, 70, 188, 940, 1020, 0, true, false);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 70, 188, 940, 1020, 0, false, true);
    const headlineSize = fitCanvasFontSize(ctx, headline, 860, 5, 66, 30, 700, "Georgia, serif");
    let y = drawFittedCanvasText(ctx, headline, 108, 280, 860, 5, headlineSize, Math.round(headlineSize * 1.08), palette.text, 700, "Georgia, serif") + 30;
    ctx.fillStyle = palette.text;
    ctx.font = "600 16px Inter, sans-serif";
    ctx.fillText("Summary", 108, y);
    y += 24;
    const insightSize = fitCanvasFontSize(ctx, insight, 860, 5, 28, 18, 400);
    y = drawFittedCanvasText(ctx, insight, 108, y, 860, 5, insightSize, Math.round(insightSize * 1.42), palette.muted, 400) + 34;
    ctx.beginPath();
    ctx.moveTo(108, y);
    ctx.lineTo(970, y);
    ctx.stroke();
    y += 36;
    stats.forEach((stat) => {
      ctx.fillStyle = palette.text;
      ctx.font = "700 15px Inter, sans-serif";
      ctx.fillText(String(stat.label || "").toUpperCase(), 108, y);
      const valueSize = fitCanvasFontSize(ctx, String(stat.value || ""), 670, 1, 26, 16, 600);
      ctx.textAlign = "right";
      ctx.font = `600 ${valueSize}px Inter, sans-serif`;
      ctx.fillText(String(stat.value || ""), 970, y);
      ctx.textAlign = "left";
      y += 42;
    });
    y += 12;
    ctx.beginPath();
    ctx.moveTo(108, y);
    ctx.lineTo(970, y);
    ctx.stroke();
    y += 40;
    ctx.font = "700 16px Inter, sans-serif";
    ctx.fillText("NOTABLE MOMENTS", 108, y);
    y += 34;
    data.moments.slice(0, 3).forEach((moment, index) => {
      ctx.font = "600 20px Inter, sans-serif";
      ctx.fillText(`${index + 1}.`, 108, y);
      drawFittedCanvasText(ctx, String(moment), 142, y, 808, 3, 22, 31, palette.text, 500);
      y += 94;
    });
    renderExportFooter(ctx, palette, "Minimal black & white", 1, totalPages, false, styleChoice);
    return canvas;
  }

  ctx.fillStyle = palette.card;
  roundRect(ctx, 54, 178, 972, 1040, 34, true, false);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = styleChoice === "apple" ? 1.5 : 2;
  roundRect(ctx, 54, 178, 972, 1040, 34, false, true);
  if (styleChoice === "instagram") {
    ctx.fillStyle = "rgba(255,123,84,0.14)";
    roundRect(ctx, 84, 212, 200, 36, 18, true, false);
    ctx.fillStyle = palette.accent;
    ctx.font = "800 16px Inter, sans-serif";
    ctx.fillText("Carousel cover", 108, 236);
  }
  const headlineSize = fitCanvasFontSize(ctx, headline, 888, 4, styleChoice === "apple" ? 58 : 62, 34, 800);
  let y = drawFittedCanvasText(ctx, headline, 96, 305, 888, 4, headlineSize, Math.round(headlineSize * 1.12), palette.text, 800) + 26;
  const insightSize = fitCanvasFontSize(ctx, insight, 888, 4, styleChoice === "apple" ? 28 : 30, 20, 500);
  y = drawFittedCanvasText(ctx, insight, 96, y, 888, 4, insightSize, Math.round(insightSize * 1.38), palette.muted, 500) + 40;
  const boxW = 426;
  const boxH = styleChoice === "apple" ? 106 : 118;
  const gapX = 24;
  const gapY = 22;
  stats.forEach((stat, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const boxX = 96 + col * (boxW + gapX);
    const boxY = y + row * (boxH + gapY);
    ctx.fillStyle = styleChoice === "apple" ? "#fbfbfd" : palette.bg;
    roundRect(ctx, boxX, boxY, boxW, boxH, 24, true, false);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    roundRect(ctx, boxX, boxY, boxW, boxH, 24, false, true);
    ctx.fillStyle = palette.muted;
    ctx.font = "700 17px Inter, sans-serif";
    ctx.fillText(String(stat.label || "").toUpperCase(), boxX + 22, boxY + 33);
    const value = String(stat.value || "");
    const valueSize = fitCanvasFontSize(ctx, value, boxW - 44, 2, 34, 18, 800);
    drawFittedCanvasText(ctx, value, boxX + 22, boxY + 76, boxW - 44, 2, valueSize, Math.round(valueSize * 1.15), palette.text, 800);
  });
  const momentsTop = y + (stats.length > 2 ? (boxH * 2 + gapY) : boxH) + 58;
  ctx.fillStyle = palette.text;
  ctx.font = "800 24px Inter, sans-serif";
  ctx.fillText(styleChoice === "apple" ? "Highlights" : "Top moments", 96, momentsTop);
  let momentY = momentsTop + 52;
  const moments = data.moments.length ? data.moments.slice(0, 3) : ["A few small moments added up into something worth remembering."];
  moments.forEach((moment) => {
    if (styleChoice === "instagram") {
      ctx.fillStyle = "rgba(255,255,255,0.74)";
      roundRect(ctx, 96, momentY - 28, 866, 78, 22, true, false);
    }
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(108, momentY - 8, 7, 0, Math.PI * 2);
    ctx.fill();
    const momentSize = fitCanvasFontSize(ctx, String(moment), 830, 3, 26, 18, 500);
    momentY = drawFittedCanvasText(ctx, String(moment), 130, momentY, 830, 3, momentSize, Math.round(momentSize * 1.35), palette.text, 500) + 20;
  });
  renderExportFooter(ctx, palette, styleChoice === "apple" ? "Clean, quiet, polished" : "Made for a shareable carousel", 1, totalPages, false, styleChoice);
  return canvas;
}

function renderMomentExportPage(data, momentText, index, totalPages) {
  const styleChoice = getSelectedExportStyle();
  const palette = getExportPalette(data.meta.theme, styleChoice);
  const canvas = createCanvas();
  const ctx = canvas.getContext("2d");
  paintExportBackground(ctx, palette, styleChoice, canvas.width, canvas.height, false);
  renderExportHeader(ctx, palette, `Moment ${index + 1}`, data.title || "This week", styleChoice, false);

  if (styleChoice === "editorial") {
    ctx.fillStyle = palette.card;
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.2;
    roundRect(ctx, 70, 210, 940, 920, 0, true, true);
    ctx.fillStyle = palette.text;
    ctx.font = "900 110px Georgia, serif";
    ctx.fillText("“", 104, 320);
    const size = fitCanvasFontSize(ctx, String(momentText), 760, 8, 50, 24, 500, "Georgia, serif");
    drawFittedCanvasText(ctx, String(momentText), 160, 340, 760, 8, size, Math.round(size * 1.25), palette.text, 500, "Georgia, serif");
    ctx.fillStyle = palette.muted;
    ctx.font = "600 20px Inter, sans-serif";
    ctx.fillText("An ordinary detail, made memorable.", 104, 1045);
    renderExportFooter(ctx, palette, "Editorial quote page", index + 2, totalPages, false, styleChoice);
    return canvas;
  }
  if (styleChoice === "spotify") {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, 70, 208, 940, 930, 36, true, false);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    roundRect(ctx, 70, 208, 940, 930, 36, false, true);
    ctx.fillStyle = palette.accent;
    ctx.font = "900 96px Inter, sans-serif";
    ctx.fillText(`#${index + 1}`, 104, 320);
    const size = fitCanvasFontSize(ctx, String(momentText), 802, 8, 46, 24, 700);
    drawFittedCanvasText(ctx, String(momentText), 104, 420, 802, 8, size, Math.round(size * 1.22), palette.text, 700);
    ctx.fillStyle = palette.muted;
    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillText("One of the moments that shaped your week.", 104, 1040);
    renderExportFooter(ctx, palette, "A highlight from your week", index + 2, totalPages, false, styleChoice);
    return canvas;
  }
  ctx.fillStyle = palette.card;
  roundRect(ctx, 70, 190, 940, 930, 34, true, false);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  roundRect(ctx, 70, 190, 940, 930, 34, false, true);
  if (styleChoice === "instagram") {
    ctx.fillStyle = "rgba(255,123,84,0.14)";
    roundRect(ctx, 102, 226, 190, 34, 17, true, false);
    ctx.fillStyle = palette.accent;
    ctx.font = "800 15px Inter, sans-serif";
    ctx.fillText(`Slide ${index + 2}`, 126, 248);
  }
  ctx.fillStyle = styleChoice === "apple" ? "#c6c6cc" : palette.accent;
  ctx.font = "900 92px Georgia, serif";
  ctx.fillText("“", 112, 312);
  const size = fitCanvasFontSize(ctx, String(momentText), 760, 8, styleChoice === "apple" ? 48 : 52, 28, 500, styleChoice === "apple" ? "Inter, sans-serif" : "Georgia, serif");
  drawFittedCanvasText(ctx, String(momentText), 150, 330, 760, 8, size, Math.round(size * 1.28), palette.text, 500, styleChoice === "apple" ? "Inter, sans-serif" : "Georgia, serif");
  ctx.fillStyle = palette.muted;
  ctx.font = "600 22px Inter, sans-serif";
  ctx.fillText(styleChoice === "apple" ? "A clean snapshot from your week." : "One of the moments that shaped your week.", 112, 1040);
  renderExportFooter(ctx, palette, styleChoice === "apple" ? "Refined and understated" : "Swipe to keep going", index + 2, totalPages, false, styleChoice);
  return canvas;
}

function renderClosingExportPage(data, totalPages) {
  const styleChoice = getSelectedExportStyle();
  const palette = getExportPalette(data.meta.theme, styleChoice);
  const canvas = createCanvas();
  const ctx = canvas.getContext("2d");
  paintExportBackground(ctx, palette, styleChoice, canvas.width, canvas.height, true);
  renderExportHeader(ctx, palette, styleChoice === "editorial" ? "Final note" : "What it adds up to", data.title || "This week", styleChoice, true);

  const closingTitle = String(data.closingSlide?.title || data.meta.insight || "Your week was worth remembering.");
  const closingBody = String(data.closingSlide?.detail || data.meta.headline || "Even an ordinary week can still carry its own shape.");

  if (styleChoice === "editorial") {
    ctx.fillStyle = palette.darkBg;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 70, 212, 940, 906, 0, true, true);
    const titleSize = fitCanvasFontSize(ctx, closingTitle, 820, 4, 62, 30, 700, "Georgia, serif");
    let y = drawFittedCanvasText(ctx, closingTitle, 110, 330, 820, 4, titleSize, Math.round(titleSize * 1.08), palette.darkText, 700, "Georgia, serif") + 34;
    const bodySize = fitCanvasFontSize(ctx, closingBody, 820, 5, 28, 18, 500);
    y = drawFittedCanvasText(ctx, closingBody, 110, y, 820, 5, bodySize, Math.round(bodySize * 1.4), palette.darkMuted, 500) + 44;
    ctx.fillStyle = palette.darkText;
    ctx.font = "800 18px Inter, sans-serif";
    ctx.fillText("WEEKWRAP", 110, y);
    renderExportFooter(ctx, palette, "Black & white finish", totalPages, totalPages, true, styleChoice);
    return canvas;
  }
  if (styleChoice === "spotify") {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, 70, 212, 940, 906, 34, true, false);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    roundRect(ctx, 70, 212, 940, 906, 34, false, true);
    const titleSize = fitCanvasFontSize(ctx, closingTitle, 820, 4, 66, 34, 900);
    let y = drawFittedCanvasText(ctx, closingTitle, 110, 330, 820, 4, titleSize, Math.round(titleSize * 1.04), palette.darkText, 900) + 30;
    const bodySize = fitCanvasFontSize(ctx, closingBody, 820, 5, 28, 18, 500);
    y = drawFittedCanvasText(ctx, closingBody, 110, y, 820, 5, bodySize, Math.round(bodySize * 1.35), palette.darkMuted, 500) + 44;
    drawCapsule(ctx, 110, y, 246, 52, 26, palette.accent, "WeekWrap", "#04140b", "900 20px Inter, sans-serif");
    renderExportFooter(ctx, palette, "Made to be shared", totalPages, totalPages, true, styleChoice);
    return canvas;
  }
  if (styleChoice === "apple") {
    ctx.fillStyle = "rgba(255,255,255,0.98)";
    roundRect(ctx, 70, 212, 940, 906, 34, true, false);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 70, 212, 940, 906, 34, false, true);
    const titleSize = fitCanvasFontSize(ctx, closingTitle, 820, 4, 58, 28, 800);
    let y = drawFittedCanvasText(ctx, closingTitle, 110, 330, 820, 4, titleSize, Math.round(titleSize * 1.12), "#1d1d1f", 800) + 28;
    const bodySize = fitCanvasFontSize(ctx, closingBody, 820, 5, 30, 18, 500);
    y = drawFittedCanvasText(ctx, closingBody, 110, y, 820, 5, bodySize, Math.round(bodySize * 1.38), "#6e6e73", 500) + 44;
    drawCapsule(ctx, 110, y, 220, 48, 24, "#1d1d1f", "WeekWrap", "#ffffff", "800 19px Inter, sans-serif");
    renderExportFooter(ctx, palette, "Clean luxury finish", totalPages, totalPages, true, styleChoice);
    return canvas;
  }
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 70, 212, 940, 906, 34, true, false);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  roundRect(ctx, 70, 212, 940, 906, 34, false, true);
  const titleSize = fitCanvasFontSize(ctx, closingTitle, 820, 4, 60, 30, 800);
  let y = drawFittedCanvasText(ctx, closingTitle, 110, 330, 820, 4, titleSize, Math.round(titleSize * 1.14), palette.darkText, 800) + 28;
  const bodySize = fitCanvasFontSize(ctx, closingBody, 820, 5, 30, 19, 500);
  y = drawFittedCanvasText(ctx, closingBody, 110, y, 820, 5, bodySize, Math.round(bodySize * 1.38), palette.darkMuted, 500) + 40;
  drawCapsule(ctx, 110, y, 250, 50, 25, palette.accent, "WeekWrap", "#ffffff", "800 20px Inter, sans-serif");
  renderExportFooter(ctx, palette, "Made for a social carousel", totalPages, totalPages, true, styleChoice);
  return canvas;
}

function buildExportPageCanvases(countOverride = null) {
  const data = buildShareCanvasData();
  if (!data) return [];

  const allPages = [];
  const totalMomentPages = Math.min(3, data.moments.length);
  const totalPages = 1 + totalMomentPages + 1;

  allPages.push(() => renderCoverExportPage(data, totalPages));
  data.moments.slice(0, 3).forEach((moment, index) => {
    allPages.push(() => renderMomentExportPage(data, moment, index, totalPages));
  });
  allPages.push(() => renderClosingExportPage(data, totalPages));

  const requested = Math.max(1, Math.min(countOverride || allPages.length, allPages.length));
  return allPages.slice(0, requested).map((factory) => factory());
}

function askExportPageCount(totalPages, actionLabel) {
  const suggested = Math.min(totalPages, 3);
  const input = window.prompt(`How many pages do you want to ${actionLabel}? Enter 1-${totalPages} or type all.`, String(suggested));
  if (input === null) return null;
  const trimmed = String(input).trim().toLowerCase();
  if (!trimmed || trimmed === "all") return totalPages;
  const parsed = parseInt(trimmed, 10);
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= totalPages) return parsed;
  window.alert(`Please enter a number between 1 and ${totalPages}, or type all.`);
  return null;
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve) => {
    if (!canvas) {
      resolve(null);
      return;
    }

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        try {
          resolve(dataUrlToBlob(canvas.toDataURL("image/png")));
        } catch (err) {
          console.warn("Canvas data URL fallback failed.", err);
          resolve(null);
        }
      }, "image/png");
      return;
    }

    try {
      resolve(dataUrlToBlob(canvas.toDataURL("image/png")));
    } catch (err) {
      console.warn("Canvas blob fallback failed.", err);
      resolve(null);
    }
  });
}

async function triggerBlobDownload(blob, fileName) {
  if (!blob) return false;
  try {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return true;
  } catch (err) {
    console.warn("Blob download failed.", err);
    return false;
  }
}

function triggerCanvasDataUrlDownload(canvas, fileName) {
  if (!canvas) return false;
  try {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.rel = "noopener";
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    link.remove();
    return true;
  } catch (err) {
    console.warn("Data URL download failed.", err);
    return false;
  }
}

function openCanvasInNewTab(canvas) {
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "noopener");
    if (!win) return false;
    win.document.write(`<title>WeekWrap export</title><img src="${dataUrl}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />`);
    win.document.close();
    return true;
  } catch (err) {
    console.warn("Open canvas fallback failed.", err);
    return false;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exportSelectedPageCanvases(actionLabel) {
  const previewPages = buildExportPageCanvases();
  const totalPages = previewPages.length;
  if (!totalPages) return null;
  const selectedCount = askExportPageCount(totalPages, actionLabel);
  if (selectedCount === null) return null;
  return previewPages.slice(0, selectedCount);
}

async function shareCurrentWrapImage() {
  const originalText = shareImageButton ? shareImageButton.textContent : "";
  if (shareImageButton) {
    shareImageButton.disabled = true;
    shareImageButton.textContent = "Preparing...";
  }

  try {
    const ready = await ensureDisplayedWrapForExport();
    if (!ready) {
      setStatus("Generate a wrap first", false);
      return;
    }

    const canvases = await exportSelectedPageCanvases("share");
    if (!canvases?.length) return;

    const baseName = `weekwrap-${sanitizeShareFileName(getDisplayedLabel())}`;
    const meta = getDisplayedMeta();

    // Native share is attempted, but failure should never stop the user from getting the images.
    try {
      if (window.isSecureContext && navigator.share) {
        const files = [];
        for (let i = 0; i < canvases.length; i += 1) {
          const blob = await canvasToPngBlob(canvases[i]);
          if (!blob) continue;
          files.push(new File([blob], `${baseName}-${i + 1}.png`, { type: "image/png" }));
        }
        if (files.length && (!navigator.canShare || navigator.canShare({ files }))) {
          await navigator.share({
            title: getDisplayedLabel(),
            text: meta?.shareCaption || getDisplayedLabel(),
            files
          });
          setStatus(`Shared ${files.length} ${files.length === 1 ? "page" : "pages"}`, true);
          return;
        }
      }
    } catch (shareErr) {
      console.warn("Native share failed, falling back to direct downloads.", shareErr);
    }

    let downloaded = 0;
    canvases.forEach((canvas, index) => {
      const ok = triggerCanvasDataUrlDownload(canvas, `${baseName}-${index + 1}.png`);
      if (ok) downloaded += 1;
    });

    if (!downloaded && canvases[0]) {
      openCanvasInNewTab(canvases[0]);
    }
    setStatus(downloaded ? `Downloaded ${downloaded} ${downloaded === 1 ? "page" : "pages"} instead` : "Opened image in a new tab", true);
  } catch (err) {
    console.error("Share image failed:", err);
    setStatus(`Share failed: ${err?.message || "unknown error"}`, false);
  } finally {
    if (shareImageButton) {
      shareImageButton.disabled = false;
      shareImageButton.textContent = originalText || "Share image";
    }
  }
}

async function downloadCurrentWrapImage() {
  const originalText = downloadImageButton ? downloadImageButton.textContent : "";
  if (downloadImageButton) {
    downloadImageButton.disabled = true;
    downloadImageButton.textContent = "Preparing...";
  }

  try {
    const ready = await ensureDisplayedWrapForExport();
    if (!ready) {
      setStatus("Generate a wrap first", false);
      return;
    }

    const canvases = await exportSelectedPageCanvases("download");
    if (!canvases?.length) return;

    const baseName = `weekwrap-${sanitizeShareFileName(getDisplayedLabel())}`;
    let downloaded = 0;
    canvases.forEach((canvas, index) => {
      const ok = triggerCanvasDataUrlDownload(canvas, `${baseName}-${index + 1}.png`);
      if (ok) downloaded += 1;
    });

    if (!downloaded && canvases[0]) {
      openCanvasInNewTab(canvases[0]);
    }

    setStatus(downloaded ? `Downloaded ${downloaded} ${downloaded === 1 ? "page" : "pages"}` : "Opened image in a new tab", true);
  } catch (err) {
    console.error("Download image failed:", err);
    setStatus(`Download failed: ${err?.message || "unknown error"}`, false);
  } finally {
    if (downloadImageButton) {
      downloadImageButton.disabled = false;
      downloadImageButton.textContent = originalText || "Download image";
    }
  }
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

if (testRecapButton) {
  testRecapButton.addEventListener("click", async () => {
    const weekNotes = getNotesForWeek(activeWeekId);
    if (!weekNotes.length || hasGeneratedActiveWrap()) return;
    setStatus("Generating your wrap...", false);
    const slides = await generateSlidesForWeek(weekNotes);
    renderSlides(slides);
    storeActiveGeneratedWrap(slides, currentWrapMeta);
    openReveal(slides, "Your week is ready", currentWrapTheme);
    setStatus("Wrap generated", true);
    updateOpenWrapButton();
  });
}

openWrapButton.addEventListener("click", async () => {
  if (selectedView.type === "archive") {
    const slides = getDisplayedSlides();
    if (!slides.length) return;
    openReveal(slides, "Saved week", getDisplayedMeta()?.theme || { mood: "gentle_reflective" });
    return;
  }

  const existingSlides = getDisplayedSlides();
  if (hasGeneratedActiveWrap() && existingSlides.length) {
    openReveal(existingSlides, "Your week is ready", getDisplayedMeta()?.theme || currentWrapTheme);
    setStatus("Reopened your generated wrap", true);
    return;
  }

  const weekNotes = getNotesForWeek(activeWeekId);
  if (!weekNotes.length) return;

  setStatus("Generating your wrap...", false);
  const slides = await generateSlidesForWeek(weekNotes);
  renderSlides(slides);
  storeActiveGeneratedWrap(slides, currentWrapMeta);
  openReveal(slides, "Your week is ready", currentWrapTheme);
  setStatus("Wrap generated", true);
  updateOpenWrapButton();
});

if (downloadWrapButton) downloadWrapButton.addEventListener("click", downloadCurrentWrapPdf);
shareImageButton.addEventListener("click", () => shareCurrentWrapImage().catch(console.error));
downloadImageButton.addEventListener("click", downloadCurrentWrapImage);
exportStyleSelect?.addEventListener("change", syncExportStyleUI);
syncExportStyleUI();
copyCaptionButton.addEventListener("click", () => copyCurrentCaption().catch(console.error));
momentPromptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.dataset.prompt || "";
    noteInput.value = prompt;
    noteInput.focus();
    noteInput.setSelectionRange(noteInput.value.length, noteInput.value.length);
  });
});
deleteLastNoteButton?.addEventListener("click", deleteLastNote);
deleteThisWeekButton?.addEventListener("click", deleteThisWeek);
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
  clearActiveGeneratedWrap(false);
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

openTutorialButton?.addEventListener("click", openTutorial);
loadDemoButton?.addEventListener("click", loadDemoWeek);
closeTutorialButton?.addEventListener("click", closeTutorial);
tutorialExitButton?.addEventListener("click", closeTutorial);
tutorialDemoButton?.addEventListener("click", loadDemoWeek);
tutorialOverlay?.addEventListener("click", (event) => {
  if (event.target === tutorialOverlay || event.target.classList.contains("tutorial-backdrop")) {
    closeTutorial();
  }
});

applyRevealMood({ mood: "warm_progress" });
setupDictation();
saveState();
renderWeeksSidebar();
showActiveWeek();
updateDemoButtonVisibility();
maybeAutoGenerateSundayRecap();



initFirebaseAuth();


menuToggleButton?.addEventListener("click", () => toggleDrawer(true));
drawerScrim?.addEventListener("click", () => toggleDrawer(false));
historyDrawer?.addEventListener("click", (event) => {
  event.stopPropagation();
});
menuToggleButton?.addEventListener("click", (event) => {
  event.stopPropagation();
});
closeMenuButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDrawer(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuthModal();
    toggleDrawer(false);
  }
});
