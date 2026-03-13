import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const FOODS = {
  blood: {
    label: '피순대',
    src: '/members/blood_sundae.png',
    fallback: '/members/c.svg',
    message: '피순대 섭취!',
  },
  sunji: {
    label: '선지해장국',
    src: '/members/sunji.png',
    fallback: '/members/c.svg',
    message: '선지해장국 흡입!',
  },
};

function HeartMeter({ value }) {
  const fillHeight = `${value}%`;

  return (
    <div className="relative h-[300px] w-[300px]">
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full">
        <path
          d="M12 21s-7.2-4.35-9.6-8.25C.3 9.25 2.1 5.5 5.7 5.5c2.25 0 3.6 1.25 4.3 2.3.7-1.05 2.05-2.3 4.3-2.3 3.6 0 5.4 3.75 3.3 7.25C19.2 16.65 12 21 12 21z"
          fill="#2f343f"
        />
      </svg>

      <div
        className="absolute inset-0 overflow-hidden transition-[height] duration-500 ease-out"
        style={{ height: fillHeight, top: `${100 - value}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-full w-full">
          <path
            d="M12 21s-7.2-4.35-9.6-8.25C.3 9.25 2.1 5.5 5.7 5.5c2.25 0 3.6 1.25 4.3 2.3.7-1.05 2.05-2.3 4.3-2.3 3.6 0 5.4 3.75 3.3 7.25C19.2 16.65 12 21 12 21z"
            fill="#ef4444"
          />
        </svg>
      </div>
    </div>
  );
}

function ChaewooPage() {
  const [heartValue, setHeartValue] = useState(0);
  const [showFoodAnimation, setShowFoodAnimation] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [currentFood, setCurrentFood] = useState(null);
  const [toastText, setToastText] = useState('');
  const [heartShakeTick, setHeartShakeTick] = useState(0);
  const hideTimerRef = useRef(null);
  const introTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
    };
  }, []);

  function feed(type) {
    if (showIntro) return;
    const food = FOODS[type];
    if (!food) return;

    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (introTimerRef.current) window.clearTimeout(introTimerRef.current);

    const nextValue = Math.min(100, heartValue + 20);

    setHeartValue(nextValue);
    setHeartShakeTick((v) => v + 1);
    setCurrentFood(food);
    setToastText(food.message);
    setShowFoodAnimation(true);

    hideTimerRef.current = window.setTimeout(() => {
      setShowFoodAnimation(false);
    }, 900);

    if (nextValue >= 100) {
      introTimerRef.current = window.setTimeout(() => {
        setShowFoodAnimation(false);
        setShowIntro(true);
      }, 1100);
    }
  }

  return (
    <section className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-[#05070f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(239,68,68,.18),transparent_42%)]" />

      <AnimatePresence>
        {showFoodAnimation && currentFood ? (
          <>
            <motion.div
              key={`toast-${currentFood.label}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-0 top-8 z-30 mx-auto w-fit rounded-full border border-red-300/50 bg-black/65 px-7 py-3 text-2xl font-black tracking-[0.08em] text-red-100 shadow-[0_0_30px_rgba(239,68,68,.35)]"
              style={{ fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif' }}
            >
              {toastText}
            </motion.div>

            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                key={`food-${currentFood.label}`}
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1, rotate: [0, -4, 4, -3, 3, 0], x: [0, -6, 6, -5, 5, 0] }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                className="h-[300px] w-[300px] md:h-[420px] md:w-[420px]"
              >
                <img
                  src={currentFood.src}
                  alt={currentFood.label}
                  className="h-full w-full rounded-2xl border border-white/20 object-cover opacity-70 shadow-[0_18px_50px_rgba(0,0,0,.45)]"
                  onError={(e) => {
                    e.currentTarget.src = currentFood.fallback;
                  }}
                />
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-56px)] w-[min(920px,calc(100%-32px))] flex-col items-center justify-center gap-6 py-10 text-center">
        <motion.div
          key={heartShakeTick}
          animate={{ x: [0, -6, 6, -4, 4, 0], y: [0, -2, 2, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 0.35 }}
          className="relative"
        >
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
          >
            <HeartMeter value={heartValue} />
          </motion.div>
        </motion.div>

        <p className="text-sm font-semibold tracking-[0.18em] text-white/70">HEART RATE</p>
        <p className="text-4xl font-black tracking-tight text-white">{heartValue}</p>

        {!showIntro ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => feed('blood')}
              className="rounded-xl border border-red-300/35 bg-red-500/18 px-5 py-3 text-sm font-bold hover:bg-red-500/28"
              type="button"
            >
              피순대
            </button>
            <button
              onClick={() => feed('sunji')}
              className="rounded-xl border border-red-300/35 bg-red-500/18 px-5 py-3 text-sm font-bold hover:bg-red-500/28"
              type="button"
            >
              선지해장국
            </button>
          </div>
        ) : null}

        <AnimatePresence>
          {showIntro ? (
            <motion.article
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-5 w-full max-w-3xl rounded-3xl border border-red-300/25 bg-[linear-gradient(135deg,rgba(25,5,8,.92),rgba(10,8,14,.92))] p-6 text-left shadow-[0_24px_70px_rgba(0,0,0,.5)] backdrop-blur"
            >
              <div className="grid gap-5 md:grid-cols-[170px_1fr]">
                <div className="rounded-2xl border border-red-200/20 bg-black/30 p-3">
                  <img
                    src="/members/chaewoo.jpeg"
                    alt="Chaewoo"
                    className="h-44 w-full rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/members/c.svg';
                    }}
                  />
                  <div className="mt-3 rounded-lg border border-red-200/20 bg-black/35 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-red-100/80">Status</p>
                    <p className="mt-1 text-sm font-bold text-red-200">Recovered / Active</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-red-100/70">Revival Log</p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-white">Chaewoo</h2>
                    <p className="mt-1 text-sm text-red-100/85">제품의 맥박을 다시 뛰게 만드는 문제 해결가</p>
                  </div>

                  <div className="rounded-xl border border-red-100/15 bg-black/35 p-4">
                    <p className="text-sm leading-7 text-white/90">
                      작은 이상 신호를 놓치지 않고 원인을 추적해 사용자가 체감하는 불편을 줄입니다. 데이터와
                      감각을 함께 보며, 복잡한 문제를 실행 가능한 우선순위로 바꾸는 데 강점이 있습니다.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['Problem Mapping', 'Flow Design', 'Rapid Iteration', 'Service Thinking'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-red-200/25 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default ChaewooPage;
