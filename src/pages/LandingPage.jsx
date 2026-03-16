import { useRef } from 'react';
import LandingFooter from '../components/landing/LandingFooter';
import LandingHero from '../components/landing/LandingHero';
import MemberCardsSection from '../components/landing/MemberCardsSection';
import { members } from '../content/members';
import usePeelAnimation from '../hooks/usePeelAnimation';

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
      <LandingHero refs={refs} />
      <MemberCardsSection members={members} nextSectionRef={refs.nextSectionRef} />
      <LandingFooter />
    </>
  );
}

export default LandingPage;
