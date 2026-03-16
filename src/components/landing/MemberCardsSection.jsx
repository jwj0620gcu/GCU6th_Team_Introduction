import { Link } from 'react-router-dom';
import MemberPhoto from '../MemberPhoto';

export default function MemberCardsSection({ members, nextSectionRef }) {
  return (
    <section ref={nextSectionRef} className="next">
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
              <Link to={member.detailPath} className="mt-3 block text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                {member.shortName} 상세 페이지 보기
              </Link>
            </article>
          ))}
        </div>

        <section className="mx-auto mt-16 w-full max-w-4xl px-3 text-left md:px-6">
          <article className="card mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/6 p-4 md:p-5">
            <img src="/members/group.jpeg" alt="팀 단체사진" className="h-auto w-full object-cover" loading="lazy" />
          </article>
        </section>

        <h2 className="mt-12 text-4xl font-black tracking-[-0.06em] md:text-6xl">우리 팀원 자기소개</h2>
        <p className="next-lead">문제를 해결하기 위해 모인 네 명의 창업가</p>
      </div>
    </section>
  );
}
