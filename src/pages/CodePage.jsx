import { useMemo, useState } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

function compute(progress) {
  const stripHeight = lerp(20, 260, progress);
  const rotate = lerp(0, 16, progress);
  const translateX = lerp(0, 22, progress);
  const translateY = lerp(0, -88, progress);

  const woundProgress = clamp((progress - 0.12) / 0.25, 0, 1);
  const bloodProgress = clamp((progress - 0.28) / 0.42, 0, 1);
  const bloodHeight = lerp(0, 86, bloodProgress);
  const dropProgress = clamp((progress - 0.55) / 0.25, 0, 1);

  return {
    stripHeight,
    rotate,
    translateX,
    translateY,
    woundProgress,
    bloodProgress,
    bloodHeight,
    dropProgress,
  };
}

function CodePage() {
  const [progress, setProgress] = useState(0);
  const m = useMemo(() => compute(progress), [progress]);
  const t = `translate(${m.translateX}px, ${m.translateY}px) rotate(${m.rotate}deg)`;

  return (
    <section className="px-6 py-14">
      <div className="mx-auto w-[min(1100px,100%)]">
        <div className="pill inline-flex">
          <span className="kbd">progress</span>를 직접 움직여 확인
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] md:text-6xl">Animation Code Page</h1>
        <p className="mt-3 max-w-4xl text-base leading-8 text-white/80">
          스크롤 없이도 구간별 변화가 맞는지 확인할 수 있게 진행도(0..1)를 슬라이더로 고정 재생합니다.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="card rounded-2xl border border-white/10 bg-white/6 p-5">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/6 p-3 font-mono text-sm">
              <span>progress</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-[60%]"
              />
              <span className="w-16 text-right">{progress.toFixed(3)}</span>
            </label>

            <dl className="mt-4 grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 font-mono text-sm text-white/85">
              <dt className="text-white/55">strip height</dt>
              <dd>{m.stripHeight.toFixed(1)}px</dd>
              <dt className="text-white/55">rotate</dt>
              <dd>{m.rotate.toFixed(2)}deg</dd>
              <dt className="text-white/55">translate</dt>
              <dd>{m.translateX.toFixed(1)}px, {m.translateY.toFixed(1)}px</dd>
              <dt className="text-white/55">wound</dt>
              <dd>{m.woundProgress.toFixed(2)}</dd>
              <dt className="text-white/55">blood line</dt>
              <dd>{m.bloodProgress.toFixed(2)} / {m.bloodHeight.toFixed(1)}px</dd>
              <dt className="text-white/55">drop</dt>
              <dd>{m.dropProgress.toFixed(2)}</dd>
            </dl>
          </article>

          <article className="card code-preview rounded-2xl border border-white/10 bg-white/6 p-5">
            <div className="scene !h-[420px] !w-[320px]">
              <div className="title !static !translate-x-0 !translate-y-0 text-center !opacity-100 !filter-none">
                PEEL
              </div>
              <div className="finger-wrap !top-[18%] !h-[360px] !w-[170px] !opacity-100 !scale-[0.78]">
                <div className="finger" />
                <div className="nail" />
                <div className="cuticle-area">
                  <div className="wound" style={{ opacity: m.woundProgress, transform: `scale(${lerp(0.6, 1, m.woundProgress)})` }} />
                  <div className="blood-line" style={{ opacity: m.bloodProgress, height: `${m.bloodHeight}px` }} />
                  <div
                    className="blood-drop"
                    style={{
                      opacity: m.dropProgress,
                      transform: `translateY(${lerp(0, 78, m.dropProgress)}px) scale(${lerp(0.7, 1.05, m.dropProgress)})`,
                    }}
                  />
                  <div className="hangnail-root" />
                  <div className="hangnail-strip" style={{ height: `${m.stripHeight}px`, transform: t }} />
                  <div className="tear-tip" style={{ transform: t, top: `${36 - progress * 88}px`, left: `${2 + progress * 22}px` }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default CodePage;
