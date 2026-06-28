window.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => updateAllMomentumSegments());
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["points"] });
  updateAllMomentumSegments();
});

function updateAllMomentumSegments() {
  document.querySelectorAll(".momentum-graph").forEach(svg => {
    const sourceLine = svg.querySelector(".momentum-line");
    if (!sourceLine) return;

    sourceLine.classList.add("segmented-source-line");

    let homeLine = svg.querySelector(".segmented-home-line");
    let awayLine = svg.querySelector(".segmented-away-line");

    if (!homeLine) {
      homeLine = createSegmentLine("segmented-home-line");
      svg.insertBefore(homeLine, sourceLine.nextSibling);
    }

    if (!awayLine) {
      awayLine = createSegmentLine("segmented-away-line");
      svg.insertBefore(awayLine, homeLine.nextSibling);
    }

    const points = parsePoints(sourceLine.getAttribute("points") || "");
    const segments = splitSegmentsByZero(points, 75);

    homeLine.setAttribute("d", buildPath(segments.home));
    awayLine.setAttribute("d", buildPath(segments.away));
  });
}

function createSegmentLine(className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.classList.add("segmented-momentum-line", className);
  return line;
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
      pushSegment(aSide === "home" ? home : away, [a, b]);
      continue;
    }

    const crossing = interpolateCrossing(a, b, zeroY);

    if (aSide === "home") {
      pushSegment(home, [a, crossing]);
      pushSegment(away, [crossing, b]);
    } else {
      pushSegment(away, [a, crossing]);
      pushSegment(home, [crossing, b]);
    }
  }

  return { home, away };
}

function getSide(y, zeroY) {
  return y <= zeroY ? "home" : "away";
}

function interpolateCrossing(a, b, zeroY) {
  const denominator = b.y - a.y;
  const ratio = denominator === 0 ? 0 : (zeroY - a.y) / denominator;
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: zeroY
  };
}

function pushSegment(target, segment) {
  target.push(segment);
}

function buildPath(segments) {
  return segments.map(segment => {
    const [a, b] = segment;
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }).join(" ");
}
