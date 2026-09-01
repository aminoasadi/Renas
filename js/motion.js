(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.getElementById("mNavToggle");
  var mobileNav = document.getElementById("mMobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Header theme reacts to section background ---------------- */
  var header = document.getElementById("mHeader");
  var themedSections = document.querySelectorAll("[data-theme-bg]");
  if (header && themedSections.length) {
    var headerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.boundingClientRect.top < 100) {
          header.dataset.theme = entry.target.dataset.themeBg;
        }
      });
    }, { rootMargin: "-76px 0px -85% 0px", threshold: 0 });
    themedSections.forEach(function (s) { headerObserver.observe(s); });

    function onScrollHeaderState() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      if (window.scrollY <= 2) header.dataset.theme = "transparent";
    }
    window.addEventListener("scroll", onScrollHeaderState, { passive: true });
    onScrollHeaderState();
  }

  /* ---------------- Contextual cursor (desktop only) ---------------- */
  var cursor = document.getElementById("mCursor");
  if (cursor && !isTouch) {
    var cursorTargets = [
      { sel: ".m-index__item", label: function (el) { return "VIEW / " + (el.querySelector(".num-index") ? el.querySelector(".num-index").textContent : ""); } },
      { sel: ".m-route", label: function () { return "EXPLORE"; } },
      { sel: ".btn--primary", label: function () { return "START"; } },
      { sel: ".m-node:not(.m-node--center)", label: function () { return "ACTIVATE"; } }
    ];
    document.addEventListener("mousemove", function (e) {
      cursor.style.transform = "translate(" + (e.clientX + 14) + "px," + (e.clientY + 14) + "px)";
    });
    cursorTargets.forEach(function (t) {
      document.querySelectorAll(t.sel).forEach(function (el) {
        el.addEventListener("mouseenter", function () {
          cursor.textContent = t.label(el);
          cursor.classList.add("is-visible");
        });
        el.addEventListener("mouseleave", function () {
          cursor.classList.remove("is-visible");
        });
      });
    });
  }

  /* ---------------- 01 Kinetic Hero ---------------- */
  var hero = document.querySelector(".m-hero");
  var heroLines = document.querySelectorAll(".m-hero__line");
  var goldLine = document.querySelector(".m-hero__gold-line");
  var heroCursorMeta = document.getElementById("heroCursorMeta");
  var heroImgs = document.querySelectorAll(".m-hero__img");

  if (hero) {
    function onHeroScroll() {
      var rect = hero.getBoundingClientRect();
      var progress = Math.min(1, Math.max(0, -rect.top / (hero.offsetHeight * 0.65)));
      heroLines.forEach(function (line, i) {
        if (progress > i * 0.12) line.classList.add("is-aligned");
        else line.classList.remove("is-aligned");
      });
      if (goldLine) goldLine.style.width = (progress * 100) + "%";
    }
    if (!reduceMotion) {
      window.addEventListener("scroll", onHeroScroll, { passive: true });
    } else {
      heroLines.forEach(function (l) { l.classList.add("is-aligned"); });
    }
    onHeroScroll();
  }

  if (heroCursorMeta && heroImgs.length && !isTouch) {
    heroImgs.forEach(function (fig) {
      fig.addEventListener("mousemove", function (e) {
        heroCursorMeta.textContent = fig.dataset.meta;
        heroCursorMeta.style.transform = "translate(" + (e.clientX + 16) + "px," + (e.clientY - 8) + "px)";
        heroCursorMeta.classList.add("is-visible");
        fig.classList.add("is-focused");
      });
      fig.addEventListener("mouseleave", function () {
        heroCursorMeta.classList.remove("is-visible");
        fig.classList.remove("is-focused");
      });
    });
  }

  /* ---------------- 02 Supply Equation ---------------- */
  var eqTerms = document.querySelectorAll(".m-eq-term");
  var eqReveal = document.getElementById("equationReveal");
  var eqCopy = {
    requirement: "A sourcing process only works when the requirement is understood correctly.",
    market: "A quotation means little without understanding the market around it.",
    verification: "Supplier capability must be assessed before commercial commitment.",
    execution: "Trade only becomes real when goods, documents and logistics move together.",
    delivery: "The outcome is not a supplier introduction. The outcome is delivered supply."
  };
  if (eqTerms.length && eqReveal) {
    var eqTextEl = eqReveal.querySelector(".m-equation__reveal-text");
    function setEqTerm(term, el) {
      eqTerms.forEach(function (t) { t.classList.remove("is-active"); });
      if (el) el.classList.add("is-active");
      eqTextEl.textContent = eqCopy[term] || "";
    }
    eqTerms.forEach(function (t) {
      t.addEventListener("mouseenter", function () { setEqTerm(t.dataset.term, t); });
      t.addEventListener("focus", function () { setEqTerm(t.dataset.term, t); });
    });

    var eqSection = document.getElementById("equation");
    if (eqSection) {
      function onEqScroll() {
        var total = eqSection.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        var rect = eqSection.getBoundingClientRect();
        var progress = Math.min(0.999, Math.max(0, -rect.top / total));
        var idx = Math.min(eqTerms.length - 1, Math.floor(progress * eqTerms.length));
        setEqTerm(eqTerms[idx].dataset.term, eqTerms[idx]);
      }
      if (!reduceMotion) window.addEventListener("scroll", onEqScroll, { passive: true });
      onEqScroll();
    }
  }

  /* ---------------- 03 Supply System ---------------- */
  var systemStage = document.getElementById("systemStage");
  var systemNodes = document.querySelectorAll(".m-node[data-node]");
  var systemCenter = document.getElementById("systemCenter");
  var systemLines = document.getElementById("systemLines");
  var systemCopy = document.getElementById("systemCopy");

  var systemRelations = {
    requirement: { connects: ["product", "documents"], copy: "A requirement is only actionable once it is translated into a specific, sourceable product." },
    product: { connects: ["requirement", "supplier", "market"], copy: "The product must match both the technical requirement and what suppliers can actually provide." },
    supplier: { connects: ["product", "market", "commercial"], copy: "A supplier is evaluated within the context of capability, product alignment and commercial feasibility." },
    market: { connects: ["product", "supplier", "commercial"], copy: "Market conditions determine whether a quotation is competitive or simply available." },
    commercial: { connects: ["supplier", "market", "documents"], copy: "Commercial terms are only meaningful once documentation and logistics can support them." },
    documents: { connects: ["requirement", "commercial", "route"], copy: "The viable sourcing option is not always the cheapest quotation. The route must work too." },
    route: { connects: ["documents", "logistics", "delivery"], copy: "The viable sourcing option is not always the cheapest quotation. The route must work too." },
    logistics: { connects: ["route", "delivery"], copy: "Logistics translates a planned route into a physical movement of goods." },
    delivery: { connects: ["route", "logistics"], copy: "Delivery is the point where every prior decision either holds or fails." }
  };

  function nodePosition(el) {
    var stageRect = systemStage.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return {
      x: r.left - stageRect.left + r.width / 2,
      y: r.top - stageRect.top + r.height / 2
    };
  }

  var systemRevealOrder = ["center", "requirement", "product", "supplier", "market", "commercial", "documents", "route", "logistics", "delivery"];

  function primeLineForDraw(path) {
    var length = path.getTotalLength();
    path.dataset.length = length;
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.classList.remove("is-drawn");
  }

  function drawSystemLines() {
    if (!systemStage || !systemLines) return;
    var stageRect = systemStage.getBoundingClientRect();
    systemLines.setAttribute("viewBox", "0 0 " + stageRect.width + " " + stageRect.height);
    systemLines.innerHTML = "";
    var centerPos = systemCenter ? nodePosition(systemCenter) : null;

    systemNodes.forEach(function (nodeEl) {
      var key = nodeEl.dataset.node;
      var pos = nodePosition(nodeEl);
      if (centerPos) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M" + pos.x + "," + pos.y + " L" + centerPos.x + "," + centerPos.y);
        path.dataset.pair = key + "|center";
        systemLines.appendChild(path);
        primeLineForDraw(path);
      }
      var rel = systemRelations[key];
      if (rel) {
        rel.connects.forEach(function (otherKey) {
          var otherEl = document.querySelector('.m-node[data-node="' + otherKey + '"]');
          if (!otherEl) return;
          var otherPos = nodePosition(otherEl);
          var path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path2.setAttribute("d", "M" + pos.x + "," + pos.y + " L" + otherPos.x + "," + otherPos.y);
          path2.dataset.pair = key + "|" + otherKey;
          systemLines.appendChild(path2);
          primeLineForDraw(path2);
        });
      }
    });
  }

  function refreshSystemReveal(progress) {
    if (!systemStage || !systemLines) return;
    var stepCount = systemRevealOrder.length + 1;
    var activeSteps = Math.min(stepCount, Math.floor(progress * stepCount) + (progress > 0 ? 1 : 0));

    systemRevealOrder.forEach(function (key, i) {
      var el = key === "center" ? systemCenter : document.querySelector('.m-node[data-node="' + key + '"]');
      if (el) el.classList.toggle("is-revealed", i < activeSteps);
    });

    systemLines.querySelectorAll("path").forEach(function (p) {
      var pair = p.dataset.pair.split("|");
      var revealed;
      if (pair[1] === "center") {
        revealed = systemRevealOrder.indexOf(pair[0]) < activeSteps;
      } else {
        revealed = activeSteps >= stepCount;
      }
      var len = p.dataset.length;
      if (revealed) {
        p.style.strokeDashoffset = 0;
        p.classList.add("is-drawn");
      } else {
        p.style.strokeDashoffset = len;
        p.classList.remove("is-drawn");
      }
    });
  }

  function onSystemScroll() {
    if (!systemStage || window.innerWidth <= 860) return;
    var rect = systemStage.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = vh + rect.height * 0.5;
    var progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
    refreshSystemReveal(progress);
  }

  function activateSystemNode(key) {
    systemNodes.forEach(function (n) { n.classList.toggle("is-lit", n.dataset.node === key); });
    var rel = systemRelations[key];
    if (rel) {
      rel.connects.forEach(function (otherKey) {
        var otherEl = document.querySelector('.m-node[data-node="' + otherKey + '"]');
        if (otherEl) otherEl.classList.add("is-lit");
      });
      if (systemCopy) systemCopy.textContent = rel.copy;
    }
    systemLines.querySelectorAll("path").forEach(function (p) {
      var pair = p.dataset.pair.split("|");
      var active = pair.indexOf(key) !== -1 && (pair[1] === "center" || (rel && rel.connects.indexOf(pair[0] === key ? pair[1] : pair[0]) !== -1));
      p.classList.toggle("is-active", active);
    });
  }

  function resetSystem() {
    systemNodes.forEach(function (n) { n.classList.remove("is-lit"); });
    systemLines.querySelectorAll("path").forEach(function (p) { p.classList.remove("is-active"); });
    if (systemCopy) systemCopy.textContent = "Hover a node to see the relationships RÊNAS evaluates around it.";
  }

  if (systemStage && systemNodes.length) {
    drawSystemLines();
    window.addEventListener("resize", function () {
      drawSystemLines();
      onSystemScroll();
    });
    systemNodes.forEach(function (n) {
      n.addEventListener("mouseenter", function () { activateSystemNode(n.dataset.node); });
      n.addEventListener("focus", function () { activateSystemNode(n.dataset.node); });
      n.addEventListener("mouseleave", resetSystem);
      n.addEventListener("blur", resetSystem);
    });
    if (reduceMotion) {
      refreshSystemReveal(1);
    } else {
      window.addEventListener("scroll", onSystemScroll, { passive: true });
      onSystemScroll();
    }
  }

  /* ---------------- 04 Component Index ---------------- */
  var indexItems = document.querySelectorAll(".m-index__item");
  var indexImages = document.querySelectorAll(".m-index__image");
  var idxMetaCat = document.getElementById("idxMetaCat");
  var idxMetaSys = document.getElementById("idxMetaSys");
  var idxSystems = {
    filters: "FILTRATION",
    engine: "ENGINE",
    brake: "BRAKE",
    suspension: "SUSPENSION",
    electrical: "ELECTRICAL",
    consumables: "CONSUMABLES"
  };
  function setIndexCat(cat, num) {
    indexItems.forEach(function (i) { i.classList.toggle("is-active", i.dataset.cat === cat); i.setAttribute("aria-selected", i.dataset.cat === cat ? "true" : "false"); });
    indexImages.forEach(function (i) { i.classList.toggle("is-active", i.dataset.cat === cat); });
    if (idxMetaCat) idxMetaCat.textContent = "CATEGORY / " + num;
    if (idxMetaSys) idxMetaSys.textContent = "SYSTEM / " + idxSystems[cat];
  }
  indexItems.forEach(function (item, i) {
    var num = item.querySelector(".num-index").textContent;
    var trigger = isTouch ? "click" : "mouseenter";
    item.addEventListener(trigger, function () { setIndexCat(item.dataset.cat, num); });
    item.addEventListener("focus", function () { setIndexCat(item.dataset.cat, num); });
  });

  var indexLeft = document.querySelector(".m-index__left");
  var indexStage = document.getElementById("indexStage");
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
  window.addEventListener("resize", matchIndexStageHeight);
  matchIndexStageHeight();

  /* ---------------- 05 Decision Layer ---------------- */
  var decisionFactors = document.querySelectorAll(".m-decision__factor");
  var decisionBigword = document.getElementById("decisionBigword");
  if (decisionFactors.length && decisionBigword) {
    var decisionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) decisionBigword.textContent = entry.target.dataset.word;
      });
    }, { threshold: 0.55 });
    decisionFactors.forEach(function (f) { decisionObserver.observe(f); });
  }

  /* ---------------- 06 Route Stories (vertical scroll drives horizontal) ---------------- */
  var routesTrack = document.getElementById("routesTrack");
  var routesRail = document.getElementById("routesRail");
  var routeCards = document.querySelectorAll(".m-route");

  function onRoutesScroll() {
    if (!routesTrack || !routesRail || window.innerWidth <= 860) return;
    var rect = routesTrack.getBoundingClientRect();
    var total = routesTrack.offsetHeight - window.innerHeight;
    var progress = Math.min(1, Math.max(0, -rect.top / total));
    var maxShift = routesRail.scrollWidth - window.innerWidth;
    routesRail.style.transform = "translateX(-" + (progress * maxShift) + "px)";

    routeCards.forEach(function (card) {
      var cardRect = card.getBoundingClientRect();
      var inView = cardRect.left < window.innerWidth * 0.6 && cardRect.right > window.innerWidth * 0.4;
      card.classList.toggle("is-active", inView);
    });
  }
  if (routesTrack && routesRail) {
    window.addEventListener("scroll", onRoutesScroll, { passive: true });
    window.addEventListener("resize", onRoutesScroll);
    onRoutesScroll();
  }

  /* ---------------- 07 Operational Signals ---------------- */
  var signals = document.querySelectorAll(".m-signal");
  var signalsExplain = document.getElementById("signalsExplain");
  var signalCopy = {
    specification: "A named part is not the same as a technically matched part.",
    leadtime: "Availability at origin is not the same as delivery at destination.",
    origin: "Where a product is made shapes cost, lead time and documentation.",
    moq: "Supplier requirements can significantly change sourcing feasibility.",
    documentation: "Execution depends on having the right documentation at the right point in the journey.",
    capability: "Capability determines whether a supplier can deliver, not just quote.",
    payment: "Payment terms shape which suppliers and routes are workable.",
    customs: "Customs requirements differ by route, product and destination.",
    transport: "The transport mode changes cost, risk and timing together.",
    destination: "The destination sets the constraints the entire route must satisfy.",
    availability: "Stated availability must be verified before a commitment is made.",
    commercial: "Commercial terms only hold if the rest of the system can support them."
  };
  if (signals.length && signalsExplain) {
    signals.forEach(function (s) {
      s.addEventListener("mouseenter", function () {
        signals.forEach(function (o) { o.classList.remove("is-active"); });
        s.classList.add("is-active");
        signalsExplain.textContent = signalCopy[s.dataset.signal] || "";
      });
    });
  }

  /* ---------------- 10 Requirement Composer ---------------- */
  var composerForm = document.getElementById("composerForm");
  if (composerForm) {
    var steps = Array.prototype.slice.call(composerForm.querySelectorAll(".m-composer__step"));
    var stepIndicators = Array.prototype.slice.call(document.querySelectorAll("#composerSteps span"));
    var backBtn = document.getElementById("composerBack");
    var nextBtn = document.getElementById("composerNext");
    var current = 0;

    var state = { product: "", partKnown: "", partNumber: "", quantity: "", unit: "", destination: "", timeline: "" };

    function renderStep() {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === current); });
      stepIndicators.forEach(function (s, i) {
        s.classList.toggle("is-active", i === current);
        s.classList.toggle("is-done", i < current);
      });
      backBtn.style.visibility = current === 0 ? "hidden" : "visible";
      var atSummary = current === steps.length - 1;
      nextBtn.style.display = atSummary ? "none" : "inline-flex";
      if (atSummary) updateSummary();
    }

    function updateSummary() {
      var out = composerForm.querySelector("#composerSummary");
      out.querySelector('[data-out="product"]').textContent = state.product || "—";
      out.querySelector('[data-out="partNumber"]').textContent = state.partKnown === "YES" ? (state.partNumber || "—") : (state.partKnown || "—");
      out.querySelector('[data-out="quantity"]').textContent = state.quantity ? (state.quantity + " " + (state.unit || "units")) : "—";
      out.querySelector('[data-out="destination"]').textContent = state.destination || "—";
      out.querySelector('[data-out="timeline"]').textContent = state.timeline || "—";
    }

    composerForm.querySelectorAll(".m-choice").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest(".m-composer__choices");
        var field = group.dataset.field;
        group.querySelectorAll(".m-choice").forEach(function (b) { b.classList.remove("is-selected"); });
        btn.classList.add("is-selected");
        state[field] = btn.dataset.value;
        if (field === "partKnown") {
          var partField = document.getElementById("partNumberField");
          partField.hidden = btn.dataset.value !== "YES";
        }
      });
    });

    document.getElementById("cProduct").addEventListener("input", function (e) { state.product = e.target.value; });
    document.getElementById("cPartNumber").addEventListener("input", function (e) { state.partNumber = e.target.value; });
    document.getElementById("cQty").addEventListener("input", function (e) { state.quantity = e.target.value; });
    document.getElementById("cUnit").addEventListener("input", function (e) { state.unit = e.target.value; });

    nextBtn.addEventListener("click", function () {
      if (current < steps.length - 1) { current++; renderStep(); }
    });
    backBtn.addEventListener("click", function () {
      if (current > 0) { current--; renderStep(); }
    });
    composerForm.addEventListener("submit", function (e) {
      e.preventDefault();
    });

    renderStep();
  }

  /* ---------------- Reveal-on-scroll for general elements ---------------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealables = document.querySelectorAll(".m-route, .m-principle__item, .m-eq-term");
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("is-in-view");
      });
    }, { threshold: 0.2 });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  }
})();
