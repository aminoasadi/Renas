/**
 * GSAP + ScrollTrigger interaction layer for the Swiss-editorial homepage
 * (see `~/.claude/skills/swiss-editorial-motion`). Scroll-linked behavior
 * (header theme, hero reveal, the equation/system/decision/routes scroll
 * choreography, reveal-on-scroll) is driven by ScrollTrigger; hover-only
 * interactions (equation term hover, system node hover, index category
 * switch, signal hover, custom cursor) stay as plain DOM listeners since
 * they aren't scroll-driven and CSS transitions already handle them.
 *
 * The requirement composer is a real controlled React form
 * (`RequestSupplyForm`) rather than decorative client-only state, since it
 * has to actually submit to the backend.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initSiteMotion(signal: AbortSignal): void {
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const opts = { signal } as AddEventListenerOptions;

  const ctx = gsap.context(() => {
    /* ---------------- Mobile nav ---------------- */
    const navToggle = document.getElementById("mNavToggle");
    const mobileNav = document.getElementById("mMobileNav");
    if (navToggle && mobileNav) {
      navToggle.addEventListener(
        "click",
        () => {
          const open = mobileNav.classList.toggle("is-open");
          navToggle.setAttribute("aria-expanded", String(open));
        },
        opts,
      );
      mobileNav.querySelectorAll("a").forEach((a) => {
        a.addEventListener(
          "click",
          () => {
            mobileNav.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
          },
          opts,
        );
      });
    }

    /* ---------------- Header theme reacts to section background ---------------- */
    const header = document.getElementById("mHeader") as (HTMLElement & { dataset: DOMStringMap }) | null;
    const themedSections = gsap.utils.toArray<HTMLElement>("[data-theme-bg]");
    if (header && themedSections.length) {
      themedSections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 100px",
          end: "bottom 100px",
          onEnter: () => (header.dataset.theme = section.dataset.themeBg),
          onEnterBack: () => (header.dataset.theme = section.dataset.themeBg),
        });
      });

      const onScrollHeaderState = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        if (window.scrollY < 40) header.dataset.theme = "transparent";
      };
      window.addEventListener("scroll", onScrollHeaderState, { signal, passive: true });
      onScrollHeaderState();
    }

    /* ---------------- Contextual cursor (desktop only) ---------------- */
    const cursor = document.getElementById("mCursor");
    if (cursor && !isTouch) {
      const moveCursor = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3" });
      const moveCursorY = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3" });
      const cursorTargets = [
        { sel: ".m-index__item", label: (el: Element) => "VIEW / " + (el.querySelector(".num-index")?.textContent ?? "") },
        { sel: ".m-route", label: () => "EXPLORE" },
        { sel: ".btn--primary", label: () => "START" },
      ];
      document.addEventListener(
        "mousemove",
        (e) => {
          moveCursor(e.clientX + 14);
          moveCursorY(e.clientY + 14);
        },
        opts,
      );
      cursorTargets.forEach((t) => {
        document.querySelectorAll(t.sel).forEach((el) => {
          el.addEventListener(
            "mouseenter",
            () => {
              cursor.textContent = t.label(el);
              cursor.classList.add("is-visible");
            },
            opts,
          );
          el.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"), opts);
        });
      });
    }

    /* ---------------- 01 Kinetic Hero ---------------- */
    const heroCursorMeta = document.getElementById("heroCursorMeta");
    const heroImgs = gsap.utils.toArray<HTMLElement>(".m-hero__img");

    if (heroCursorMeta && heroImgs.length && !isTouch) {
      heroImgs.forEach((fig) => {
        fig.addEventListener(
          "mousemove",
          (e) => {
            const evt = e as MouseEvent;
            heroCursorMeta.textContent = fig.dataset.meta ?? "";
            heroCursorMeta.style.transform = `translate(${evt.clientX + 16}px,${evt.clientY - 8}px)`;
            heroCursorMeta.classList.add("is-visible");
            fig.classList.add("is-focused");
          },
          opts,
        );
        fig.addEventListener(
          "mouseleave",
          () => {
            heroCursorMeta.classList.remove("is-visible");
            fig.classList.remove("is-focused");
          },
          opts,
        );
      });
    }

    /* ---------------- 02 Supply Equation (sticky scroll-scrubbed) ---------------- */
    const eqSection = document.getElementById("equation");
    const eqTerms = gsap.utils.toArray<HTMLElement>(".m-eq-term");
    const eqReveal = document.getElementById("equationReveal");
    if (eqSection && eqTerms.length && eqReveal) {
      const eqTextEl = eqReveal.querySelector(".m-equation__reveal-text");
      const setEqTerm = (el: HTMLElement) => {
        eqTerms.forEach((t) => t.classList.remove("is-active"));
        el.classList.add("is-active");
        if (eqTextEl) eqTextEl.textContent = el.dataset.copy ?? "";
      };
      eqTerms.forEach((t) => {
        t.addEventListener("mouseenter", () => setEqTerm(t), opts);
        t.addEventListener("focus", () => setEqTerm(t), opts);
      });

      ScrollTrigger.create({
        trigger: eqSection,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(eqTerms.length - 1, Math.floor(self.progress * eqTerms.length));
          setEqTerm(eqTerms[idx]);
        },
      });
    }

    /* ---------------- 03 What RENAS Handles (sticky scroll-driven reel) ---------------- */
    const systemSection = document.getElementById("system");
    const systemReel = document.getElementById("systemReel");
    const systemReelItems = gsap.utils.toArray<HTMLElement>(".m-system__reel-item");

    if (systemSection && systemReel && systemReelItems.length) {
      let lineHeight = 0;
      const measure = () => {
        lineHeight = systemReelItems[0].getBoundingClientRect().height;
        // One line of top padding centers item[0] in the viewport's middle
        // slot at progress 0, so item[0] starts where the fixed line's
        // sentence would end — same trick used for the reveal below.
        systemReel.style.paddingTop = `${lineHeight}px`;
      };
      measure();
      window.addEventListener("resize", measure, opts);

      // Continuous, not stepped: `reelProgress` is a fractional index, so
      // the column glides between words and the ones just above/below the
      // center are still visible (dimmed) while it's mid-transition —
      // that's the "previous/next also show, faded" behavior the reel is
      // for, as opposed to a hard cut between single words.
      const refreshReel = (progress: number) => {
        const reelProgress = progress * (systemReelItems.length - 1);
        systemReel.style.transform = `translateY(${-reelProgress * lineHeight}px)`;
        systemReelItems.forEach((item, i) => {
          const distance = Math.abs(i - reelProgress);
          item.style.opacity = String(Math.max(0.18, 1 - distance * 0.55));
          item.classList.toggle("is-active", distance < 0.5);
        });
      };
      refreshReel(0);

      // Trigger spans the tall `#system` wrapper — CSS `position: sticky`
      // holds `.m-system__sticky` in place for that whole distance, so
      // scrolling through it reads as "arrive, watch every word the
      // sentence can end on reel past, then continue" rather than an
      // instant cut.
      ScrollTrigger.create({
        trigger: systemSection,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => refreshReel(self.progress),
        onRefresh: (self) => {
          measure();
          refreshReel(self.progress);
        },
      });
    }

    /* ---------------- 04 Component Index (hover-driven, not scroll) ---------------- */
    const indexItems = gsap.utils.toArray<HTMLElement>(".m-index__item");
    const indexImages = gsap.utils.toArray<HTMLElement>(".m-index__image");
    const idxMetaCat = document.getElementById("idxMetaCat");
    const idxMetaSys = document.getElementById("idxMetaSys");

    function setIndexCat(cat: string, num: string, sys: string) {
      indexItems.forEach((i) => {
        const active = i.dataset.cat === cat;
        i.classList.toggle("is-active", active);
        i.setAttribute("aria-selected", String(active));
      });
      indexImages.forEach((i) => i.classList.toggle("is-active", i.dataset.cat === cat));
      if (idxMetaCat) idxMetaCat.textContent = "CATEGORY / " + num;
      if (idxMetaSys) idxMetaSys.textContent = "SYSTEM / " + sys;
    }
    indexItems.forEach((item) => {
      const num = item.querySelector(".num-index")?.textContent ?? "";
      const sys = item.dataset.sys ?? "";
      const trigger = isTouch ? "click" : "mouseenter";
      item.addEventListener(trigger, () => setIndexCat(item.dataset.cat!, num, sys), opts);
      item.addEventListener("focus", () => setIndexCat(item.dataset.cat!, num, sys), opts);
    });

    const indexLeft = document.querySelector<HTMLElement>(".m-index__left");
    const indexStage = document.getElementById("indexStage");
    function matchIndexStageHeight() {
      if (!indexLeft || !indexStage) return;
      if (window.innerWidth <= 760) {
        indexStage.classList.remove("js-matched-height");
        indexStage.style.height = "";
        return;
      }
      indexStage.classList.add("js-matched-height");
      indexStage.style.height = indexLeft.offsetHeight + "px";
    }
    window.addEventListener("resize", matchIndexStageHeight, opts);
    matchIndexStageHeight();

    /* ---------------- 05 Decision Layer (scroll-triggered word swap) ---------------- */
    const decisionFactors = gsap.utils.toArray<HTMLElement>(".m-decision__factor");
    const decisionBigword = document.getElementById("decisionBigword");
    if (decisionFactors.length && decisionBigword) {
      decisionFactors.forEach((factor) => {
        ScrollTrigger.create({
          trigger: factor,
          start: "top center",
          end: "bottom center",
          onEnter: () => (decisionBigword.textContent = factor.dataset.word ?? ""),
          onEnterBack: () => (decisionBigword.textContent = factor.dataset.word ?? ""),
        });
      });
    }

    /* ---------------- 07 Operational Signals (hover-driven, not scroll) ---------------- */
    const signals = gsap.utils.toArray<HTMLElement>(".m-signal");
    const signalsExplain = document.getElementById("signalsExplain");
    if (signals.length && signalsExplain) {
      signals.forEach((s) => {
        s.addEventListener(
          "mouseenter",
          () => {
            signals.forEach((o) => o.classList.remove("is-active"));
            s.classList.add("is-active");
            signalsExplain.textContent = s.dataset.description ?? "";
          },
          opts,
        );
      });
    }

    /* ---------------- Reveal-on-scroll for general elements ---------------- */
    const revealTargets = gsap.utils.toArray<HTMLElement>(".m-principle__item, .m-eq-term");
    if (revealTargets.length) {
      gsap.set(revealTargets, { autoAlpha: 0, y: 24 });
      ScrollTrigger.batch(revealTargets, {
        start: "top 88%",
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.1, overwrite: true }),
      });
    }
  });

  /* ---------------- 06 Route Stories (pinned horizontal scrub) ----------------
   * Deliberately created OUTSIDE the gsap.context() above — gsap.matchMedia()
   * manages its own internal context, and nesting it inside another one is
   * explicitly called out as unsupported (its animations silently never ran
   * when it was nested here). */
  const routesTrack = document.getElementById("routesTrack");
  const routesRail = document.getElementById("routesRail");
  const routeCards = gsap.utils.toArray<HTMLElement>(".m-route");

  if (routesTrack && routesRail && routeCards.length) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 861px)", () => {
      // Each card is `flex: 0 0 100vw`, so the total shift is deterministic
      // from the card count — computing it from `scrollWidth` instead is
      // unreliable because GSAP evaluates a function-based tween value once
      // at first render, and images may not have finished laying out the
      // rail yet at that point (silently locking the shift to 0).
      const getMaxShift = () => (routeCards.length - 1) * window.innerWidth;
      const tween = gsap.to(routesRail, {
        x: () => -getMaxShift(),
        ease: "none",
        scrollTrigger: {
          trigger: routesTrack,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          // `x` is function-based so it tracks viewport width, but GSAP only
          // re-runs such functions on refresh when explicitly told to —
          // without this the shift distance stays frozen at whatever the
          // very first (pre-image-load) layout produced.
          invalidateOnRefresh: true,
          onUpdate: () => {
            routeCards.forEach((card) => {
              const cardRect = card.getBoundingClientRect();
              const inView = cardRect.left < window.innerWidth * 0.6 && cardRect.right > window.innerWidth * 0.4;
              card.classList.toggle("is-active", inView);
            });
          },
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    signal.addEventListener("abort", () => mm.revert());
  }

  // Every scroll-linked trigger above computes its start/end pixel
  // positions from the DOM as it exists at creation time. Images (loaded
  // as plain <img> tags, not next/image) can still be decoding then, and
  // once they finish, the page grows taller and every ScrollTrigger below
  // them ends up bound to stale positions — e.g. the route-stories rail
  // computing a real horizontal shift but ScrollTrigger's progress never
  // leaving 0 because the trigger's cached "start" no longer lines up with
  // where the section actually is. Refreshing after images settle re-syncs
  // every trigger created above to the final layout.
  // Refresh per settled image rather than only once they've *all* settled:
  // the route images are `loading="lazy"`, so they don't begin loading until
  // scrolled near and would otherwise hold a "wait for the last one" counter
  // open indefinitely.
  Array.from(document.images)
    .filter((img) => !img.complete)
    .forEach((img) => {
      const onSettle = () => ScrollTrigger.refresh();
      img.addEventListener("load", onSettle, { signal, once: true });
      img.addEventListener("error", onSettle, { signal, once: true });
    });

  // React effects frequently run *after* window "load" has already fired, in
  // which case a plain listener would never be called — so check readyState
  // and refresh on the next frame instead of waiting for an event that has
  // already come and gone.
  if (document.readyState === "complete") {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  } else {
    window.addEventListener("load", () => ScrollTrigger.refresh(), { signal, once: true });
  }

  signal.addEventListener("abort", () => ctx.revert());
}
