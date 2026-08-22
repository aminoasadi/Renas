import type { RouteStoriesContent } from "@renas/shared";

export function RouteStoriesSection({ content }: { content: unknown }) {
  const c = content as RouteStoriesContent;
  return (
    <section className="m-routes section--charcoal" data-theme-bg="charcoal">
      <div className="container">
        {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
        <h2 className="m-routes__headline headline">{c.headline}</h2>
        {c.supportingLine && <p className="body-lg">{c.supportingLine}</p>}
      </div>

      <div className="m-routes__track" id="routesTrack" style={{ height: `${Math.max(200, c.stories.length * 100 + 60)}vh` }}>
        <div className="m-routes__rail" id="routesRail">
          {c.stories.map((story, i) => (
            <article key={i} className="m-route" data-route={i}>
              <figure className="m-route__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.media.url} alt={story.media.alt ?? ""} loading="lazy" />
              </figure>
              <div className="m-route__type">
                <p className="m-route__label">{story.label}</p>
                <h3 className="m-route__title">{story.title}</h3>
                <p>{story.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
