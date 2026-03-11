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

    let total = 0;
    let targetProgress = 0;
    let currentProgress = 0;
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
      const outroProgress = clamp((progress - 0.9) / 0.08, 0, 1);
      const sceneVisibility = 1 - outroProgress;
      const peelProgress = Math.pow(progress, 1.12);

      const stripHeight = lerp(20, 220, peelProgress);
      strip.style.height = `${stripHeight}px`;

      const rotate = lerp(0, 16, peelProgress);
      const translateX = lerp(0, 14, peelProgress);
      const translateY = lerp(0, -92, peelProgress);
      const t = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
      strip.style.transform = t;

      tip.style.transform = t;
      tip.style.top = `${36 - peelProgress * 96}px`;
      tip.style.left = `${1 + peelProgress * 14}px`;

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

      strip.style.opacity = '0';
      tip.style.opacity = '0';

      const peelStart = 0.2;
      const bloodProgress = clamp((progress - peelStart) / 0.52, 0, 1);
      const bloodHeight = lerp(0, 96, bloodProgress);
      bloodLine.style.opacity = `${bloodProgress}`;
      bloodLine.style.height = `${bloodHeight}px`;
      bloodLine.style.width = `${lerp(5, 8, bloodProgress)}px`;
      bloodLine.style.left = `${lerp(9, 8, bloodProgress)}px`;

      const dropProgress = clamp((progress - peelStart) / 0.56, 0, 1);
      bloodDrop.style.opacity = `${dropProgress}`;
      bloodDrop.style.transform = `translateY(${lerp(0, 72, dropProgress)}px) scale(${lerp(0.7, 0.98, dropProgress)})`;
      bloodDrop.style.width = `${lerp(12, 16, dropProgress)}px`;
      bloodDrop.style.height = `${lerp(14, 20, dropProgress)}px`;
      bloodDrop.style.left = `${lerp(6, 4, dropProgress)}px`;

      const ribbonProgress = clamp((progress - peelStart) / 0.68, 0, 1);
      const sway2 = Math.cos(progress * 6.5);
      const ribbonY = lerp(0, 1.2, ribbonProgress);
      const ribbonRotate = lerp(0, 12, ribbonProgress) + sway2 * 0.8;
      const ribbonHeight = lerp(16, 220, ribbonProgress);
      fleshShreds.style.opacity = `${ribbonProgress}`;
      fleshShreds.style.height = `${ribbonHeight}px`;
      fleshShreds.style.transform = `translate(${lerp(0, 1.5, ribbonProgress)}px, ${ribbonY}px) rotate(${ribbonRotate}deg)`;

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
          const x = cx + Math.sin(angle) * localAmp + Math.sin(progress * 6 + ratio * 5) * 0.35;
          const y = ratio * ribbonHeight + (1 - Math.cos(angle)) * lerp(0.1, 2.6, ribbonProgress);
          points.push([x, y]);
        }

        let d = 'M 24 0';
        for (let i = 0; i < points.length; i += 1) {
          d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
        }

        ribbonPath.setAttribute('d', d);
        ribbonPath.setAttribute('stroke-width', `${lerp(6.0, 6.0, ribbonProgress)}`);
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
      const lift = (1 - transitionFade) * 6 - outroProgress * 24;

      title.style.opacity = textOpacity;
      sub.style.opacity = textOpacity;
      title.style.transform = `translate(-50%, ${lift}px)`;
      sub.style.transform = `translate(-50%, ${lift + 2}px)`;
      title.style.filter = `blur(${blur}px)`;
      sub.style.filter = `blur(${blur}px)`;

      fingerWrap.style.opacity = `${sceneVisibility}`;
      fingerWrap.style.transform = `translate(-50%, -50%) scale(${lerp(1, 0.92, outroProgress)})`;
    }

    function tick() {
      ticking = false;
      if (reducedMotion) {
        currentProgress = targetProgress;
        apply(currentProgress);
        return;
      }

      const follow = 0.14;
      currentProgress = lerp(currentProgress, targetProgress, follow);
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
      if (!snappedToNext && isScrollingDown && targetProgress >= textBoundaries[4]) {
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
