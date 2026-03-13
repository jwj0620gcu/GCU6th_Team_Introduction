import { jaebinHeroContent, jaebinHeroLayout } from '../content/jaebinHeroContent';

function JaebinPage() {
  return (
    <section className="jaebin-hero">
      <div className="jaebin-hero__atmosphere" aria-hidden="true">
        <div className="jaebin-hero__mist jaebin-hero__mist--far" />
        <div className="jaebin-hero__mist jaebin-hero__mist--near" />
        <div className="jaebin-hero__stars" />
      </div>

      <div className="jaebin-hero__scene" aria-hidden="true">
        <div className="jaebin-hero__abyss" />

        <div
          className="jaebin-hero__intro-panel"
          style={{
            top: jaebinHeroLayout.panel.top,
            left: jaebinHeroLayout.panel.left,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="jaebin-hero__eyebrow">{jaebinHeroContent.eyebrow}</span>
          <h1>
            {jaebinHeroContent.title.split('\n').map((line) => (
              <span key={line} className="jaebin-hero__title-line">
                {line}
              </span>
            ))}
          </h1>
        </div>

        <div className="jaebin-hero__cliff">
          <div className="jaebin-hero__cliff-face" />
          <div className="jaebin-hero__cliff-ridge" />

          <div className="jaebin-hero__cliff-words">
            {jaebinHeroContent.cliffWords.map((word) => (
              <span
                key={word.text}
                className={`jaebin-hero__cliff-word jaebin-hero__cliff-word--${word.tone}`}
                style={{ top: word.top, left: word.left, fontSize: word.size }}
              >
                {word.text}
              </span>
            ))}
          </div>

        </div>

        <div className="jaebin-hero__crest">
          <div className="jaebin-hero__crest-band jaebin-hero__crest-band--one" />
          <div className="jaebin-hero__crest-band jaebin-hero__crest-band--two" />
          <div className="jaebin-hero__crest-band jaebin-hero__crest-band--three" />
          <div className="jaebin-hero__crest-foam jaebin-hero__crest-foam--one" />
          <div className="jaebin-hero__crest-foam jaebin-hero__crest-foam--two" />
          <div className="jaebin-hero__crest-current jaebin-hero__crest-current--one" />
          <div className="jaebin-hero__crest-current jaebin-hero__crest-current--two" />
          <div className="jaebin-hero__crest-current jaebin-hero__crest-current--three" />
          <div className="jaebin-hero__crest-current jaebin-hero__crest-current--four" />
          <div className="jaebin-hero__crest-current jaebin-hero__crest-current--five" />
        </div>

        <div
          className="jaebin-hero__boat-wrap"
          style={{
            left: jaebinHeroLayout.boat.left,
            top: jaebinHeroLayout.boat.top,
          }}
        >
          <div className="jaebin-hero__boat-shadow" />
          <div className="jaebin-hero__boat">
            <div className="jaebin-hero__mast" />
            <div className="jaebin-hero__sail" />
            <div className="jaebin-hero__oar" />
            <div className="jaebin-hero__hull" />
            <div className="jaebin-hero__wake" />
            <div className="jaebin-hero__portrait-frame">
              <img
                src={jaebinHeroContent.profileImage}
                alt={jaebinHeroContent.profileAlt}
                className="jaebin-hero__portrait"
              />
            </div>
            <div className="jaebin-hero__nameplate">{jaebinHeroContent.nameplate}</div>
          </div>
        </div>
      </div>

      <div className="jaebin-hero__content">
        <div className="jaebin-hero__content-stack">
          <div className="jaebin-hero__badge">{jaebinHeroContent.badge}</div>
          <p className="jaebin-hero__declaration">{jaebinHeroContent.declaration}</p>
          <div className="jaebin-hero__stats">
            {jaebinHeroContent.stats.map((item) => (
              <article key={item.label} className="jaebin-hero__stat-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default JaebinPage;
