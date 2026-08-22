/**
 * Direct port of the swiss-editorial-motion design system's interaction
 * layer (see `~/.claude/skills/swiss-editorial-motion`), adapted only for
 * React lifecycle safety — every `addEventListener` takes the same
 * `{ signal }` so a single `controller.abort()` on unmount removes every
 * listener this function registered, with no other logic changed. The
 * requirement composer section of the original script is intentionally
 * NOT ported here: it becomes a real controlled React form
 * (`RequestSupplyForm`) instead of decorative client-only state, since it
 * now has to actually submit to the backend.
 */
export function initSiteMotion(signal: AbortSignal): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const opts = { signal } as AddEventListenerOptions;
  const passiveOpts = { signal, passive: true } as AddEventListenerOptions;

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
  const themedSections = document.querySelectorAll<HTMLElement>("[data-theme-bg]");
  if (header && themedSections.length) {
    const headerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.boundingClientRect.top < 100) {
            header.dataset.theme = (entry.target as HTMLElement).dataset.themeBg;
          }
        });
      },
      { rootMargin: "-76px 0px -85% 0px", threshold: 0 },
    );
    themedSections.forEach((s) => headerObserver.observe(s));
    signal.addEventListener("abort", () => headerObserver.disconnect());

    const onScrollHeaderState = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      if (window.scrollY <= 2) header.dataset.theme = "transparent";
    };
    window.addEventListener("scroll", onScrollHeaderState, passiveOpts);
    onScrollHeaderState();
  }

  /* ---------------- Contextual cursor (desktop only) ---------------- */
  const cursor = document.getElementById("mCursor");
  if (cursor && !isTouch) {
    const cursorTargets = [
      {
        sel: ".m-index__item",
        label: (el: Element) => "VIEW / " + (el.querySelector(".num-index")?.textContent ?? ""),
      },
      { sel: ".m-route", label: () => "EXPLORE" },
      { sel: ".btn--primary", label: () => "START" },
      { sel: ".m-node:not(.m-node--center)", label: () => "ACTIVATE" },
    ];
    document.addEventListener(
      "mousemove",
      (e) => {
        cursor.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 14}px)`;
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
  const hero = document.querySelector<HTMLElement>(".m-hero");
  const heroLines = document.querySelectorAll<HTMLElement>(".m-hero__line");
  const goldLine = document.querySelector<HTMLElement>(".m-hero__gold-line");
  const heroCursorMeta = document.getElementById("heroCursorMeta");
  const heroImgs = document.querySelectorAll<HTMLElement>(".m-hero__img");

  if (hero) {
    const onHeroScroll = () => {
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / (hero.offsetHeight * 0.65)));
      heroLines.forEach((line, i) => {
        line.classList.toggle("is-aligned", progress > i * 0.12);
      });
      if (goldLine) goldLine.style.width = progress * 100 + "%";
    };
    if (!reduceMotion) {
      window.addEventListener("scroll", onHeroScroll, passiveOpts);
    } else {
      heroLines.forEach((l) => l.classList.add("is-aligned"));
    }
    onHeroScroll();
  }

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

  /* ---------------- 02 Supply Equation ---------------- */
  const eqTerms = document.querySelectorAll<HTMLElement>(".m-eq-term");
  const eqReveal = document.getElementById("equationReveal");
  if (eqTerms.length && eqReveal) {
    const eqTextEl = eqReveal.querySelector(".m-equation__reveal-text");
    const setEqTerm = (term: string | undefined, el: HTMLElement | null) => {
      eqTerms.forEach((t) => t.classList.remove("is-active"));
      if (el) el.classList.add("is-active");
      if (eqTextEl) eqTextEl.textContent = el?.dataset.copy ?? "";
    };
    eqTerms.forEach((t) => {
      t.addEventListener("mouseenter", () => setEqTerm(t.dataset.term, t), opts);
      t.addEventListener("focus", () => setEqTerm(t.dataset.term, t), opts);
    });

    const eqSection = document.getElementById("equation");
    if (eqSection) {
      const onEqScroll = () => {
        const total = eqSection.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const rect = eqSection.getBoundingClientRect();
        const progress = Math.min(0.999, Math.max(0, -rect.top / total));
        const idx = Math.min(eqTerms.length - 1, Math.floor(progress * eqTerms.length));
        setEqTerm(eqTerms[idx].dataset.term, eqTerms[idx]);
      };
      if (!reduceMotion) window.addEventListener("scroll", onEqScroll, passiveOpts);
      onEqScroll();
    }
  }

  /* ---------------- 03 Supply System ---------------- */
  const systemStage = document.getElementById("systemStage");
  const systemNodes = document.querySelectorAll<HTMLElement>(".m-node[data-node]");
  const systemCenter = document.getElementById("systemCenter");
  const systemLines = document.getElementById("systemLines") as SVGSVGElement | null;
  const systemCopy = document.getElementById("systemCopy");

  function nodePosition(el: HTMLElement) {
    const stageRect = systemStage!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top + r.height / 2 };
  }

  const systemRevealOrder = [
    "center", "requirement", "product", "supplier", "market", "commercial", "documents", "route", "logistics", "delivery",
  ];

  function primeLineForDraw(path: SVGPathElement) {
    const length = path.getTotalLength();
    path.dataset.length = String(length);
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.classList.remove("is-drawn");
  }

  function getRelations(): Record<string, { connects: string[] }> | null {
    if (!systemStage) return null;
    try {
      return JSON.parse(systemStage.dataset.relations ?? "{}");
    } catch {
      return {};
    }
  }

  function drawSystemLines() {
    if (!systemStage || !systemLines) return;
    const stageRect = systemStage.getBoundingClientRect();
    systemLines.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);
    systemLines.innerHTML = "";
    const centerPos = systemCenter ? nodePosition(systemCenter) : null;
    const relations = getRelations() ?? {};

    systemNodes.forEach((nodeEl) => {
      const key = nodeEl.dataset.node!;
      const pos = nodePosition(nodeEl);
      if (centerPos) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M${pos.x},${pos.y} L${centerPos.x},${centerPos.y}`);
        path.dataset.pair = `${key}|center`;
        systemLines.appendChild(path);
        primeLineForDraw(path);
      }
      const rel = relations[key];
      if (rel) {
        rel.connects.forEach((otherKey) => {
          const otherEl = document.querySelector<HTMLElement>(`.m-node[data-node="${otherKey}"]`);
          if (!otherEl) return;
          const otherPos = nodePosition(otherEl);
          const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path2.setAttribute("d", `M${pos.x},${pos.y} L${otherPos.x},${otherPos.y}`);
          path2.dataset.pair = `${key}|${otherKey}`;
          systemLines.appendChild(path2);
          primeLineForDraw(path2);
        });
      }
    });
  }

  function refreshSystemReveal(progress: number) {
    if (!systemStage || !systemLines) return;
    const stepCount = systemRevealOrder.length + 1;
    const activeSteps = Math.min(stepCount, Math.floor(progress * stepCount) + (progress > 0 ? 1 : 0));

    systemRevealOrder.forEach((key, i) => {
      const el = key === "center" ? systemCenter : document.querySelector(`.m-node[data-node="${key}"]`);
      el?.classList.toggle("is-revealed", i < activeSteps);
    });

    systemLines.querySelectorAll<SVGPathElement>("path").forEach((p) => {
      const pair = p.dataset.pair!.split("|");
      const revealed = pair[1] === "center" ? systemRevealOrder.indexOf(pair[0]) < activeSteps : activeSteps >= stepCount;
      const len = p.dataset.length!;
      p.style.strokeDashoffset = revealed ? "0" : len;
      p.classList.toggle("is-drawn", revealed);
    });
  }

  function onSystemScroll() {
    if (!systemStage || window.innerWidth <= 860) return;
    const rect = systemStage.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = vh + rect.height * 0.5;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
    refreshSystemReveal(progress);
  }

  function activateSystemNode(key: string) {
    systemNodes.forEach((n) => n.classList.toggle("is-lit", n.dataset.node === key));
    const relations = getRelations() ?? {};
    const rel = relations[key];
    if (rel) {
      rel.connects.forEach((otherKey) => {
        document.querySelector(`.m-node[data-node="${otherKey}"]`)?.classList.add("is-lit");
      });
      const description = systemStage?.querySelector(`[data-node-desc="${key}"]`)?.textContent;
      if (systemCopy && description) systemCopy.textContent = description;
    }
    systemLines?.querySelectorAll<SVGPathElement>("path").forEach((p) => {
      const pair = p.dataset.pair!.split("|");
      const active =
        pair.includes(key) && (pair[1] === "center" || rel?.connects.includes(pair[0] === key ? pair[1] : pair[0]));
      p.classList.toggle("is-active", Boolean(active));
    });
  }

  function resetSystem() {
    systemNodes.forEach((n) => n.classList.remove("is-lit"));
    systemLines?.querySelectorAll("path").forEach((p) => p.classList.remove("is-active"));
    if (systemCopy) systemCopy.textContent = systemCopy.dataset.default ?? "";
  }

  if (systemStage && systemNodes.length) {
    drawSystemLines();
    window.addEventListener(
      "resize",
      () => {
        drawSystemLines();
        onSystemScroll();
      },
      opts,
    );
    systemNodes.forEach((n) => {
      n.addEventListener("mouseenter", () => activateSystemNode(n.dataset.node!), opts);
      n.addEventListener("focus", () => activateSystemNode(n.dataset.node!), opts);
      n.addEventListener("mouseleave", resetSystem, opts);
      n.addEventListener("blur", resetSystem, opts);
    });
    if (reduceMotion) {
      refreshSystemReveal(1);
    } else {
      window.addEventListener("scroll", onSystemScroll, passiveOpts);
      onSystemScroll();
    }
  }

  /* ---------------- 04 Component Index ---------------- */
  const indexItems = document.querySelectorAll<HTMLElement>(".m-index__item");
  const indexImages = document.querySelectorAll<HTMLElement>(".m-index__image");
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

  /* ---------------- 05 Decision Layer ---------------- */
  const decisionFactors = document.querySelectorAll<HTMLElement>(".m-decision__factor");
  const decisionBigword = document.getElementById("decisionBigword");
  if (decisionFactors.length && decisionBigword) {
    const decisionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) decisionBigword.textContent = (entry.target as HTMLElement).dataset.word ?? "";
        });
      },
      { threshold: 0.55 },
    );
    decisionFactors.forEach((f) => decisionObserver.observe(f));
    signal.addEventListener("abort", () => decisionObserver.disconnect());
  }

  /* ---------------- 06 Route Stories ---------------- */
  const routesTrack = document.getElementById("routesTrack");
  const routesRail = document.getElementById("routesRail");
  const routeCards = document.querySelectorAll<HTMLElement>(".m-route");

  function onRoutesScroll() {
    if (!routesTrack || !routesRail || window.innerWidth <= 860) return;
    const rect = routesTrack.getBoundingClientRect();
    const total = routesTrack.offsetHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, -rect.top / total));
    const maxShift = routesRail.scrollWidth - window.innerWidth;
    routesRail.style.transform = `translateX(-${progress * maxShift}px)`;

    routeCards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const inView = cardRect.left < window.innerWidth * 0.6 && cardRect.right > window.innerWidth * 0.4;
      card.classList.toggle("is-active", inView);
    });
  }
  if (routesTrack && routesRail) {
    window.addEventListener("scroll", onRoutesScroll, passiveOpts);
    window.addEventListener("resize", onRoutesScroll, opts);
    onRoutesScroll();
  }

  /* ---------------- 07 Operational Signals ---------------- */
  const signals = document.querySelectorAll<HTMLElement>(".m-signal");
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
  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealables = document.querySelectorAll(".m-route, .m-principle__item, .m-eq-term");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in-view");
        });
      },
      { threshold: 0.2 },
    );
    revealables.forEach((el) => revealObserver.observe(el));
    signal.addEventListener("abort", () => revealObserver.disconnect());
  }
}
