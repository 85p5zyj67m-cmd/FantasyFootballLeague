window.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => enhanceMomentumGraphs());
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["points"] });
  enhanceMomentumGraphs();
});

function enhanceMomentumGraphs() {
  document.querySelectorAll(".momentum-graph").forEach(svg => {
    const sourceLine = svg.querySelector(".momentum-line");
    if (!sourceLine) return;

    ensureDefs(svg);
    ensureMinuteScale(svg);
    ensureEventMarkers(svg);
    drawCurvedSegmentLines(svg, sourceLine);
  });
}

function ensureDefs(svg) {
  if (svg.querySelector("#momentumGlow")) return;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  filter.setAttribute("id", "momentumGlow");
  filter.setAttribute("x", "-30%");
  filter.setAttribute("y", "-30%");
  filter.setAttribute("width", "160%");
  filter.setAttribute("height", "160%");

  const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
  blur.setAttribute("stdDeviation", "3");
  blur.setAttribute("result", "coloredBlur");

  const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
  const mergeBlur = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  mergeBlur.setAttribute("in", "coloredBlur");
  const mergeSource = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  mergeSource.setAttribute("in", "SourceGraphic");

  merge.append(mergeBlur, mergeSource);
  filter.append(blur, merge);
  defs.appendChild(filter);
  svg.insertBefore(defs, svg.firstChild);
}

function ensureMinuteScale(svg) {
  if (svg.querySelector(".momentum-minute-scale")) return;

  const scale = document.createElementNS("http://www.w3.org/2000/svg", "g");
  scale.classList.add("momentum-minute-scale");

  [0, 45, 90].forEach((minute, index) => {
    const x = index === 0 ? 0 : index === 1 ? 160 : 306;

    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", String(x));
    tick.setAttribute("x2", String(x));
    tick.setAttribute("y1", "130");
    tick.setAttribute("y2", "136");
    tick.classList.add("momentum-scale-tick");

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(x));
    label.setAttribute("y", "146");
    label.classList.add("momentum-scale-label");
    label.textContent = `${minute}'`;

    scale.append(tick, label);
  });

  svg.appendChild(scale);
}

function ensureEventMarkers(svg) {
  if (svg.querySelector(".momentum-event-markers")) return;

  const markerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  markerGroup.classList.add("momentum-event-markers");
  svg.appendChild(markerGroup);
}

function drawCurvedSegmentLines(svg, sourceLine) {
  sourceLine.classList.add("segmented-source-line");

  let homeLine = svg.querySelector(".curved-home-momentum-line");
  let awayLine = svg.querySelector(".curved-away-momentum-line");

  if (!homeLine) {
    homeLine = createPath("curved-home-momentum-line");
    svg.insertBefore(homeLine, sourceLine.nextSibling);
  }

  if (!awayLine) {
    awayLine = createPath("curved-away-momentum-line");
    svg.insertBefore(awayLine, homeLine.nextSibling);
  }

  const points = parsePoints(sourceLine.getAttribute("points") || "");
  const segments = splitSegmentsByZero(points, 75);

  homeLine.setAttribute("d", buildSmoothPath(segments.home));
  awayLine.setAttribute("d", buildSmoothPath(segments.away));
  updateEventMarkers(svg, points);
}

function createPath(className) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.classList.add("pro-momentum-line", className);
  path.setAttribute("filter", "url(#momentumGlow)");
  return path;
}

function parsePoints(pointsText) {
  return pointsText
    .trim()
    .split(/\s+/)
    .map(pair => {
      const [x, y] = pair.split(",").map(Number);
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    })
    .filter(Boolean);
}

function splitSegmentsByZero(points, zeroY) {
  const home = [];
  const away = [];

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const aSide = getSide(a.y, zeroY);
    const bSide = getSide(b.y, zeroY);

    if (aSide === bSide) {
      pushToSide(aSide, a, b, home, away);
      continue;
    }

    const crossing = interpolateCrossing(a, b, zeroY);
    pushToSide(aSide, a, crossing, home, away);
    pushToSide(bSide, crossing, b, home, away);
  }

  return { home, away };
}

function getSide(y, zeroY) {
  return y <= zeroY ? "home" : "away";
}

function pushToSide(side, a, b, home, away) {
  const target = side === "home" ? home : away;
  const previous = target[target.length - 1];

  if (previous && close(previous[previous.length - 1], a)) {
    previous.push(b);
    return;
  }

  target.push([a, b]);
}

function close(a, b) {
  return Math.abs(a.x - b.x) < 0.2 && Math.abs(a.y - b.y) < 0.2;
}

function interpolateCrossing(a, b, zeroY) {
  const denominator = b.y - a.y;
  const ratio = denominator === 0 ? 0 : (zeroY - a.y) / denominator;
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: zeroY
  };
}

function buildSmoothPath(segments) {
  return segments.map(segment => smoothSegment(segment)).join(" ");
}

function smoothSegment(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];
    const midX = (previous.x + current.x) / 2;
    const midY = (previous.y + current.y) / 2;
    d += ` Q ${previous.x.toFixed(1)} ${previous.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  d += ` T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

function updateEventMarkers(svg, points) {
  const group = svg.querySelector(".momentum-event-markers");
  if (!group || !points.length) return;

  const existingCount = group.children.length;
  const targetCount = Math.min(5, Math.max(0, Math.floor(points.length / 24)));
  if (existingCount >= targetCount) return;

  for (let i = existingCount; i < targetCount; i++) {
    const point = points[Math.min(points.length - 1, Math.max(0, Math.floor((i + 1) * points.length / (targetCount + 1))))];
    const marker = createEventMarker(point, i);
    group.appendChild(marker);
  }
}

function createEventMarker(point, index) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.classList.add("momentum-event-marker");

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", point.x.toFixed(1));
  circle.setAttribute("cy", point.y.toFixed(1));
  circle.setAttribute("r", index % 3 === 0 ? "5" : "3.8");
  circle.classList.add(index % 3 === 0 ? "goal-marker" : "chance-marker");

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", point.x.toFixed(1));
  label.setAttribute("y", (point.y - 8).toFixed(1));
  label.classList.add("momentum-marker-label");
  label.textContent = index % 3 === 0 ? "⚽" : "•";

  group.append(circle, label);
  return group;
}
