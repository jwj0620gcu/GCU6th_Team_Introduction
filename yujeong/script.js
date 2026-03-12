const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const REASON_TEXT =
  "방금의 경험이 불편하게 느껴졌다면 의도는 전달된 셈입니다. 기다려야 했던 순간과 어디를 눌러야 할지 망설였던 장면은, 사용자가 어디에서 멈추는지 보여주기 위한 장치였습니다.";

const state = {
  screen: "boot",
  muted: false,
  typingToken: 0,
  storyRunning: false,
  bootReady: false,
  checkpointRunning: false,
  checkpointToken: 0,
  checkpointStep: 1,
  bootDeniedAttempts: 0,
  startDodgeCount: 0,
  dodgePhase: 0,
  introFrictionActive: true,
  introTyped: false,
};

const BOOT_DELAY_MS = 6500;
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
  if (!state.bootReady) {
    state.bootDeniedAttempts += 1;
    appendLog("ACCESS DENIED", state.bootDeniedAttempts > 1 ? "bad" : "warn");

    const button = $("#btnPressStart");
    if (button) {
      bump(button);
      const offsetX = state.bootDeniedAttempts % 2 === 0 ? -8 : 8;
      const offsetY = state.bootDeniedAttempts % 2 === 0 ? 3 : -3;
      button.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      window.setTimeout(() => {
        button.style.transform = "";
      }, 220);
    }

    const text = $("#bootLoaderText");
    if (text) {
      text.textContent =
        state.bootDeniedAttempts > 1
          ? "아직 열리지 않습니다. 기다리는 경험도 일부입니다."
          : "지금은 눌러도 열리지 않습니다.";
    }
    return;
  }
  appendLog("BOOT COMPLETE", "ok");
  showScreen("play");
  setComfortMode(false);
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

async function typeLine(el, text, options) {
  await typeText(el, text, options);
  el?.querySelector(".type-caret")?.remove();
}

function setDialog(text) {
  const txt = $("#dialogText");
  if (txt) txt.textContent = text;
}

function setPortfolioDelayText(text) {
  const note = $("#portfolioDelayText");
  if (note) note.textContent = text;
}

function setFrictionHint(text) {
  const hint = $("#frictionHint");
  if (hint) hint.textContent = text;
}

function setComfortMode(enabled) {
  document.body.classList.toggle("mode-portfolio", enabled);
}

function resetExperienceState() {
  state.storyRunning = false;
  state.startDodgeCount = 0;
  state.dodgePhase = 0;
  state.introFrictionActive = true;
  state.introTyped = false;
  $("#play .actions")?.classList.remove("is-dodging-a", "is-dodging-b", "is-dodging-c");
  setComfortMode(false);
  setFrictionHint("힌트: 처음엔 원하는 버튼이 쉽게 잡히지 않도록 해두었습니다.");
  setPortfolioDelayText("화면 안에 나타나는 버튼을 순서대로 눌러 주세요. 각 단계는 5초씩 걸립니다.");
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

async function startIntroTyping() {
  if (state.introTyped) return;

  const lines = $$("#pf-intro .pf-copy-line");
  if (!lines.length) return;

  state.introTyped = true;

  const texts = lines.map((line) => line.getAttribute("data-text") || line.textContent || "");
  lines.forEach((line, index) => {
    line.setAttribute("data-text", texts[index]);
    line.textContent = "";
    line.classList.add("is-typing");
  });

  for (let i = 0; i < lines.length; i += 1) {
    await typeLine(lines[i], texts[i], { minDelay: 18, maxDelay: 30 });
    lines[i].classList.remove("is-typing");
    await new Promise((resolve) => window.setTimeout(resolve, 180));
  }
}

function initBootDelay() {
  const button = $("#btnPressStart");
  const fill = $("#bootLoaderFill");
  const text = $("#bootLoaderText");
  if (!button || !fill || !text) return;

  state.bootReady = false;
  state.bootDeniedAttempts = 0;
  button.disabled = false;
  button.classList.add("is-locked");
  button.textContent = "DO NOT PRESS";
  fill.style.width = "0%";
  text.textContent = "시스템을 여는 중입니다... 7초";

  const startedAt = Date.now();
  const tick = () => {
    const elapsed = Date.now() - startedAt;
    const progress = Math.min(elapsed / BOOT_DELAY_MS, 1);
    const remaining = Math.max(0, Math.ceil((BOOT_DELAY_MS - elapsed) / 1000));

    fill.style.width = `${Math.round(progress * 100)}%`;

    if (progress >= 1) {
      text.textContent = "시스템 준비가 완료되었습니다.";
    } else if (progress < 0.3) {
      text.textContent = `지금은 아직 기다려야 합니다... ${remaining}초`;
      button.textContent = "WAIT";
    } else if (progress < 0.68) {
      text.textContent = `불편을 여는 중입니다... ${remaining}초`;
      button.textContent = "STILL LOADING";
    } else {
      text.textContent = `곧 시작되지만 아직은 아닙니다... ${remaining}초`;
      button.textContent = "ALMOST";
    }

    if (progress >= 1) {
      state.bootReady = true;
      button.classList.remove("is-locked");
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
  state.introFrictionActive = false;
  $("#play .actions")?.classList.remove("is-dodging-a", "is-dodging-b", "is-dodging-c");
  setFrictionHint("이제부터는 의도를 설명하고, 다음 장면으로 넘어갑니다.");

  const btn = $("#btnStart");
  setButtonBusy(btn, true);
  appendLog("STORY MODE STARTED", "ok");

  const lines = [
    "“처음에는 일부러 거슬리는 경험을 남겨두었습니다.”",
    "“사용자가 어디에서 멈추는지, 왜 다시 확인하게 되는지 직접 느끼게 하고 싶었습니다.”",
    "“이제부터는 같은 메시지를 더 쉽게 읽히는 흐름으로 보여드리겠습니다.”",
  ];

  for (const line of lines) {
    await typeText($("#dialogText"), line, { minDelay: 12, maxDelay: 24 });
    await new Promise((resolve) => window.setTimeout(resolve, 760));
  }

  appendLog("SCENE SHIFT", "warn");
  showScreen("reason");
  await startReasonTyping();
  resetCheckpointButtons();
  setPortfolioDelayText("순서대로 버튼을 누르면 다음 화면으로 이어집니다.");
  $("#checkpointOne")?.focus();
  setButtonBusy(btn, false);
  state.storyRunning = false;
}

function moveActionButtons() {
  const actions = $("#play .actions");
  if (!actions) return;

  const phases = ["is-dodging-a", "is-dodging-b", "is-dodging-c"];
  actions.classList.remove(...phases);
  const nextPhase = phases[state.dodgePhase % phases.length];
  actions.classList.add(nextPhase);
  state.dodgePhase += 1;
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
    hero: "#pf-hero",
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
          if (entry.target.id === "pf-intro") {
            startIntroTyping();
          }
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
  state.introFrictionActive = false;
  setComfortMode(true);
  appendLog(`PORTFOLIO OPENED: ${targetKey.toUpperCase()}`, "ok");
  window.setTimeout(() => scrollToPortfolioSection(targetKey), 60);
  setActiveTab(targetKey);
}

function wireUI() {
  $("#btnPressStart")?.addEventListener("click", onBootAdvance);

  $("#btnMute")?.addEventListener("click", () => {
    state.muted = !state.muted;
    $("#btnMute")?.setAttribute("aria-pressed", String(state.muted));
    document.body.classList.toggle("fx-off", state.muted);
    $("#btnMute").textContent = state.muted ? "FX: OFF" : "FX: ON";
    appendLog(`VISUAL FX: ${state.muted ? "OFF" : "ON"}`, "warn");
  });

  $("#btnStart")?.addEventListener("click", () => {
    onContinue();
  });

  $("#btnStart")?.addEventListener("mouseenter", () => {
    if (!state.introFrictionActive || state.startDodgeCount >= 4) return;
    state.startDodgeCount += 1;
    moveActionButtons();
    appendLog("CTA MOVED", "warn");
    setFrictionHint(
      state.startDodgeCount === 1
        ? "조금 헷갈리셨다면 의도대로 작동 중입니다."
        : "버튼이 바로 잡히지 않도록 위치를 계속 바꾸고 있습니다."
    );
  });

  $("#btnSkip")?.addEventListener("mouseenter", () => {
    if (!state.introFrictionActive || state.startDodgeCount >= 5) return;
    state.startDodgeCount += 1;
    moveActionButtons();
    appendLog("SKIP EVADED", "warn");
    setDialog("“이 단계에서는 스킵할 수 없습니다.”");
    setFrictionHint("스킵 버튼은 초반 흐름에서 바로 선택되지 않도록 움직입니다.");
  });

  $("#btnSkip")?.addEventListener("focus", () => {
    if (!state.introFrictionActive) return;
    setDialog("“이 단계에서는 스킵할 수 없습니다. 끝까지 진행해 주세요.”");
  });

  $("#btnRestart")?.addEventListener("click", () => {
    appendLog("RESTARTING...", "warn");
    showScreen("boot");
    $("#portfolio")?.classList.add("is-hidden");
    resetExperienceState();
    resetCheckpointButtons();
    initBootDelay();
  });

  $("#btnSkip")?.addEventListener("click", () => {
    appendLog("SKIP DISABLED", "bad");
    bump($("#btnSkip"));
    setDialog("“이 구간은 스킵할 수 없습니다. 끝까지 진행해 주세요.”");
    setFrictionHint("스킵은 사용할 수 없습니다. 처음부터 순서대로 진행해 주세요.");
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
  resetExperienceState();
  document.body.classList.remove("fx-off");
  setDialog("“조금 천천히 시작하지만, 곧 자연스럽게 이어지는 흐름으로 바뀝니다.”");
});
