import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

const FALLBACK_PHOTO = '/members/a.svg';

function WonjunPokemonIntro() {
  const [phase, setPhase] = useState('idle');
  const [photoSrc, setPhotoSrc] = useState('/members/wonjun.jpg');
  const timersRef = useRef([]);

  const isIdle = phase === 'idle';
  const isThrowing = phase === 'throwing';
  const isWobble = phase === 'wobble';
  const isOpening = phase === 'opening';
  const isGotcha = phase === 'gotcha';
  const isReveal = phase === 'reveal';
  const isCaptured = isOpening || isGotcha || isReveal;

  const buttonLabel = useMemo(() => {
    if (isIdle) return '몬스터볼 던지기';
    if (isThrowing) return 'Throwing...';
    if (isWobble) return 'Shaking...';
    if (isOpening) return 'Capturing...';
    return '잡았다!';
  }, [isIdle, isOpening, isThrowing, isWobble]);

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );

  function onThrow() {
    if (!isIdle) return;
    setPhase('throwing');

    timersRef.current.push(window.setTimeout(() => setPhase('wobble'), 920));
    timersRef.current.push(window.setTimeout(() => setPhase('opening'), 2720));
    timersRef.current.push(window.setTimeout(() => setPhase('gotcha'), 3160));
    timersRef.current.push(window.setTimeout(() => setPhase('reveal'), 4160));
  }

  return (
    <section className="min-h-[calc(100vh-56px)] w-full bg-[#0a1633] p-2 md:p-4">
      <div className="relative mx-auto h-[calc(100vh-72px)] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#18386c]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#79beff_0%,#a4de7a_62%,#5da444_100%)]" />

        <motion.div
          className="absolute left-1/2 top-[32%] z-[3] h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white/70 bg-white/15 shadow-[0_12px_28px_rgba(0,0,0,0.35)] md:h-28 md:w-28"
          animate={
            isIdle
              ? { y: [0, -10, 0], scale: [0.92, 0.95, 0.92] }
              : isOpening || isGotcha
                ? { y: 0, scale: [1, 0.28, 0], opacity: [1, 0.8, 0], filter: ['blur(0px)', 'blur(2px)', 'blur(5px)'] }
                : { y: 0 }
          }
          transition={
            isIdle
              ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.65, ease: 'easeIn' }
          }
        >
          {!isCaptured && (
            <img
              src={photoSrc}
              alt="Wonjun Jung dummy"
              className="h-full w-full object-cover"
              onError={() => setPhotoSrc(FALLBACK_PHOTO)}
            />
          )}
        </motion.div>

        <AnimatePresence>
          {!isIdle && (
            <motion.div
              className="absolute bottom-8 left-1/2 z-[8] h-20 w-20 -translate-x-1/2"
              initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              animate={
                isThrowing
                  ? { x: ['0vw', '9vw', '0vw'], y: ['0vh', '-30vh', '-43vh'], rotate: [0, 240, 430], scale: [1, 0.92, 0.82] }
                  : isWobble
                    ? {
                        x: [0, -10, 10, -9, 9, -8, 8, 0],
                        y: '-43vh',
                        rotate: [430, 402, 456, 410, 450, 414, 446, 430],
                        scale: [0.82, 0.82, 0.82, 0.82, 0.82, 0.82, 0.82, 0.82],
                      }
                  : { x: 0, y: '-43vh', rotate: 430, scale: 0.82 }
              }
              transition={
                isWobble
                  ? { duration: 1.75, ease: 'easeInOut' }
                  : { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }
              }
            >
              <div className="relative h-full w-full overflow-visible rounded-full">
                <motion.span
                  className="absolute left-0 top-0 h-1/2 w-full rounded-t-full border-[3px] border-b-0 border-black bg-[#ef3d3d]"
                  animate={isOpening ? { y: -11, rotate: -22 } : { y: 0, rotate: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ transformOrigin: 'bottom center' }}
                />
                <motion.span
                  className="absolute bottom-0 left-0 h-1/2 w-full rounded-b-full border-[3px] border-t-0 border-black bg-white"
                  animate={isOpening ? { y: 11, rotate: 18 } : { y: 0, rotate: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ transformOrigin: 'top center' }}
                />
                <span className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-black" />
                <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-black bg-[#f8f8f8]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 z-[9] flex items-center justify-center">
          <AnimatePresence>
            {isGotcha && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="text-center"
              >
                <p className="text-5xl font-black tracking-[-0.04em] text-yellow-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] md:text-7xl">
                  GOTCHA!
                </p>
                <p className="mt-2 text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] md:text-3xl">
                  정원준을 잡았습니다!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-5 left-1/2 z-10 w-[min(560px,calc(100%-20px))] -translate-x-1/2">
          <button
            type="button"
            className="w-full rounded-xl bg-gradient-to-br from-[#ef3d3d] to-[#ab1f1f] px-4 py-3 text-base font-extrabold text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onThrow}
            disabled={!isIdle}
          >
            {buttonLabel}
          </button>
        </div>

        <AnimatePresence>
          {isReveal && (
            <div className="absolute left-1/2 top-1/2 z-[11] w-[min(560px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2">
              <motion.article
                initial={{ opacity: 0, y: 18, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col items-center rounded-2xl border border-white/20 bg-[#0a1224]/90 p-5 text-center text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur"
              >
                <h2 className="text-5xl font-black tracking-[-0.04em]">정원준</h2>
                <p className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-white/92">
                  기획자&프론트엔드 개발자
                </p>
                <p className="mt-1 text-2xl font-bold text-white/88">소프트웨어학과</p>
                <p className="mt-1 text-2xl font-bold text-cyan-300">ESTP</p>
                <h3 className="mt-3 text-xl font-bold text-white/90">취미</h3>
                <ul className="mt-2 space-y-1 text-lg font-semibold text-white/90">
                  <li>야구</li>
                  <li>FC서울 직관</li>
                  <li>등산</li>
                </ul>
              </motion.article>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default WonjunPokemonIntro;
