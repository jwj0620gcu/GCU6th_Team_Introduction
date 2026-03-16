import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ChaewooFoodOverlay from '../components/chaewoo/ChaewooFoodOverlay';
import ChaewooIntroCard from '../components/chaewoo/ChaewooIntroCard';
import HeartMeter from '../components/chaewoo/HeartMeter';
import { chaewooFoods, chaewooProfile } from '../content/chaewooContent';

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
    const food = chaewooFoods[type];
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

      <ChaewooFoodOverlay currentFood={currentFood} showFoodAnimation={showFoodAnimation} toastText={toastText} />

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

        <ChaewooIntroCard profile={chaewooProfile} showIntro={showIntro} />
      </div>
    </section>
  );
}

export default ChaewooPage;
