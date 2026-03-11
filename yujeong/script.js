const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const REASON_TEXT =
  "어떤 부분이 불편하셨나요? 기다려야 했던 순간일 수도 있고, 어디를 눌러야 할지 잠깐 망설였던 장면일 수도 있습니다. 저는 그런 불편을 발견하고, 더 나은 흐름으로 바꾸는 사람입니다.";

const state = {
  screen: "boot",
  muted: false,
  typingToken: 0,
  storyRunning: false,
  bootReady: false,
  checkpointRunning: false,
  checkpointToken: 0,
  checkpointStep: 1,
};

const BOOT_DELAY_MS = 5000;
const CHECKPOINT_DELAY_MS = 5000;

function showScreen(name) {
  state.screen = name;
  $("#boot")?.classList.toggle("is-hidden", name !== "boot");
  $("#play")?.classList.toggle("is-hidden", name !== "play");
  $("#reason")?.classList.toggle("is-hidden", name !== "reason");
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function appendLog(text, kind = "ok") {
  const log = $("#log");
  if (!log) return;

  const li = document.createElement("li");
  const tag = document.createElement("span");
  tag.className = `tag ${kind}`;
  tag.textContent = kind.toUpperCase();
  li.appendChild(tag);
  li.appendChild(document.createTextNode(` ${text}`));
  log.appendChild(li);

  while (log.children.length > 4) {
    log.removeChild(log.firstElementChild);
  }
}

function onBootAdvance() {
  if (!state.bootReady) return;
  appendLog("BOOT COMPLETE", "ok");
  showScreen("play");
  $("#btnStart")?.focus();
}

function setButtonBusy(btn, busy) {
  if (!btn) return;
  btn.classList.toggle("is-busy", busy);
  btn.disabled = busy;
}

function bump(btn) {
  if (!btn) return;
  btn.classList.remove("bump");
  btn.offsetHeight;
  btn.classList.add("bump");
  window.setTimeout(() => btn.classList.remove("bump"), 180);
}

function typeText(el, text, { minDelay = 16, maxDelay = 32 } = {}) {
  if (!el) return Promise.resolve();

  const token = ++state.typingToken;
  el.textContent = "";

  const caret = document.createElement("span");
  caret.className = "type-caret";
  caret.textContent = "█";
  el.appendChild(caret);

  const chars = Array.from(text);
  let i = 0;

  return new Promise((resolve) => {
    const tick = () => {
      if (token !== state.typingToken) return resolve();
      if (i >= chars.length) return resolve();

      caret.before(document.createTextNode(chars[i]));
      i += 1;
      window.setTimeout(tick, randInt(minDelay, maxDelay));
    };

    tick();
  });
}

function setDialog(text) {
  const txt = $("#dialogText");
  if (txt) txt.textContent = text;
}

function setPortfolioDelayText(text) {
  const note = $("#portfolioDelayText");
  if (note) note.textContent = text;
}

function resetCheckpointButtons() {
  const buttons = {
    1: $("#checkpointOne"),
    2: $("#checkpointTwo"),
    3: $("#checkpointThree"),
  };

  state.checkpointRunning = false;
  state.checkpointToken += 1;
  state.checkpointStep = 1;

  Object.entries(buttons).forEach(([step, btn]) => {
    if (!btn) return;
    btn.disabled = Number(step) !== 1;
    btn.classList.toggle("is-hidden-step", Number(step) !== 1);
    btn.classList.remove("is-done");
    btn.classList.toggle("primary", Number(step) === 1);
    btn.classList.toggle("ghost", Number(step) !== 1);
  });

  if (buttons[1]) buttons[1].textContent = "첫 번째 문 열기";
  if (buttons[2]) buttons[2].textContent = "두 번째 문 열기";
  if (buttons[3]) buttons[3].textContent = "마지막 문 열기";
}

function startReasonTyping() {
  return typeText($("#reasonText"), REASON_TEXT, { minDelay: 12, maxDelay: 24 });
}

function initBootDelay() {
  const button = $("#btnPressStart");
  const fill = $("#bootLoaderFill");
  const text = $("#bootLoaderText");
  if (!button || !fill || !text) return;

  state.bootReady = false;
  button.disabled = true;
  button.textContent = "LOADING...";
  fill.style.width = "0%";
  text.textContent = "시스템을 여는 중입니다... 5초";

  const startedAt = Date.now();
  const tick = () => {
    const elapsed = Date.now() - startedAt;
    const progress = Math.min(elapsed / BOOT_DELAY_MS, 1);
    const remaining = Math.max(0, Math.ceil((BOOT_DELAY_MS - elapsed) / 1000));

    fill.style.width = `${Math.round(progress * 100)}%`;
    text.textContent =
      progress >= 1 ? "시스템 준비가 완료되었습니다." : `시스템을 여는 중입니다... ${remaining}초`;

    if (progress >= 1) {
      state.bootReady = true;
      button.disabled = false;
      button.textContent = "PRESS START";
      appendLog("BOOT READY", "ok");
      return;
    }

    window.setTimeout(tick, 120);
  };

  window.setTimeout(tick, 120);
}

async function onContinue() {
  if (state.storyRunning) return;
  state.storyRunning = true;

  const btn = $("#btnStart");
  setButtonBusy(btn, true);
  appendLog("STORY MODE STARTED", "ok");

  const lines = [
    "“처음에는 일부러 작은 불편을 남겨두었습니다.”",
    "“사용자가 어디에서 잠깐 멈추는지 직접 느끼실 수 있기를 바랐습니다.”",
    "“이제 그 불편을 어떻게 바라보는 사람인지 차분히 보여드리겠습니다.”",
  ];

  for (const line of lines) {
    await typeText($("#dialogText"), line, { minDelay: 12, maxDelay: 24 });
    await new Promise((resolve) => window.setTimeout(resolve, 760));
  }

  appendLog("SCENE SHIFT", "warn");
  showScreen("reason");
  await startReasonTyping();
  resetCheckpointButtons();
  setPortfolioDelayText("화면에 보이는 버튼을 순서대로 눌러 주세요. 각 단계는 5초씩 걸리고, 마지막 문이 열리면 본문으로 이동합니다.");
  $("#checkpointOne")?.focus();
  setButtonBusy(btn, false);
  state.storyRunning = false;
}

function startCheckpoint(step) {
  if (state.checkpointRunning || state.checkpointStep !== step) return;

  const buttonMap = {
    1: $("#checkpointOne"),
    2: $("#checkpointTwo"),
    3: $("#checkpointThree"),
  };
  const currentButton = buttonMap[step];
  if (!currentButton) return;

  state.checkpointRunning = true;
  const token = ++state.checkpointToken;
  currentButton.disabled = true;
  appendLog(`CHECKPOINT ${step} STARTED`, "warn");

  const startedAt = Date.now();
  const originalLabels = {
    1: "첫 번째 문 열기",
    2: "두 번째 문 열기",
    3: "마지막 문 열기",
  };

  const tick = () => {
    if (token !== state.checkpointToken) return;

    const elapsed = Date.now() - startedAt;
    const progress = Math.min(elapsed / CHECKPOINT_DELAY_MS, 1);
    const remaining = Math.max(0, Math.ceil((CHECKPOINT_DELAY_MS - elapsed) / 1000));

    currentButton.textContent =
      progress >= 1 ? "열렸습니다" : `${originalLabels[step]} (${remaining}초)`;

    setPortfolioDelayText(
      progress >= 1
        ? step === 3
          ? "어떤 부분이 불편하셨나요? 이제 그 질문에서부터 이야기를 시작하겠습니다."
          : `다음 버튼이 열렸습니다. 같은 방식으로 이어서 눌러 주세요.`
        : `천천히 열리는 중입니다. ${remaining}초만 더 기다려 주세요.`
    );

    if (progress >= 1) {
      currentButton.classList.add("is-done");
      state.checkpointRunning = false;
      state.checkpointStep += 1;

      const nextButton = buttonMap[step + 1];
      if (nextButton) {
        nextButton.disabled = false;
        nextButton.classList.remove("is-hidden-step");
        nextButton.classList.add("primary");
        nextButton.classList.remove("ghost");
        nextButton.focus();
      } else {
        appendLog("PORTFOLIO OPENED", "ok");
        window.setTimeout(() => openPortfolio("intro"), 800);
      }
      return;
    }

    window.setTimeout(tick, 200);
  };

  tick();
}

function getSectionSelector(key) {
  const map = {
    intro: "#pf-intro",
    about: "#pf-about",
    strength: "#pf-strength",
    projects: "#pf-projects",
    contact: "#pf-contact",
  };

  return map[key] || "#portfolio";
}

function scrollToPortfolioSection(key) {
  const target = $(getSectionSelector(key));
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveTab(key) {
  $$(".pf-tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.getAttribute("data-target") === key);
  });
}

function initRevealAnimations() {
  const revealTargets = $$("[data-reveal]");
  if (!revealTargets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function initSectionObserver() {
  const sections = $$("[data-section]");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const key = visible.target.getAttribute("data-section");
      if (key) setActiveTab(key);
    },
    { threshold: [0.2, 0.4, 0.6], rootMargin: "-20% 0px -40% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

function initScrollMotion() {
  const portfolio = $("#portfolio");
  if (!portfolio || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const update = () => {
    const rect = portfolio.getBoundingClientRect();
    const scrollShift = Math.max(0, window.innerHeight - rect.top);
    portfolio.style.setProperty("--scroll-shift", scrollShift.toFixed(2));
    portfolio.style.setProperty("--orbit-x", (window.scrollY * 0.18).toFixed(2));
    portfolio.style.setProperty("--orbit-y", window.scrollY.toFixed(2));

    $$(".pf-story-block, .pf-project", portfolio).forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      const delta = window.innerHeight * 0.72 - itemRect.top;
      item.style.setProperty("--section-shift", delta.toFixed(2));
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function openPortfolio(targetKey = "intro") {
  const portfolio = $("#portfolio");
  if (!portfolio) return;

  portfolio.classList.remove("is-hidden");
  appendLog(`PORTFOLIO OPENED: ${targetKey.toUpperCase()}`, "ok");
  window.setTimeout(() => scrollToPortfolioSection(targetKey), 60);
  setActiveTab(targetKey);
}

function wireUI() {
  $("#btnPressStart")?.addEventListener("click", onBootAdvance);

  $("#btnMute")?.addEventListener("click", () => {
    state.muted = !state.muted;
    $("#btnMute")?.setAttribute("aria-pressed", String(state.muted));
    $("#btnMute").textContent = state.muted ? "UNMUTE" : "MUTE";
    appendLog(`AUDIO: ${state.muted ? "OFF" : "ON"}`, "warn");
  });

  $("#btnStart")?.addEventListener("click", () => {
    onContinue();
  });

  $("#btnRestart")?.addEventListener("click", () => {
    appendLog("RESTARTING...", "warn");
    showScreen("boot");
    $("#portfolio")?.classList.add("is-hidden");
    state.storyRunning = false;
    resetCheckpointButtons();
    setPortfolioDelayText("화면 안에 나타나는 버튼을 순서대로 눌러 주세요. 각 단계는 5초씩 걸립니다.");
    initBootDelay();
  });

  $("#btnSkip")?.addEventListener("click", () => {
    appendLog("QUICK OPEN", "ok");
    showScreen("reason");
    setDialog("“원하시면 아래 버튼으로 바로 다음 단계로 넘어가실 수 있습니다.”");
    startReasonTyping().then(() => {
      resetCheckpointButtons();
      setPortfolioDelayText("바로 오셨더라도 같은 방식입니다. 버튼을 순서대로 누르시면 5초씩 열립니다.");
    });
  });

  $("#checkpointOne")?.addEventListener("click", () => startCheckpoint(1));
  $("#checkpointTwo")?.addEventListener("click", () => startCheckpoint(2));
  $("#checkpointThree")?.addEventListener("click", () => startCheckpoint(3));

  $$(".pf-jump, .pf-tab, .pf-next").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-target");
      if (!key) return;
      openPortfolio(key);
    });
  });

  $$("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-nav");
      if (!target) return;
      appendLog(`NAV: ${target.toUpperCase()}`, "ok");
      showScreen(target);
    });
  });

  $$(".work").forEach((work) => {
    work.addEventListener("click", (event) => {
      event.preventDefault();
      openPortfolio("projects");
    });
  });

  window.addEventListener("keydown", (event) => {
    if (state.screen === "boot" && event.code === "Space") {
      event.preventDefault();
      onBootAdvance();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireUI();
  initRevealAnimations();
  initSectionObserver();
  initScrollMotion();
  initBootDelay();
  resetCheckpointButtons();
  showScreen("boot");
  setDialog("“조금 천천히 시작하지만, 곧 자연스럽게 이어지는 흐름으로 바뀝니다.”");
  setPortfolioDelayText("화면 안에 나타나는 버튼을 순서대로 눌러 주세요. 각 단계는 5초씩 걸립니다.");
});
