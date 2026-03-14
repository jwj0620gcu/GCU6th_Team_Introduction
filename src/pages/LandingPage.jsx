import { useRef } from 'react';
import { Link } from 'react-router-dom';
import MemberPhoto from '../components/MemberPhoto';
import usePeelAnimation from '../hooks/usePeelAnimation';

const members = [
  {
    id: 'A',
    name: '정원준',
    shortName: '원준',
    photo: '/members/wonjun.jpg',
    major: '가천대 소프트웨어학과',
    desc: '과학적 검증을 통한 문제 정의로부터 솔루션을 도출합니다.',
    detailPath: '/pokemon',
  },
  {
    id: 'B',
    name: '이재빈',
    shortName: '재빈',
    photo: '/members/jaebin.jpeg',
    major: '가천대 기계공학과',
    desc: '유전적 관성을 거슬러 정신적 거인으로 역행하는 창업가',
    detailPath: '/jaebin',
  },
  {
    id: 'C',
    name: '김채우',
    shortName: '채우',
    photo: '/members/chaewoo.jpeg',
    major: '가천대 경영학 전공',
    desc: "가공된 껍데기를 PEEL하고, 선혈 낭자한 비즈니스의 본질을 '채우'하는 전략가",
    detailPath: '/chaewoo',
  },
  {
    id: 'D',
    name: '전유정',
    shortName: '유정',
    photo: '/members/yujeong.jpg',
    major: '충남대 컴퓨터 융합학부',
    desc: '사용자가 불편을 느끼는 지점을 찾아, 더 자연스러운 흐름으로 정리하는 기획자',
    detailPath: '/yujeong',
  },
];

function LandingPage() {
  const refs = {
    heroRef: useRef(null),
    stripRef: useRef(null),
    tipRef: useRef(null),
    fingerWrapRef: useRef(null),
    woundRef: useRef(null),
    tornSkinRef: useRef(null),
    bloodLineRef: useRef(null),
    bloodDropRef: useRef(null),
    fleshShredsRef: useRef(null),
    titleRef: useRef(null),
    subRef: useRef(null),
    nextSectionRef: useRef(null),
  };

  usePeelAnimation(refs);

  return (
    <>
      <section ref={refs.heroRef} className="hero relative bg-peelBg">
        <div className="sticky-layer">
          <div className="noise" />

          <div className="scene">
            <div ref={refs.titleRef} className="title" aria-live="polite">
              건드리지 마.
            </div>

            <div ref={refs.fingerWrapRef} className="finger-wrap">
              <div className="finger" />
              <div className="nail" />

              <div className="cuticle-area">
                <div ref={refs.woundRef} className="wound" />
                <div ref={refs.tornSkinRef} className="torn-skin" />
                <div ref={refs.bloodLineRef} className="blood-line" />
                <div ref={refs.bloodDropRef} className="blood-drop" />
                <div ref={refs.fleshShredsRef} className="flesh-shreds" />

                <div ref={refs.stripRef} className="hangnail-strip" />
                <div ref={refs.tipRef} className="tear-tip" />
              </div>
            </div>

            <div ref={refs.subRef} className="sub" aria-live="polite">
              근데… 이미 보고 있지?
            </div>
          </div>
        </div>
      </section>

      <section ref={refs.nextSectionRef} className="next">
        <div className="next-inner -translate-y-2 md:-translate-y-4">
          <div className="mt-12 grid grid-cols-1 gap-7 px-3 text-left md:grid-cols-2 md:px-6">
            {members.map((member) => (
              <article key={member.id} className="card rounded-2xl border border-white/10 bg-white/6 p-7 md:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="pill inline-flex">Team Member {member.id}</div>
                    <p className="mt-2 text-4xl font-black tracking-[-0.03em] text-white/88">{member.name}</p>
                  </div>
                  <MemberPhoto name={member.name} src={member.photo} />
                </div>
                <p className="mt-0.5 text-sm font-medium text-white/82">{member.major}</p>
                <p className="mt-2 text-sm leading-7 text-white/86">{member.desc}</p>
                <Link
                  to={member.detailPath}
                  className="mt-3 block text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  {member.shortName} 상세 페이지 보기
                </Link>
              </article>
            ))}
          </div>

          <section className="mx-auto mt-16 w-full max-w-4xl px-3 text-left md:px-6">
            <article className="card mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/6 p-4 md:p-5">
              <img
                src="/members/group.jpeg"
                alt="팀 단체사진"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </article>
          </section>

          <h2 className="mt-12 text-4xl font-black tracking-[-0.06em] md:text-6xl">우리 팀원 자기소개</h2>
          <p className="next-lead">문제를 해결하기 위해 모인 네 명의 창업가</p>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
