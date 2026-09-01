(function () {
  "use strict";

  var mount = document.getElementById("corridorMap");
  if (!mount) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var W = 1200, H = 480;

  var origins = [
    { key: "china", label: "CHINA", coord: "31.2304° N / 121.4737° E", x: 180, y: 70 },
    { key: "uae", label: "UAE", coord: "25.2048° N / 55.2708° E", x: 480, y: 70 },
    { key: "turkey", label: "TURKEY", coord: "39.9334° N / 32.8597° E", x: 780, y: 70 }
  ];
  var transit = { key: "iran", label: "IRAN", sub: "TRANSIT", coord: "35.6892° N / 51.3890° E", x: 480, y: 260 };
  var destination = { key: "kurdistan", label: "KURDISTAN REGION, IRAQ", sub: "DESTINATION", coord: "36.1911° N / 44.0092° E", x: 480, y: 420 };

  function el(tag, attrs) {
    var node = document.createElementNS(svgNS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  var svg = el("svg", {
    viewBox: "0 0 " + W + " " + H,
    xmlns: svgNS,
    "aria-hidden": "true",
    focusable: "false"
  });

  var routesGroup = el("g", { class: "corridor-routes" });
  var routeEls = [];

  origins.forEach(function (o) {
    var path = el("path", {
      d: "M " + o.x + " " + (o.y + 14) + " C " + o.x + " " + ((o.y + transit.y) / 2) + ", " + transit.x + " " + ((o.y + transit.y) / 2) + ", " + transit.x + " " + (transit.y - 16),
      class: "corridor-route"
    });
    routesGroup.appendChild(path);
    routeEls.push(path);
  });

  var finalPath = el("path", {
    d: "M " + transit.x + " " + (transit.y + 16) + " L " + destination.x + " " + (destination.y - 16),
    class: "corridor-route"
  });
  routesGroup.appendChild(finalPath);
  routeEls.push(finalPath);

  svg.appendChild(routesGroup);

  function addNode(n, variant) {
    var g = el("g", { class: "corridor-node", transform: "translate(" + n.x + "," + n.y + ")" });
    var r = variant === "transit" || variant === "dest" ? 6 : 5;
    var dotColor = variant === "origin" ? "var(--muted)" : variant === "transit" ? "var(--gold)" : "var(--teal-light)";

    var circle = el("circle", { r: String(r), fill: dotColor });
    g.appendChild(circle);

    var ring = el("circle", { r: String(r + 6), fill: "none", stroke: dotColor, "stroke-opacity": "0.35" });
    g.appendChild(ring);

    var label = el("text", {
      y: variant === "origin" ? "-22" : "34",
      "text-anchor": "middle",
      fill: "var(--cream)",
      "font-size": "13",
      "font-weight": "500",
      "letter-spacing": "0.04em"
    });
    label.textContent = n.label;
    g.appendChild(label);

    if (n.sub) {
      var sub = el("text", {
        y: variant === "origin" ? "-38" : "50",
        "text-anchor": "middle",
        fill: "var(--gold)",
        "font-size": "10",
        "letter-spacing": "0.12em"
      });
      sub.textContent = n.sub;
      g.appendChild(sub);
    }

    var coord = el("text", {
      y: variant === "origin" ? (n.sub ? "-52" : "-38") : (n.sub ? "66" : "50"),
      "text-anchor": "middle",
      fill: "var(--muted)",
      "font-size": "10",
      "letter-spacing": "0.04em"
    });
    coord.textContent = n.coord;
    g.appendChild(coord);

    return g;
  }

  origins.forEach(function (o) { svg.appendChild(addNode(o, "origin")); });
  svg.appendChild(addNode(transit, "transit"));
  svg.appendChild(addNode(destination, "dest"));

  mount.appendChild(svg);

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function activateRoutes() {
    routeEls.forEach(function (path, i) {
      setTimeout(function () {
        path.classList.add("is-active");
      }, prefersReduced ? 0 : i * 220);
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activateRoutes();
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(mount);
  } else {
    activateRoutes();
  }
})();
