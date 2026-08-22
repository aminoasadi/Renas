export default function NotFound() {
  return (
    <section className="section section--charcoal" style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className="headline" style={{ fontSize: "var(--fs-display)", margin: "var(--sp-4) 0 var(--sp-5)" }}>
          Page not found.
        </h1>
        <p className="body-lg" style={{ marginBottom: "var(--sp-7)" }}>
          The page you're looking for doesn't exist or hasn't been published yet.
        </p>
        <a href="/" className="btn btn--primary">
          BACK TO HOME <span className="arrow">↗</span>
        </a>
      </div>
    </section>
  );
}
