export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#07080d] px-4 py-12 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-extrabold tracking-tight md:text-xl">GCS 6TH GROUP의 소식을 먼저 받아보세요!</p>
        </div>

        <form
          className="flex w-full max-w-xl items-center overflow-hidden rounded-full border border-white/20 bg-white/5"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            className="w-full bg-transparent px-5 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none"
            aria-label="이메일"
          />
          <button
            type="submit"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-black transition hover:bg-cyan-200"
            aria-label="제출하기"
          >
            →
          </button>
        </form>
      </div>
    </footer>
  );
}
