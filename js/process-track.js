(function () {
  "use strict";

  var track = document.getElementById("processTrack");
  if (!track) return;

  var stages = Array.prototype.slice.call(track.querySelectorAll(".stage"));
  var progress = document.getElementById("processProgress");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var autoTimer = null;
  var activeIndex = 0;

  function setActive(index) {
    activeIndex = index;
    stages.forEach(function (stage, i) {
      var isActive = i === index;
      stage.classList.toggle("is-active", isActive);
      stage.setAttribute("aria-selected", String(isActive));
    });
    var pct = (index / (stages.length - 1)) * 100;
    progress.style.width = pct + "%";
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function startAuto() {
    if (prefersReduced) return;
    stopAuto();
    autoTimer = setInterval(function () {
      setActive((activeIndex + 1) % stages.length);
    }, 3200);
  }

  stages.forEach(function (stage, i) {
    stage.addEventListener("click", function () {
      stopAuto();
      setActive(i);
    });
    stage.addEventListener("mouseenter", function () {
      stopAuto();
      setActive(i);
    });
  });

  track.addEventListener("mouseleave", function () {
    startAuto();
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          startAuto();
        } else {
          stopAuto();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(track);
  } else {
    startAuto();
  }

  setActive(0);
})();
