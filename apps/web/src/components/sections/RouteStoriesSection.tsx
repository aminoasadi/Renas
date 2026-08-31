import type { RouteStoriesContent } from "@renas/shared";

const LINE_PATHS = [
  "M4 30 C60 30, 90 8, 196 8",
  "M4 20 C60 34, 90 4, 196 18",
  "M4 8 C60 8, 90 32, 196 30",
  "M4 26 C60 4, 90 30, 196 6",
];

/** Vertical scroll distance allotted per card, in vh. Lower = the rail moves
 *  through the cards faster and the section occupies less total scroll. */
const SCROLL_PER_CARD_VH = 70;

export function RouteStoriesSection({ content }: { content: unknown }) {
  const c = content as RouteStoriesContent;
  const trackHeight = Math.max(200, c.stories.length * SCROLL_PER_CARD_VH + 40);

  return (
    <section className="m-routes section--charcoal" id="routes" aria-label="Route stories" data-theme-bg="charcoal">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="m-routes__headline headline">{c.headline}</h2>
        {c.supportingLine && <p className="body-lg">{c.supportingLine}</p>}
      </div>

      <div
        className="m-routes__track"
        id="routesTrack"
        style={{ ["--routes-track-height" as string]: `${trackHeight}vh` }}
      >
        {/* Fixed clip window — never transformed. */}
        <div className="m-routes__viewport">
          {/* The element GSAP translates; as wide as all its cards combined. */}
          <div className="m-routes__rail" id="routesRail">
            {c.stories.map((story, i) => (
              <article key={i} className="m-route" data-route={i}>
                <figure className="m-route__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.media.url}
                    alt={story.media.alt ?? ""}
                    // The first cards are revealed by a horizontal transform
                    // rather than by entering the viewport vertically, so
                    // eager-load them to avoid a blank first transition.
                    loading={i < 2 ? "eager" : "lazy"}
                  />
                </figure>
                <div className="m-route__type">
                  <p className="m-route__label">{story.label}</p>
                  <h3 className="m-route__title">{story.title}</h3>
                  <svg className="m-route__line" viewBox="0 0 200 40" aria-hidden="true">
                    <path d={LINE_PATHS[i % LINE_PATHS.length]} />
                  </svg>
                  <p>{story.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
