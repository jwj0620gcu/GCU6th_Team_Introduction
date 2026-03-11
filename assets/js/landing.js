(() => {
  const hero = document.getElementById("hero");
  const strip = document.getElementById("strip");
  const tip = document.getElementById("tip");
  const fingerWrap = document.querySelector(".finger-wrap");
  const wound = document.getElementById("wound");
  const tornSkin = document.getElementById("tornSkin");
  const bloodLine = document.getElementById("bloodLine");
  const bloodDrop = document.getElementById("bloodDrop");
  const fleshShreds = document.getElementById("fleshShreds");
  const title = document.getElementById("title");
  const sub = document.getElementById("sub");

  if (
    !hero ||
    !strip ||
    !tip ||
    !fingerWrap ||
    !wound ||
    !tornSkin ||
    !bloodLine ||
    !bloodDrop ||
    !fleshShreds ||
    !title ||
    !sub
  ) {
    return;
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  let total = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let ticking = false;
  let ribbonPath = null;

  fleshShreds.innerHTML = `
    <svg class="flesh-ribbon-svg" viewBox="0 0 48 620" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fleshRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f6d7bd" />
          <stop offset="38%" stop-color="#edc5a8" />
          <stop offset="72%" stop-color="#dfad8f" />
          <stop offset="100%" stop-color="#c98f74" />
        </linearGradient>
      </defs>
      <path
        id="fleshRibbonPath"
        fill="none"
        stroke="url(#fleshRibbonGrad)"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
  ribbonPath = document.getElementById("fleshRibbonPath");

  function measure() {
    total = hero.offsetHeight - window.innerHeight;
    total = Math.max(0, total);
  }

  function computeTargetProgress() {
    const rect = hero.getBoundingClientRect();
    const scrolled = clamp(-rect.top, 0, total);
    targetProgress = total > 0 ? scrolled / total : 0;
    const active = rect.top < window.innerHeight && rect.bottom > 56;
    document.body.classList.toggle("peel-active", active);
  }

  function apply(progress) {
    // 후반으로 갈수록 뜯김이 더 길어지게 체감 곡선
    const peelProgress = Math.pow(progress, 1.12);

    /* 끄스러미 길이 */
    const stripHeight = lerp(20, 220, peelProgress);
    strip.style.height = `${stripHeight}px`;

    /* 뜯기면서 오른쪽으로 약간 꺾이고, 위로 당겨지는 느낌 */
    const rotate = lerp(0, 16, peelProgress);
    const translateX = lerp(0, 14, peelProgress);
    const translateY = lerp(0, -92, peelProgress);
    const t = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
    strip.style.transform = t;

    /* 끄스러미 끝부분 */
    tip.style.transform = t;
    tip.style.top = `${36 - peelProgress * 96}px`;
    tip.style.left = `${1 + peelProgress * 14}px`;

    /* 상처와 피: 초반엔 거의 없고 중반부터 드러남 */
    const woundProgress = clamp((progress - 0.18) / 0.38, 0, 1);
    wound.style.opacity = `${woundProgress}`;
    wound.style.transform = `scale(${lerp(0.55, 1.08, woundProgress)})`;

    const tornProgress = clamp((progress - 0.2) / 0.42, 0, 1);
    tornSkin.style.opacity = `${tornProgress}`;
    tornSkin.style.transform = `translate(${lerp(-1, 2, tornProgress)}px, ${lerp(
      -1,
      3,
      tornProgress
    )}px) rotate(${lerp(0, 12, tornProgress)}deg) scale(${lerp(0.5, 1.1, tornProgress)})`;

    const fleshProgress = clamp((progress - 0.2) / 0.78, 0, 1);

    // 막대기처럼 보이는 기존 끄스러미는 제거
    strip.style.opacity = "0";
    tip.style.opacity = "0";

    // 피와 살 뜯김을 같은 시점에 시작
    const peelStart = 0.2;
    const bloodProgress = clamp((progress - peelStart) / 0.52, 0, 1);
    const bloodHeight = lerp(0, 96, bloodProgress);
    bloodLine.style.opacity = `${bloodProgress}`;
    bloodLine.style.height = `${bloodHeight}px`;
    bloodLine.style.width = `${lerp(5, 8, bloodProgress)}px`;
    bloodLine.style.left = `${lerp(9, 8, bloodProgress)}px`;

    const dropProgress = clamp((progress - peelStart) / 0.56, 0, 1);
    bloodDrop.style.opacity = `${dropProgress}`;
    bloodDrop.style.transform = `translateY(${lerp(0, 72, dropProgress)}px) scale(${lerp(
      0.7,
      0.98,
      dropProgress
    )})`;
    bloodDrop.style.width = `${lerp(12, 16, dropProgress)}px`;
    bloodDrop.style.height = `${lerp(14, 20, dropProgress)}px`;
    bloodDrop.style.left = `${lerp(6, 4, dropProgress)}px`;

    const ribbonProgress = clamp((progress - peelStart) / 0.68, 0, 1);
    // 스크롤 진행도에만 반응: 자율 흔들림 제거
    const sway = Math.sin(progress * 8.2);
    const sway2 = Math.cos(progress * 6.5);
    const sway3 = Math.sin(progress * 10.2);

    // 손톱 뿌리에 고정된 채 길이만 늘어나도록 Y 이동은 최소화
    const ribbonY = lerp(0, 1.2, ribbonProgress);
    const ribbonRotate = lerp(0, 12, ribbonProgress) + sway2 * 0.8;
    const ribbonHeight = lerp(16, 220, ribbonProgress);
    fleshShreds.style.opacity = `${ribbonProgress}`;
    fleshShreds.style.height = `${ribbonHeight}px`;
    fleshShreds.style.transform = `translate(${lerp(0, 1.5, ribbonProgress)}px, ${ribbonY}px) rotate(${ribbonRotate}deg)`;

    if (ribbonPath) {
      // 사과 껍질처럼 길게 벗겨지는 리본 곡선
      const turns = lerp(1.0, 2.7, ribbonProgress);
      const amp = lerp(1.2, 8.0, ribbonProgress);
      const decay = lerp(0.96, 0.74, ribbonProgress);
      const steps = 88;
      const cx = 24;
      const points = [];

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const angle = t * turns * Math.PI * 2;
        const localAmp = amp * (1 - t * (1 - decay));
        const x = cx + Math.sin(angle) * localAmp + Math.sin(progress * 6 + t * 5) * 0.35;
        const y = t * ribbonHeight + (1 - Math.cos(angle)) * lerp(0.1, 2.6, ribbonProgress);
        points.push([x, y]);
      }

      let d = "M 24 0";
      for (let i = 0; i < points.length; i += 1) {
        d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
      }

      ribbonPath.setAttribute("d", d);
      ribbonPath.setAttribute("stroke-width", `${lerp(6.0, 6.0, ribbonProgress)}`);
      ribbonPath.style.opacity = `${ribbonProgress}`;
    }

    /* 텍스트 변화: 스크롤 임계치에 따라 단계적으로 전환 */
    if (progress < 0.05) {
      title.textContent = "";
      sub.textContent = "";
    } else if (progress < 0.36) {
      title.textContent = "건드리지 마.";
      sub.textContent = "";
    } else if (progress < 0.62) {
      title.textContent = "이미 시작했네.";
      sub.textContent = "멈추면 더 거슬려. 계속 당겨.";
    } else if (progress < 0.84) {
      title.textContent = "아프지?";
      sub.textContent = "이미 살이 벌어지고 있네";
    } else {
      title.textContent = "그냥 끝까지 당겨.";
      sub.textContent = "숨은 문제를 꺼내.";
    }

    /* 텍스트 약간 사라졌다가 다시 보이게 */
    const textOpacity = 1 - clamp((progress - 0.9) / 0.1, 0, 1) * 0.18;
    title.style.opacity = textOpacity;
    sub.style.opacity = textOpacity;
  }

  function tick() {
    ticking = false;

    // reduced motion: jump directly to scroll position
    if (reducedMotion) {
      currentProgress = targetProgress;
      apply(currentProgress);
      return;
    }

    // ease: follow the target with a light "tug" feel
    const follow = 0.14;
    currentProgress = lerp(currentProgress, targetProgress, follow);
    apply(currentProgress);

    // continue until settled
    if (Math.abs(currentProgress - targetProgress) > 0.0005) {
      requestAnimationFrame(tick);
      ticking = true;
    }
  }

  function requestTick() {
    if (ticking) return;
    requestAnimationFrame(tick);
    ticking = true;
  }

  function onScroll() {
    computeTargetProgress();
    requestTick();
  }

  function onResize() {
    measure();
    computeTargetProgress();
    requestTick();
  }

  // init
  measure();
  computeTargetProgress();
  currentProgress = targetProgress;
  apply(currentProgress);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
})();
