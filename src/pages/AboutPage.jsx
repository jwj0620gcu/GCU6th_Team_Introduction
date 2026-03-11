function AboutPage() {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto w-[min(1100px,100%)]">
        <div className="pill inline-flex">
          <span className="kbd">scroll</span>로 끄스러미를 peel
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] md:text-6xl">
          끝까지 당겨서, 안쪽의 문제를 보이게.
        </h1>
        <p className="mt-3 max-w-4xl text-base leading-8 text-white/80">
          손톱 옆 끄스러미는 사소하지만, 한번 거슬리면 계속 신경 쓰입니다. 이 랜딩은 그 감각을 문제
          정의로 전환합니다. 남들이 피하는 불편한 지점을 끝까지 잡아당겨서, 감춰진 본질을 드러내는
          태도입니다.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="card rounded-2xl border border-white/10 bg-white/6 p-5">
            <h2 className="text-lg font-bold tracking-[-0.03em]">구성</h2>
            <p className="mt-2 text-sm leading-7 text-white/75">
              랜딩은 3개 레이어로 구성됩니다: 텍스트 상태 변화, 끄스러미 길이/회전/이동, 상처/피의
              중반 노출.
            </p>
          </article>
          <article className="card rounded-2xl border border-white/10 bg-white/6 p-5">
            <h2 className="text-lg font-bold tracking-[-0.03em]">보완 포인트</h2>
            <p className="mt-2 text-sm leading-7 text-white/75">
              스크롤 이벤트마다 즉시 렌더링하지 않고 rAF 추종으로 바꿔, 당김감이 더 매끈하게 이어지도록
              구성했습니다.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
