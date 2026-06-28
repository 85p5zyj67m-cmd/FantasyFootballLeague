const REPLAY_DURATION_MS = 34000;
const SCORE_PATTERN = /^(.*)\s+(\d+)\s+-\s+(\d+)\s+(.*)$/;
const FIRST_HALF_ADDED = 2;
const SECOND_HALF_ADDED = 4;

window.addEventListener("DOMContentLoaded", () => {
  const target = document.getElementById("liveMatchCard");

  if (!target) return;

  const observer = new MutationObserver(() => enhanceLatestMatch(target));
  observer.observe(target, { childList: true, subtree: true });
  enhanceLatestMatch(target);
});

function enhanceLatestMatch(target) {
  const card = target.querySelector(".live-match-card");

  if (!card || card.dataset.replayReady === "true") return;

  const title = card.querySelector("h2");
  const eventsBox = card.querySelector(".live-events");
  const originalEvents = eventsBox ? Array.from(eventsBox.children) : [];

  if (!title || !eventsBox || originalEvents.length < 2) return;

  const parsedScore = parseScoreTitle(title.textContent);

  if (!parsedScore) return;

  card.dataset.replayReady = "true";
  card.classList.add("live-replay-card");

  const replayEvents = originalEvents
    .map(row => normalizeReplayEvent(row, parsedScore))
    .filter(Boolean)
    .sort((a, b) => a.replayMinute - b.replayMinute || eventPriority(a.type) - eventPriority(b.type));

  const timelineEnd = getTimelineEnd(replayEvents);
  const replayState = {
    homeName: parsedScore.homeName,
    awayName: parsedScore.awayName,
    finalHomeGoals: parsedScore.homeGoals,
    finalAwayGoals: parsedScore.awayGoals,
    homeGoals: 0,
    awayGoals: 0,
    homeXg: 0,
    awayXg: 0,
    currentReplayMinute: 0,
    timelineEnd,
    momentumSeries: buildMomentumSeries(replayEvents, timelineEnd),
    visibleMomentumSeries: []
  };

  const header = createReplayHeader(replayState);
  const graph = createMomentumGraph(replayState);
  const controls = createReplayControls();

  eventsBox.replaceChildren();
  card.insertBefore(header.wrapper, title.nextSibling);
  card.insertBefore(graph.wrapper, eventsBox);
  card.insertBefore(controls, eventsBox);

  title.textContent = `${replayState.homeName} 0 - 0 ${replayState.awayName}`;

  runReplay({
    title,
    eventsBox,
    replayEvents,
    replayState,
    header,
    graph,
    controls
  });
}

function runReplay({ title, eventsBox, replayEvents, replayState, header, graph, controls }) {
  let currentEventIndex = 0;
  const start = performance.now();
  const playBtn = controls.querySelector("button");

  const tick = () => {
    const elapsed = performance.now() - start;
    const progress = Math.min(1, elapsed / REPLAY_DURATION_MS);
    const currentReplayMinute = progress * replayState.timelineEnd;

    replayState.currentReplayMinute = currentReplayMinute;
    header.clock.textContent = formatMatchClock(currentReplayMinute, replayState.timelineEnd);
    header.progress.style.width = `${progress * 100}%`;

    while (
      currentEventIndex < replayEvents.length &&
      replayEvents[currentEventIndex].replayMinute <= currentReplayMinute
    ) {
      revealEvent(replayEvents[currentEventIndex], eventsBox, replayState);
      currentEventIndex++;
    }

    replayState.visibleMomentumSeries = getVisibleInterpolatedMomentum(replayState, currentReplayMinute);

    updateScoreTitle(title, replayState);
    updatePressureLabel(header.pressure, replayState, getCurrentMomentum(replayState));
    renderMomentumGraph(graph, replayState);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    replayState.homeGoals = replayState.finalHomeGoals;
    replayState.awayGoals = replayState.finalAwayGoals;
    replayState.visibleMomentumSeries = replayState.momentumSeries;
    updateScoreTitle(title, replayState);
    renderMomentumGraph(graph, replayState);
    header.clock.textContent = getFinalClockLabel(replayState.timelineEnd);
    playBtn.textContent = "Replay complete";
    playBtn.disabled = true;
  };

  playBtn.addEventListener("click", () => {
    window.location.reload();
  });

  requestAnimationFrame(tick);
}

function revealEvent(event, eventsBox, replayState) {
  updateReplayStats(event, replayState);

  const row = document.createElement("div");
  row.className = `live-event ${event.type.toLowerCase()} replay-event-enter`;
  row.textContent = event.text;
  eventsBox.prepend(row);
}

function normalizeReplayEvent(row, teams) {
  const text = row.textContent;
  const minute = getEventMinute(text);
  const type = getEventType(row);

  if (!minute) return null;

  return {
    minute,
    replayMinute: getReplayMinute(minute, type, text),
    text,
    type,
    side: getEventSideFromText(text, teams.homeName, teams.awayName)
  };
}

function getReplayMinute(minute, type, text) {
  const lower = text.toLowerCase();

  if (minute === 45 && lower.includes("half-time")) {
    return 45 + FIRST_HALF_ADDED;
  }

  if (minute === 90 && lower.includes("full-time")) {
    return 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED;
  }

  if (minute <= 45) {
    return minute;
  }

  if (minute <= 90) {
    return 45 + FIRST_HALF_ADDED + (minute - 45);
  }

  return 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED + (minute - 90);
}

function getTimelineEnd(events) {
  const regulationEnd = 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED;
  const maxReplayMinute = Math.max(regulationEnd, ...events.map(event => event.replayMinute));

  if (maxReplayMinute > regulationEnd) {
    return Math.max(maxReplayMinute, regulationEnd + 30);
  }

  return regulationEnd;
}

function formatMatchClock(replayMinute, timelineEnd) {
  const rounded = Math.floor(replayMinute);
  const secondHalfStart = 45 + FIRST_HALF_ADDED;
  const regulationEnd = secondHalfStart + 45;
  const finalEnd = regulationEnd + SECOND_HALF_ADDED;

  if (rounded <= 45) {
    return `${rounded}'`;
  }

  if (rounded <= secondHalfStart) {
    return `45+${rounded - 45}'`;
  }

  if (rounded <= regulationEnd) {
    return `${45 + (rounded - secondHalfStart)}'`;
  }

  if (rounded <= finalEnd) {
    return `90+${rounded - regulationEnd}'`;
  }

  const extraTimeMinute = 90 + (rounded - finalEnd);
  return `${Math.min(extraTimeMinute, 120)}'`;
}

function getFinalClockLabel(timelineEnd) {
  const regulationEnd = 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED;
  return timelineEnd > regulationEnd ? "120'" : `90+${SECOND_HALF_ADDED}'`;
}

function updateReplayStats(event, replayState) {
  const xgValue = getApproxXg(event.text, event.type);

  if (event.type === "GOAL") {
    if (event.side === "home") replayState.homeGoals++;
    if (event.side === "away") replayState.awayGoals++;
  }

  if (event.side === "home") replayState.homeXg += xgValue;
  if (event.side === "away") replayState.awayXg += xgValue;
}

function buildMomentumSeries(events, timelineEnd) {
  const points = [];
  let momentum = 0;
  const eventsByMinute = new Map();

  events.forEach(event => {
    const key = Math.floor(event.replayMinute);
    const bucket = eventsByMinute.get(key) || [];
    bucket.push(event);
    eventsByMinute.set(key, bucket);
  });

  for (let minute = 0; minute <= timelineEnd; minute++) {
    const minuteEvents = eventsByMinute.get(minute) || [];

    momentum *= 0.92;

    minuteEvents.forEach(event => {
      const impact = getEventImpact(event);

      if (event.side === "home") momentum += impact;
      if (event.side === "away") momentum -= impact;
      if (event.type === "INFO") momentum *= 0.78;
    });

    momentum += getAmbientPulse(minute) * 0.035;
    momentum = clamp(-1.35, 1.35, momentum);

    points.push({
      minute,
      value: Number(momentum.toFixed(3))
    });
  }

  return smoothSeries(smoothSeries(points));
}

function getVisibleInterpolatedMomentum(state, currentReplayMinute) {
  const visible = state.momentumSeries.filter(point => point.minute <= currentReplayMinute);
  const nextPoint = state.momentumSeries.find(point => point.minute > currentReplayMinute);

  if (!visible.length) {
    return [{ minute: 0, value: 0 }];
  }

  if (nextPoint) {
    const previousPoint = visible[visible.length - 1];
    const span = Math.max(1, nextPoint.minute - previousPoint.minute);
    const ratio = (currentReplayMinute - previousPoint.minute) / span;
    const interpolatedValue = previousPoint.value + (nextPoint.value - previousPoint.value) * ratio;

    return [
      ...visible,
      {
        minute: currentReplayMinute,
        value: Number(interpolatedValue.toFixed(3))
      }
    ];
  }

  return visible;
}

function getEventSideFromText(text, homeName, awayName) {
  const lower = text.toLowerCase();
  const homeKey = homeName.toLowerCase();
  const awayKey = awayName.toLowerCase();

  if (lower.includes(homeKey)) return "home";
  if (lower.includes(awayKey)) return "away";
  return null;
}

function getEventImpact(event) {
  if (!event.side) return 0;
  if (event.type === "GOAL") return 0.92;
  if (event.text.includes("Huge chance")) return 0.68;
  if (event.text.includes("sharp save")) return 0.46;
  if (event.text.includes("half chance")) return 0.24;
  if (event.type === "SAVE") return 0.38;
  if (event.type === "CHANCE") return 0.28;
  return 0;
}

function getApproxXg(text, type) {
  if (type === "GOAL") return 0.36;
  if (text.includes("Huge chance")) return 0.34;
  if (text.includes("sharp save")) return 0.22;
  if (text.includes("half chance")) return 0.09;
  if (type === "SAVE") return 0.18;
  if (type === "CHANCE") return 0.12;
  return 0;
}

function getAmbientPulse(minute) {
  return Math.sin(minute / 4.2) + Math.sin(minute / 9.5) * 0.55;
}

function smoothSeries(points) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)].value;
    const current = point.value;
    const next = points[Math.min(points.length - 1, index + 1)].value;

    return {
      minute: point.minute,
      value: Number(((previous + current * 2 + next) / 4).toFixed(3))
    };
  });
}

function createReplayHeader() {
  const wrapper = document.createElement("div");
  wrapper.className = "replay-header";

  const clock = document.createElement("div");
  clock.className = "replay-clock";
  clock.textContent = "0'";

  const pressure = document.createElement("div");
  pressure.className = "replay-pressure neutral-pressure";
  pressure.textContent = "Balanced start";

  const bar = document.createElement("div");
  bar.className = "replay-progress-bar";

  const progress = document.createElement("div");
  progress.className = "replay-progress-fill";
  bar.appendChild(progress);

  wrapper.append(clock, pressure, bar);

  return { wrapper, clock, pressure, progress };
}

function createReplayControls() {
  const controls = document.createElement("div");
  controls.className = "replay-controls";

  const note = document.createElement("span");
  note.textContent = "Live replay running";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Restart replay";

  controls.append(note, button);
  return controls;
}

function createMomentumGraph(state) {
  const wrapper = document.createElement("div");
  wrapper.className = "xg-graph-card momentum-graph-card";

  const header = document.createElement("div");
  header.className = "xg-graph-header";

  const title = document.createElement("strong");
  title.textContent = "Momentum";

  const score = document.createElement("span");
  score.className = "xg-score";
  score.textContent = `${state.homeName} ↑ · ${state.awayName} ↓`;

  header.append(title, score);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 320 150");
  svg.classList.add("xg-graph", "momentum-graph");

  const grid = document.createElementNS("http://www.w3.org/2000/svg", "path");
  grid.setAttribute("d", "M0 25 H320 M0 75 H320 M0 125 H320");
  grid.classList.add("xg-grid");

  const axis = document.createElementNS("http://www.w3.org/2000/svg", "path");
  axis.setAttribute("d", "M0 75 H320");
  axis.classList.add("momentum-zero-axis");

  const positiveArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
  positiveArea.classList.add("momentum-area", "positive-momentum-area");

  const negativeArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
  negativeArea.classList.add("momentum-area", "negative-momentum-area");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.classList.add("xg-line", "momentum-line", "neutral-momentum-line");

  const minuteMarker = document.createElementNS("http://www.w3.org/2000/svg", "line");
  minuteMarker.classList.add("momentum-minute-marker");
  minuteMarker.setAttribute("y1", "18");
  minuteMarker.setAttribute("y2", "132");

  const topLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  topLabel.setAttribute("x", "8");
  topLabel.setAttribute("y", "18");
  topLabel.classList.add("momentum-label", "home-momentum-label");
  topLabel.textContent = state.homeName;

  const bottomLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  bottomLabel.setAttribute("x", "8");
  bottomLabel.setAttribute("y", "142");
  bottomLabel.classList.add("momentum-label", "away-momentum-label");
  bottomLabel.textContent = state.awayName;

  svg.append(grid, positiveArea, negativeArea, axis, line, minuteMarker, topLabel, bottomLabel);
  wrapper.append(header, svg);

  const graph = { wrapper, score, line, positiveArea, negativeArea, minuteMarker };
  renderMomentumGraph(graph, state);
  return graph;
}

function renderMomentumGraph(graph, state) {
  const series = state.visibleMomentumSeries.length
    ? state.visibleMomentumSeries
    : [{ minute: 0, value: 0 }];

  const width = 320;
  const centerY = 75;
  const scale = 44;
  const maxMinute = Math.max(1, state.timelineEnd);

  const toX = minute => (minute / maxMinute) * width;
  const toY = value => centerY - value * scale;

  const linePoints = series
    .map(point => `${toX(point.minute).toFixed(1)},${toY(point.value).toFixed(1)}`)
    .join(" ");

  graph.line.setAttribute("points", linePoints);

  graph.positiveArea.setAttribute("d", buildAreaPath(series, toX, toY, centerY, value => value > 0));
  graph.negativeArea.setAttribute("d", buildAreaPath(series, toX, toY, centerY, value => value < 0));

  const markerX = toX(Math.min(state.currentReplayMinute, state.timelineEnd));
  graph.minuteMarker.setAttribute("x1", markerX.toFixed(1));
  graph.minuteMarker.setAttribute("x2", markerX.toFixed(1));

  const currentMomentum = getCurrentMomentum(state);
  graph.line.classList.toggle("home-momentum-line", currentMomentum > 0.12);
  graph.line.classList.toggle("away-momentum-line", currentMomentum < -0.12);
  graph.line.classList.toggle("neutral-momentum-line", Math.abs(currentMomentum) <= 0.12);

  graph.score.textContent = `${state.homeName} ${state.homeXg.toFixed(1)} xG · ${state.awayXg.toFixed(1)} xG ${state.awayName}`;
}

function buildAreaPath(series, toX, toY, centerY, predicate) {
  const segments = [];
  let current = [];

  series.forEach(point => {
    if (predicate(point.value)) {
      current.push(point);
      return;
    }

    if (current.length) {
      segments.push(current);
      current = [];
    }
  });

  if (current.length) segments.push(current);

  return segments.map(segment => {
    const start = segment[0];
    const end = segment[segment.length - 1];
    const line = segment
      .map(point => `L ${toX(point.minute).toFixed(1)} ${toY(point.value).toFixed(1)}`)
      .join(" ");

    return `M ${toX(start.minute).toFixed(1)} ${centerY} ${line} L ${toX(end.minute).toFixed(1)} ${centerY} Z`;
  }).join(" ");
}

function updateScoreTitle(title, state) {
  title.textContent = `${state.homeName} ${state.homeGoals} - ${state.awayGoals} ${state.awayName}`;
}

function updatePressureLabel(label, state, momentum) {
  label.classList.remove("home-pressure", "away-pressure", "neutral-pressure");

  if (Math.abs(momentum) < 0.15) {
    label.textContent = "Balanced game";
    label.classList.add("neutral-pressure");
    return;
  }

  const teamName = momentum > 0 ? state.homeName : state.awayName;
  const intensity = Math.abs(momentum) > 0.7 ? "dominating" : "pushing";
  label.textContent = `${teamName} ${intensity}`;
  label.classList.add(momentum > 0 ? "home-pressure" : "away-pressure");
}

function getCurrentMomentum(state) {
  const series = state.visibleMomentumSeries;
  return series.length ? series[series.length - 1].value : 0;
}

function parseScoreTitle(text) {
  const match = text.match(SCORE_PATTERN);

  if (!match) return null;

  return {
    homeName: match[1].trim(),
    homeGoals: Number(match[2]),
    awayGoals: Number(match[3]),
    awayName: match[4].trim()
  };
}

function getEventMinute(text) {
  const match = text.match(/^(\d+)'/);
  return match ? Number(match[1]) : 1;
}

function getEventType(row) {
  if (row.classList.contains("goal")) return "GOAL";
  if (row.classList.contains("chance")) return "CHANCE";
  if (row.classList.contains("save")) return "SAVE";
  return "INFO";
}

function eventPriority(type) {
  if (type === "GOAL") return 0;
  if (type === "CHANCE") return 1;
  if (type === "SAVE") return 2;
  return 3;
}

function clamp(min, max, value) {
  return Math.min(max, Math.max(min, value));
}
