export default function LandingHero({ refs }) {
  return (
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
  );
}
