function ContactPage() {
  function onSubmit(event) {
    event.preventDefault();
    window.alert('데모: 전송은 비활성화되어 있어요.');
  }

  return (
    <section className="px-6 py-14">
      <div className="mx-auto w-[min(1100px,100%)]">
        <div className="pill inline-flex">데모 폼 (전송 비활성화)</div>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] md:text-6xl">Contact</h1>
        <p className="mt-3 max-w-4xl text-base leading-8 text-white/80">
          지금은 데모 UI만 구성했습니다. 원하면 다음 단계에서 이메일/슬랙/폼 백엔드 연동을 붙일 수 있습니다.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="card rounded-2xl border border-white/10 bg-white/6 p-5">
            <h2 className="text-lg font-bold tracking-[-0.03em]">메시지 남기기</h2>
            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              <label className="block text-sm text-white/75">
                이름
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/6 px-3 py-3 text-white outline-none focus:border-white/40"
                />
              </label>
              <label className="block text-sm text-white/75">
                이메일
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/6 px-3 py-3 text-white outline-none focus:border-white/40"
                />
              </label>
              <label className="block text-sm text-white/75">
                내용
                <textarea
                  rows="6"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/6 px-3 py-3 text-white outline-none focus:border-white/40"
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Send
              </button>
            </form>
          </article>

          <article className="card rounded-2xl border border-white/10 bg-white/6 p-5">
            <h2 className="text-lg font-bold tracking-[-0.03em]">빠른 링크</h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              - 랜딩: <span className="kbd">/</span>
              <br />- 코드 프리뷰: <span className="kbd">/code</span>
              <br />- 설명: <span className="kbd">/about</span>
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default ContactPage;
