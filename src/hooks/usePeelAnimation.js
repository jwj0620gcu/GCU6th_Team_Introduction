import { useEffect } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

function usePeelAnimation(refs) {
  useEffect(() => {
    const {
      heroRef,
      stripRef,
      tipRef,
      fingerWrapRef,
      woundRef,
      tornSkinRef,
      bloodLineRef,
      bloodDropRef,
      fleshShredsRef,
      titleRef,
      subRef,
      nextSectionRef,
    } = refs;

    const hero = heroRef.current;
    const strip = stripRef.current;
    const tip = tipRef.current;
    const fingerWrap = fingerWrapRef.current;
    const wound = woundRef.current;
    const tornSkin = tornSkinRef.current;
    const bloodLine = bloodLineRef.current;
    const bloodDrop = bloodDropRef.current;
    const fleshShreds = fleshShredsRef.current;
    const title = titleRef.current;
    const sub = subRef.current;
    const nextSection = nextSectionRef.current;

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
      !sub ||
      !nextSection
    ) {
      return undefined;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const textBoundaries = [0.16, 0.42, 0.68, 0.86, 0.92];
    const nextSectionTrigger = 0.98;

    let total = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let previousProgress = 0;
    let velocitySmoothed = 0;
    let lastProgress = 0;
    let ticking = false;
    let snappedToNext = false;
    let rafId = 0;

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
        <path id="fleshRibbonPath" fill="none" stroke="url(#fleshRibbonGrad)" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
    const ribbonPath = fleshShreds.querySelector('#fleshRibbonPath');

    function measure() {
      total = Math.max(0, hero.offsetHeight - window.innerHeight);
    }

    function computeTargetProgress() {
      const rect = hero.getBoundingClientRect();
      const scrolled = clamp(-rect.top, 0, total);
      targetProgress = total > 0 ? scrolled / total : 0;
      const active = rect.top < window.innerHeight && rect.bottom > 56;
      document.body.classList.toggle('peel-active', active);
    }

    function apply(progress) {
      const scrollVelocity = velocitySmoothed;
      const outroProgress = clamp((progress - 0.9) / 0.08, 0, 1);
      const sceneVisibility = 1 - outroProgress;
      const tipIntroProgress = clamp((progress - textBoundaries[0]) / 0.06, 0, 1);
      const peelStart = textBoundaries[1];
      const peelMotion = clamp((progress - peelStart) / (1 - peelStart), 0, 1);
      const riseProgress = Math.pow(clamp((progress - peelStart) / 0.54, 0, 1), 1.05);
      const focusBase = clamp((progress - 0.06) / 0.26, 0, 1);
      const focusDeep = clamp((progress - 0.42) / 0.42, 0, 1);
      const focusProgress =
        (focusBase * 0.72 + Math.pow(focusDeep, 1.35) * 0.28) * (1 - outroProgress * 0.15);
      const peelProgress = Math.pow(peelMotion, 1.12);
      const pullTension = clamp((progress - peelStart) / 0.7, 0, 1);
      const pullShake = Math.sin(progress * 80) * scrollVelocity * 0.06;

      const stripHeight = lerp(20, 220, peelProgress);
      strip.style.height = `${stripHeight}px`;

      const rotate = lerp(0, 16, peelProgress);
      const translateX = lerp(0, 14, peelProgress);
      const translateY = lerp(0, -92, peelProgress);
      const t = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
      strip.style.transform = t;

      const tipStretch = 1 + pullTension * 0.15 + scrollVelocity * 0.02;
      const tipTwist = lerp(0, 10, pullTension) + pullShake * 2.2;
      tip.style.transform = `${t} rotate(${tipTwist}deg) scale(${tipStretch}, ${1 + pullTension * 0.06})`;
      tip.style.top = `${-2 - peelProgress * 96}px`;
      tip.style.left = `${1 + peelProgress * 14}px`;

      const woundProgress = clamp((progress - (peelStart + 0.02)) / 0.34, 0, 1);
      wound.style.opacity = `${woundProgress}`;
      wound.style.transform = `scale(${lerp(0.55, 1.08, woundProgress)})`;

      const tornProgress = clamp((progress - (peelStart + 0.04)) / 0.38, 0, 1);
      tornSkin.style.opacity = `${tornProgress}`;
      tornSkin.style.transform = `translate(${lerp(-1, 2, tornProgress)}px, ${lerp(
        -1,
        3,
        tornProgress
      )}px) rotate(${lerp(0, 12, tornProgress) + pullShake * 1.8}deg) scale(${lerp(
        0.5,
        1.1,
        tornProgress
      ) + scrollVelocity * 0.015})`;

      const tipMorphProgress = clamp((progress - peelStart) / 0.62, 0, 1);
      strip.style.opacity = '0';
      // 초기 끄스러미가 사라지지 않고 그대로 길어지며 리본의 시작점이 되도록 유지
      tip.style.opacity = `${sceneVisibility * tipIntroProgress}`;
      tip.style.width = `${lerp(15, 9, tipMorphProgress)}px`;
      tip.style.height = `${lerp(30, 64, tipMorphProgress)}px`;
      tip.style.borderRadius = `${lerp(6, 4, tipMorphProgress)}px ${lerp(6, 4, tipMorphProgress)}px ${lerp(
        11,
        8,
        tipMorphProgress
      )}px ${lerp(11, 8, tipMorphProgress)}px`;
      tip.style.boxShadow = `inset 0 -1px 0 rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, ${
        lerp(0.08, 0.03, tipMorphProgress).toFixed(3)
      })`;

      const bloodProgress = clamp((progress - peelStart) / 0.52, 0, 1);
      const bloodHeight = lerp(0, 126, bloodProgress);
      bloodLine.style.opacity = `${bloodProgress}`;
      bloodLine.style.height = `${bloodHeight}px`;
      bloodLine.style.width = `${lerp(5, 9.8, bloodProgress) + scrollVelocity * 0.08}px`;
      bloodLine.style.left = `${lerp(7, 6.1, bloodProgress)}px`;

      const dropProgress = clamp((progress - peelStart) / 0.56, 0, 1);
      bloodDrop.style.opacity = `${dropProgress}`;
      bloodDrop.style.transform = `translate(${Math.sin(progress * 38) * scrollVelocity * 0.45}px, ${lerp(
        0,
        98,
        dropProgress
      )}px) scale(${lerp(0.7, 1.14, dropProgress)})`;
      bloodDrop.style.width = `${lerp(12, 19, dropProgress)}px`;
      bloodDrop.style.height = `${lerp(14, 24, dropProgress)}px`;
      bloodDrop.style.left = `${lerp(2.4, 1.2, dropProgress)}px`;

      const ribbonProgress = clamp((progress - peelStart) / 0.68, 0, 1);
      const sway2 = Math.cos(progress * 6.5);
      const ribbonY = lerp(0, 1.2, ribbonProgress);
      const ribbonRotate = lerp(0, 12, ribbonProgress) + sway2 * 0.8;
      const ribbonHeight = lerp(16, 220, ribbonProgress);
      fleshShreds.style.opacity = `${ribbonProgress}`;
      fleshShreds.style.height = `${ribbonHeight}px`;
      fleshShreds.style.transform = `translate(${lerp(0, 1.5, ribbonProgress) + pullShake * 0.8}px, ${
        ribbonY + Math.abs(pullShake) * 0.25
      }px) rotate(${ribbonRotate + pullShake * 1.6}deg)`;

      if (ribbonPath) {
        const turns = lerp(1.0, 2.7, ribbonProgress);
        const amp = lerp(1.2, 8.0, ribbonProgress);
        const decay = lerp(0.96, 0.74, ribbonProgress);
        const steps = 88;
        const cx = 24;
        const points = [];

        for (let i = 0; i <= steps; i += 1) {
          const ratio = i / steps;
          const angle = ratio * turns * Math.PI * 2;
          const localAmp = amp * (1 - ratio * (1 - decay));
          const x =
            cx +
            Math.sin(angle) * localAmp +
            Math.sin(progress * 6 + ratio * 5) * 0.35 +
            Math.sin(progress * 50 + ratio * 14) * scrollVelocity * 0.18;
          const y = ratio * ribbonHeight + (1 - Math.cos(angle)) * lerp(0.1, 2.6, ribbonProgress);
          points.push([x, y]);
        }

        let d = 'M 24 0';
        for (let i = 0; i < points.length; i += 1) {
          d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
        }

        ribbonPath.setAttribute('d', d);
        ribbonPath.setAttribute(
          'stroke-width',
          `${lerp(5.2, 7.4, ribbonProgress) + Math.sin(progress * 45) * scrollVelocity * 0.08}`
        );
        ribbonPath.style.opacity = `${ribbonProgress}`;
      }

      if (progress < textBoundaries[0]) {
        title.textContent = '';
        sub.textContent = '';
      } else if (progress < textBoundaries[1]) {
        title.textContent = '건드리지 마.';
        sub.textContent = '';
      } else if (progress < textBoundaries[2]) {
        title.textContent = '이미 시작했네.';
        sub.textContent = '멈추면 더 거슬려. 계속 뜯어.';
      } else if (progress < textBoundaries[3]) {
        title.textContent = '아프지?';
        sub.textContent = '이미 살은 벌어지고 있네';
      } else if (progress < textBoundaries[4]) {
        title.textContent = '그냥 끝까지 당겨.';
        sub.textContent = '';
      } else {
        title.textContent = '';
        sub.textContent = '';
      }

      const band = 0.03;
      let transitionFade = 1;
      for (let i = 0; i < textBoundaries.length; i += 1) {
        const dist = Math.abs(progress - textBoundaries[i]);
        transitionFade = Math.min(transitionFade, clamp(dist / band, 0, 1));
      }

      const tailFade = 1 - clamp((progress - 0.9) / 0.1, 0, 1) * 0.18;
      const textOpacity = tailFade * transitionFade * sceneVisibility;
      const blur = (1 - transitionFade) * 0.8;
      const focusTextOffset = lerp(0, 28, focusProgress) + lerp(0, 14, Math.pow(focusDeep, 1.2));
      const textRiseY = lerp(0, -124, riseProgress);
      const lift = (1 - transitionFade) * 6 + focusTextOffset + textRiseY - outroProgress * 24;

      title.style.opacity = textOpacity;
      sub.style.opacity = textOpacity;
      title.style.transform = `translate(-50%, ${lift}px)`;
      sub.style.transform = `translate(-50%, ${lift + 8}px)`;
      title.style.filter = `blur(${blur}px)`;
      sub.style.filter = `blur(${blur}px)`;

      const focusScale =
        lerp(1, 1.72, focusProgress) + lerp(0, 0.34, Math.pow(focusDeep, 1.25));
      const outroScale = lerp(1, 0.92, outroProgress);
      // 포커스 기준을 손톱 중앙으로 이동
      const focusShiftX = lerp(0, -12, focusProgress) + lerp(0, -12, Math.pow(focusDeep, 1.2));
      const focusShiftY = lerp(0, 72, focusProgress) + lerp(0, 26, Math.pow(focusDeep, 1.2));
      const fingerRiseY = lerp(0, -250, riseProgress);
      fingerWrap.style.opacity = `${sceneVisibility}`;
      fingerWrap.style.transform = `translate(-50%, -50%) translate(${focusShiftX}px, ${
        focusShiftY + fingerRiseY
      }px) scale(${
        focusScale * outroScale
      })`;
    }

    function tick() {
      ticking = false;
      if (reducedMotion) {
        currentProgress = targetProgress;
        previousProgress = currentProgress;
        velocitySmoothed = 0;
        apply(currentProgress);
        return;
      }

      const follow = 0.14;
      currentProgress = lerp(currentProgress, targetProgress, follow);
      const velocityNow = Math.abs(currentProgress - previousProgress) * 120;
      velocitySmoothed = lerp(velocitySmoothed, velocityNow, 0.28);
      previousProgress = currentProgress;
      apply(currentProgress);

      if (Math.abs(currentProgress - targetProgress) > 0.0005) {
        rafId = requestAnimationFrame(tick);
        ticking = true;
      }
    }

    function requestTick() {
      if (ticking) return;
      rafId = requestAnimationFrame(tick);
      ticking = true;
    }

    function onScroll() {
      computeTargetProgress();

      const isScrollingDown = targetProgress > lastProgress;
      if (!snappedToNext && isScrollingDown && targetProgress >= nextSectionTrigger) {
        snappedToNext = true;
        nextSection.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }

      if (snappedToNext && targetProgress < 0.5) {
        snappedToNext = false;
      }

      lastProgress = targetProgress;
      requestTick();
    }

    function onResize() {
      measure();
      computeTargetProgress();
      requestTick();
    }

    measure();
    computeTargetProgress();
    currentProgress = targetProgress;
    apply(currentProgress);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.classList.remove('peel-active');
    };
  }, [refs]);
}

export default usePeelAnimation;
