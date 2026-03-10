(() => {
  const hero = document.getElementById("hero");
  const strip = document.getElementById("strip");
  const tip = document.getElementById("tip");
  const wound = document.getElementById("wound");
  const bloodLine = document.getElementById("bloodLine");
  const bloodDrop = document.getElementById("bloodDrop");
  const title = document.getElementById("title");
  const sub = document.getElementById("sub");

  if (!hero || !strip || !tip || !wound || !bloodLine || !bloodDrop || !title || !sub) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  let total = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let ticking = false;

  function measure() {
    total = hero.offsetHeight - window.innerHeight;
    total = Math.max(0, total);
  }

  function computeTargetProgress() {
    const rect = hero.getBoundingClientRect();
    const scrolled = clamp(-rect.top, 0, total);
    targetProgress = total > 0 ? scrolled / total : 0;
  }

  function apply(progress) {
    /* 끄스러미 길이 */
    const stripHeight = lerp(20, 260, progress);
    strip.style.height = `${stripHeight}px`;

    /* 뜯기면서 오른쪽으로 약간 꺾이고, 위로 당겨지는 느낌 */
    const rotate = lerp(0, 16, progress);
    const translateX = lerp(0, 22, progress);
    const translateY = lerp(0, -88, progress);
    const t = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
    strip.style.transform = t;

    /* 끄스러미 끝부분 */
    tip.style.transform = t;
    tip.style.top = `${36 - progress * 88}px`;
    tip.style.left = `${2 + progress * 22}px`;

    /* 상처와 피: 초반엔 거의 없고 중반부터 드러남 */
    const woundProgress = clamp((progress - 0.12) / 0.25, 0, 1);
    wound.style.opacity = `${woundProgress}`;
    wound.style.transform = `scale(${lerp(0.6, 1, woundProgress)})`;

    const bloodProgress = clamp((progress - 0.28) / 0.42, 0, 1);
    const bloodHeight = lerp(0, 86, bloodProgress);
    bloodLine.style.opacity = `${bloodProgress}`;
    bloodLine.style.height = `${bloodHeight}px`;

    const dropProgress = clamp((progress - 0.55) / 0.25, 0, 1);
    bloodDrop.style.opacity = `${dropProgress}`;
    bloodDrop.style.transform = `translateY(${lerp(0, 78, dropProgress)}px) scale(${lerp(
      0.7,
      1.05,
      dropProgress
    )})`;

    /* 텍스트 변화 */
    if (progress < 0.22) {
      title.textContent = "건드리지 마.";
      sub.textContent = "근데… 이미 보고 있지? (scroll = peel)";
    } else if (progress < 0.55) {
      title.textContent = "이미 시작했네.";
      sub.textContent = "멈추면 더 거슬려. 계속 당겨.";
    } else if (progress < 0.82) {
      title.textContent = "아프지?";
      sub.textContent = "좋아. 이제 진짜가 나온다.";
    } else {
      title.textContent = "돌아갈 수 없어.";
      sub.textContent = "우린 남들이 피하는 걸 열어버린다.";
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

