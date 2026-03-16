import { AnimatePresence, motion } from 'framer-motion';

export default function ChaewooIntroCard({ profile, showIntro }) {
  return (
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
                src={profile.image}
                alt={profile.name}
                className="h-44 w-full rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.src = profile.fallback;
                }}
              />
              <div className="mt-3 rounded-lg border border-red-200/20 bg-black/35 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-red-100/80">Status</p>
                <p className="mt-1 text-sm font-bold text-red-200">{profile.status}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-red-100/70">Revival Log</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-white">{profile.name}</h2>
                <p className="mt-1 text-sm font-semibold text-red-100/90">{profile.major}</p>
              </div>

              <div className="rounded-xl border border-red-100/15 bg-black/35 p-4">
                <p className="text-sm leading-7 text-white/90">{profile.summary}</p>
              </div>

              <div className="grid gap-3 text-sm text-white/90 md:grid-cols-2">
                <div className="rounded-xl border border-red-200/20 bg-red-500/10 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-red-100/80">관심 있는 분야</p>
                  <p className="mt-1 font-semibold">{profile.interests}</p>
                </div>
                <div className="rounded-xl border border-red-200/20 bg-red-500/10 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-red-100/80">취미</p>
                  <p className="mt-1 font-semibold">{profile.hobbies}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
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
  );
}
