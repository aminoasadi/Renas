"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section section--charcoal" style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
      <div className="container">
        <p className="eyebrow">ERROR</p>
        <h1 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) 0 var(--sp-5)" }}>
          Something went wrong.
        </h1>
        <p className="body-lg" style={{ marginBottom: "var(--sp-7)" }}>
          The page failed to load. This has been logged — please try again.
        </p>
        <button onClick={() => reset()} className="btn btn--primary">
          TRY AGAIN
        </button>
      </div>
    </section>
  );
}
