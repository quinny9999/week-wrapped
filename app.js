
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
const DEMO_USED_KEY = "weekwrap_demo_used_v1";
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

function updateDemoButtonVisibility() {
  const used = localStorage.getItem(DEMO_USED_KEY) === "1";
  loadDemoButton?.classList.toggle("hidden", used);
  tutorialDemoButton?.classList.toggle("hidden", used);
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

  saveState();
  renderNotes();
  await showActiveWeek();
  closeTutorial();

  setStatus("Generating your demo wrap...", false);
  const weekNotes = getNotesForWeek(activeWeekId);
  const slides = await generateSlidesForWeek(weekNotes);
  renderSlides(slides);

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
  const moments = slides
    .map((slide) => String(slide?.moment || slide?.text || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    meta,
    slides,
    palette,
    title: getDisplayedLabel(),
    moments
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

function loadCanvasImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function renderShareCanvas() {
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

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(920, 160, 170, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(160, 1170, 220, 0, Math.PI * 2);
  ctx.fill();

  const shellX = 54;
  const shellY = 54;
  const shellW = 972;
  const shellH = 1242;

  ctx.fillStyle = "rgba(6,10,24,0.16)";
  roundRect(ctx, shellX, shellY, shellW, shellH, 40, true, false);

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(ctx, shellX + 22, shellY + 22, shellW - 44, shellH - 44, 30, true, false);

  ctx.fillStyle = `rgb(${data.palette.chipBg.join(",")})`;
  roundRect(ctx, shellX + 42, shellY + 42, 200, 48, 24, true, false);
  ctx.fillStyle = `rgb(${data.palette.chipText.join(",")})`;
  ctx.font = "700 22px Inter, sans-serif";
  ctx.fillText("WeekWrap", shellX + 70, shellY + 72);

  const logo = await loadCanvasImage("data:image/png;base64,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");
  if (logo) {
    const maxW = 110;
    const maxH = 42;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    ctx.drawImage(logo, shellX + shellW - 42 - w, shellY + 44, w, h);
  }

  ctx.fillStyle = `rgb(${data.palette.muted.join(",")})`;
  ctx.font = "600 24px Inter, sans-serif";
  ctx.fillText(data.title, shellX + 42, shellY + 130);

  const headlineWidth = shellW - 84;
  const headlineSize = fitCanvasFontSize(ctx, data.meta.headline, headlineWidth, 3, 72, 38, 800);
  let y = drawFittedCanvasText(
    ctx,
    data.meta.headline,
    shellX + 42,
    shellY + 184,
    headlineWidth,
    3,
    headlineSize,
    Math.round(headlineSize * 1.08),
    `rgb(${data.palette.text.join(",")})`,
    800
  );

  y += 18;

  const insightSize = fitCanvasFontSize(ctx, data.meta.insight, headlineWidth, 4, 32, 22, 500);
  y = drawFittedCanvasText(
    ctx,
    data.meta.insight,
    shellX + 42,
    y,
    headlineWidth,
    4,
    insightSize,
    Math.round(insightSize * 1.34),
    `rgb(${data.palette.muted.join(",")})`,
    500
  );

  y += 24;

  const statsX = shellX + 42;
  const statsY = y;
  const statsW = shellW - 84;
  const statsH = 244;

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(ctx, statsX, statsY, statsW, statsH, 28, true, false);

  ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
  ctx.font = "700 24px Inter, sans-serif";
  ctx.fillText(getShareMoodLabel(data.meta.theme), statsX + 24, statsY + 38);

  const stats = (data.meta.stats || []).slice(0, 4);
  stats.forEach((stat, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const boxX = statsX + 24 + (col * 440);
    const boxY = statsY + 76 + (row * 78);

    drawFittedCanvasText(
      ctx,
      String(stat.label || "").toUpperCase(),
      boxX,
      boxY,
      360,
      2,
      18,
      22,
      `rgb(${data.palette.muted.join(",")})`,
      700
    );

    const value = String(stat.value || "");
    const valueSize = fitCanvasFontSize(ctx, value, 360, 2, 34, 18, 800);
    drawFittedCanvasText(
      ctx,
      value,
      boxX,
      boxY + 30,
      360,
      2,
      valueSize,
      Math.round(valueSize * 1.08),
      `rgb(${data.palette.text.join(",")})`,
      800
    );
  });

  y = statsY + statsH + 22;

  const momentsX = shellX + 42;
  const momentsY = y;
  const momentsW = shellW - 84;
  const momentsH = 300;

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(ctx, momentsX, momentsY, momentsW, momentsH, 28, true, false);

  ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
  ctx.font = "700 24px Inter, sans-serif";
  ctx.fillText("A few moments from the week", momentsX + 24, momentsY + 38);

  const moments = data.moments.length ? data.moments : ["A few small moments added up into something worth remembering."];
  let momentY = momentsY + 84;
  moments.slice(0, 3).forEach((moment) => {
    momentY = drawFittedCanvasText(
      ctx,
      `• ${moment}`,
      momentsX + 24,
      momentY,
      momentsW - 48,
      2,
      24,
      32,
      `rgb(${data.palette.muted.join(",")})`,
      500
    ) + 12;
  });

  ctx.fillStyle = `rgb(${data.palette.text.join(",")})`;
  ctx.font = "600 20px Inter, sans-serif";
  ctx.fillText("Made with WeekWrap", shellX + 42, shellY + shellH - 36);

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
  const sizeMatch = String(ctx.font || "").match(/(\d+)px/);
  const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 24;
  return drawFittedCanvasText(ctx, text, x, y, maxWidth, 99, size, lineHeight, ctx.fillStyle, 500);
}

async function shareCurrentWrapImage() {
  const originalText = shareImageButton ? shareImageButton.textContent : "";
  if (shareImageButton) {
    shareImageButton.disabled = true;
    shareImageButton.textContent = "Preparing...";
  }

  try {
    const canvas = await renderShareCanvas();
    if (!canvas) {
      console.warn("No share canvas available.");
      return;
    }

    const meta = getDisplayedMeta();
    const fileName = `weekwrap-${sanitizeShareFileName(getDisplayedLabel())}.png`;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      console.warn("Could not create image blob.");
      return;
    }

    try {
      const file = new File([blob], fileName, { type: "image/png" });
      if (window.isSecureContext && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: getDisplayedLabel(),
          text: meta?.shareCaption || getDisplayedLabel(),
          files: [file]
        });
        return;
      }
    } catch (shareErr) {
      console.warn("Native share unavailable, falling back to download.", shareErr);
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error("Share image failed:", err);
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
    const canvas = await renderShareCanvas();
    if (!canvas) {
      console.warn("No download canvas available.");
      return;
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      console.warn("Could not create image blob.");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weekwrap-${sanitizeShareFileName(getDisplayedLabel())}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error("Download image failed:", err);
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

testRecapButton.addEventListener("click", async () => {
  const weekNotes = getNotesForWeek(activeWeekId);
  if (!weekNotes.length) return;
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
