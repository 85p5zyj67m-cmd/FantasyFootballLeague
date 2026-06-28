window.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(polishMomentumGraphs);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["points"] });
  polishMomentumGraphs();
});

function polishMomentumGraphs() {
  document.querySelectorAll(".momentum-graph").forEach(svg => {
    const line = svg.querySelector(".momentum-line");
    if (!line) return;

    line.classList.add("polish-source-line");
    addMinuteScale(svg);
    addMarkers(svg, line);
    addCurvedLines(svg, line);
  });
}

function addMinuteScale(svg) {
  if (svg.querySelector(".polish-scale")) return;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.classList.add("polish-scale");

  [{ x: 0, text: "0'" }, { x: 160, text: "45'" }, { x: 306, text: "90'" }].forEach(item => {
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", item.x);
    tick.setAttribute("x2", item.x);
    tick.setAttribute("y1", "130");
    tick.setAttribute("y2", "136");
    tick.classList.add("polish-scale-tick");

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", item.x);
    label.setAttribute("y", "146");
    label.classList.add("polish-scale-label");
    label.textContent = item.text;

    group.append(tick, label);
  });

  svg.appendChild(group);
}

function addCurvedLines(svg, sourceLine) {
  let home = svg.querySelector(".polish-home-line");
  let away = svg.querySelector(".polish-away-line");

  if (!home) {
    home = createPath("polish-home-line");
    svg.insertBefore(home, sourceLine.nextSibling);
  }

  if (!away) {
    away = createPath("polish-away-line");
    svg.insertBefore(away, home.nextSibling);
  }

  const points = parsePoints(sourceLine.getAttribute("points") || "");
  const split = splitByZero(points, 75);
  home.setAttribute("d", buildSmoothPath(split.home));
  away.setAttribute("d", buildSmoothPath(split.away));
}

function createPath(className) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.classList.add("polish-line", className);
  return path;
}

function addMarkers(svg, sourceLine) {
  let group = svg.querySelector(".polish-markers");
  if (!group) {
    group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("polish-markers");
    svg.appendChild(group);
  }

  const points = parsePoints(sourceLine.getAttribute("points") || "");
  const wanted = Math.min(4, Math.floor(points.length / 28));
  if (points.length < 20 || group.children.length >= wanted) return;

  group.replaceChildren();

  for (let i = 0; i < wanted; i++) {
    const point = points[Math.floor((i + 1) * points.length / (wanted + 1))];
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x.toFixed(1));
    circle.setAttribute("cy", point.y.toFixed(1));
    circle.setAttribute("r", i % 2 === 0 ? "5" : "3.5");
    circle.classList.add(i % 2 === 0 ? "polish-goal-marker" : "polish-chance-marker");
    group.appendChild(circle);
  }
}

function parsePoints(text) {
  return text.trim().split(/\s+/).map(pair => {
    const values = pair.split(",").map(Number);
    return Number.isFinite(values[0]) && Number.isFinite(values[1]) ? { x: values[0], y: values[1] } : null;
  }).filter(Boolean);
}

function splitByZero(points, zeroY) {
  const home = [];
  const away = [];

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const sideA = a.y <= zeroY ? "home" : "away";
    const sideB = b.y <= zeroY ? "home" : "away";

    if (sideA === sideB) {
      pushSegment(sideA === "home" ? home : away, a, b);
      continue;
    }

    const crossing = getCrossing(a, b, zeroY);
    pushSegment(sideA === "home" ? home : away, a, crossing);
    pushSegment(sideB === "home" ? home : away, crossing, b);
  }

  return { home, away };
}

function pushSegment(target, a, b) {
  const last = target[target.length - 1];
  if (last && Math.abs(last[last.length - 1].x - a.x) < 0.2 && Math.abs(last[last.length - 1].y - a.y) < 0.2) {
    last.push(b);
    return;
  }
  target.push([a, b]);
}

function getCrossing(a, b, zeroY) {
  const ratio = (zeroY - a.y) / (b.y - a.y || 1);
  return { x: a.x + (b.x - a.x) * ratio, y: zeroY };
}

function buildSmoothPath(segments) {
  return segments.map(points => {
    if (!points.length) return "";
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
    }
    const last = points[points.length - 1];
    return `${d} T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  }).join(" ");
}
