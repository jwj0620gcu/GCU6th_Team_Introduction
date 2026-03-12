import { useRef } from 'react';
import MemberPhoto from '../components/MemberPhoto';
import usePeelAnimation from '../hooks/usePeelAnimation';

const members = [
  {
    id: 'A',
    name: '정원준',
    photo: '/members/wonjun.jpg',
    major: '가천대 소프트웨어학과',
    desc: '문제 정의와 우선순위 설정을 맡아 프로젝트 방향을 설계합니다.',
  },
  {
    id: 'B',
    name: '이재빈',
    photo: '/members/b.svg',
    major: '가천대 기계공학과',
    desc: '사용자 경험 중심으로 인터랙션과 화면 완성도를 높입니다.',
  },
  {
    id: 'C',
    name: '김채우',
    photo: '/members/c.svg',
    major: '가천대 경영학과',
    desc: '안정적인 구조와 데이터 흐름을 설계해 서비스 신뢰도를 만듭니다.',
  },
  {
    id: 'D',
    name: '전유정',
    photo: '/members/d.svg',
    major: '충남대 컴퓨터 융합학부',
    desc: '실험과 검증을 반복하며 실제 임팩트가 나는 실행 전략을 만듭니다.',
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
          <h2 className="mt-1 text-4xl font-black tracking-[-0.06em] md:text-6xl">우리 팀원 자기소개 </h2>
          <p className="next-lead">
            문제를 해결하기 위해 모인 네 명의 창업가
          </p>

          <section className="mx-auto mt-6 w-full max-w-4xl text-left">
            <article className="card mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/6">
              <img
                src="/members/group-dummy.svg"
                alt="팀 단체사진 더미"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </article>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
            {members.map((member) => (
              <article key={member.id} className="card rounded-2xl border border-white/10 bg-white/6 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="pill inline-flex">Team Member {member.id}</div>
                    <p className="mt-2 text-4xl font-black tracking-[-0.03em] text-white/88">{member.name}</p>
                  </div>
                  <MemberPhoto name={member.name} src={member.photo} />
                </div>
                <p className="mt-0.5 text-sm font-medium text-white/82">{member.major}</p>
                <p className="mt-2 text-sm leading-7 text-white/86">{member.desc}</p>
                <span className="mt-3 block text-xs font-medium text-white/45">{member.id} 상세 페이지 준비중</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
