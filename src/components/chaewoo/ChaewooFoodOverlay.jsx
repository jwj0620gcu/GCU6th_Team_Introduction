import { AnimatePresence, motion } from 'framer-motion';

export default function ChaewooFoodOverlay({ currentFood, showFoodAnimation, toastText }) {
  return (
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
  );
}
