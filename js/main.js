(function () {
  "use strict";

  var header = document.getElementById("siteHeader");
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");

  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  navToggle.addEventListener("click", function () {
    var isOpen = mobileNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  // Mini RFQ (Final CTA) — routes to the full request flow with prefilled params.
  var miniForm = document.getElementById("miniRfqForm");
  if (miniForm) {
    miniForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var params = new URLSearchParams();
      var product = document.getElementById("rfq-product").value.trim();
      var qty = document.getElementById("rfq-qty").value.trim();
      var dest = document.getElementById("rfq-dest").value.trim();
      if (product) params.set("product", product);
      if (qty) params.set("quantity", qty);
      if (dest) params.set("destination", dest);
      window.location.href = "/request-supply/?" + params.toString();
    });
  }

  // Scroll-reveal for major section headers (respects reduced motion).
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && "IntersectionObserver" in window) {
    var revealTargets = document.querySelectorAll(".section-head, .trust-cell, .si-area, .yr-step");
    revealTargets.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity 640ms cubic-bezier(0.4,0,0.2,1), transform 640ms cubic-bezier(0.4,0,0.2,1)";
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -60px 0px" });
    revealTargets.forEach(function (el) { observer.observe(el); });
  }
})();
