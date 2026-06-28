const REPLAY_DURATION_MS = 36000;
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
  const rows = eventsBox ? Array.from(eventsBox.children) : [];
  if (!title || !eventsBox || rows.length < 2) return;

  const score = parseScoreTitle(title.textContent);
  if (!score) return;

  card.dataset.replayReady = "true";
  card.classList.add("live-replay-card");

  const replayEvents = rows
    .map(row => normalizeReplayEvent(row, score))
    .filter(Boolean)
    .sort((a, b) => a.replayMinute - b.replayMinute || eventPriority(a.type) - eventPriority(b.type));

  const timelineEnd = getTimelineEnd(replayEvents);
  const state = {
    homeName: score.homeName,
    awayName: score.awayName,
    finalHomeGoals: score.homeGoals,
    finalAwayGoals: score.awayGoals,
    homeGoals: 0,
    awayGoals: 0,
    homeXg: 0,
    awayXg: 0,
    currentReplayMinute: 0,
    timelineEnd,
    momentumSeries: window.FantasyMomentumEngine.build(replayEvents, timelineEnd, score.homeName, score.awayName),
    visibleMomentumSeries: []
  };

  const header = createReplayHeader();
  const graph = createMomentumGraph(state);
  const controls = createReplayControls();

  eventsBox.replaceChildren();
  card.insertBefore(header.wrapper, title.nextSibling);
  card.insertBefore(graph.wrapper, eventsBox);
  card.insertBefore(controls, eventsBox);
  title.textContent = `${state.homeName} 0 - 0 ${state.awayName}`;

  runReplay({ title, eventsBox, replayEvents, state, header, graph, controls });
}

function runReplay({ title, eventsBox, replayEvents, state, header, graph, controls }) {
  let eventIndex = 0;
  const start = performance.now();
  const button = controls.querySelector("button");

  function tick() {
    const progress = Math.min(1, (performance.now() - start) / REPLAY_DURATION_MS);
    const minute = progress * state.timelineEnd;
    state.currentReplayMinute = minute;
    header.clock.textContent = formatMatchClock(minute);
    header.progress.style.width = `${progress * 100}%`;

    while (eventIndex < replayEvents.length && replayEvents[eventIndex].replayMinute <= minute) {
      revealEvent(replayEvents[eventIndex], eventsBox, state);
      eventIndex++;
    }

    state.visibleMomentumSeries = getVisibleInterpolatedMomentum(state, minute);
    updateScoreTitle(title, state);
    updatePressureLabel(header.pressure, state, getCurrentMomentum(state));
    renderMomentumGraph(graph, state);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    state.homeGoals = state.finalHomeGoals;
    state.awayGoals = state.finalAwayGoals;
    state.visibleMomentumSeries = state.momentumSeries;
    updateScoreTitle(title, state);
    renderMomentumGraph(graph, state);
    header.clock.textContent = getFinalClockLabel(state.timelineEnd);
    button.textContent = "Replay complete";
    button.disabled = true;
  }

  button.addEventListener("click", () => window.location.reload());
  requestAnimationFrame(tick);
}

function revealEvent(event, eventsBox, state) {
  const xg = getApproxXg(event.text, event.type);
  if (event.type === "GOAL") {
    if (event.side === "home") state.homeGoals++;
    if (event.side === "away") state.awayGoals++;
  }
  if (event.side === "home") state.homeXg += xg;
  if (event.side === "away") state.awayXg += xg;

  const row = document.createElement("div");
  row.className = `live-event ${event.type.toLowerCase()} replay-event-enter`;
  row.textContent = event.text;
  eventsBox.prepend(row);
}

function normalizeReplayEvent(row, teams) {
  const text = row.textContent;
  const minute = getEventMinute(text);
  if (!minute) return null;
  return {
    minute,
    replayMinute: getReplayMinute(minute, text),
    text,
    type: getEventType(row),
    side: getEventSide(text, teams.homeName, teams.awayName)
  };
}

function getReplayMinute(minute, text) {
  const lower = text.toLowerCase();
  if (minute === 45 && lower.includes("half-time")) return 45 + FIRST_HALF_ADDED;
  if (minute === 90 && lower.includes("full-time")) return 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED;
  if (minute <= 45) return minute;
  if (minute <= 90) return 45 + FIRST_HALF_ADDED + (minute - 45);
  return 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED + (minute - 90);
}

function getTimelineEnd(events) {
  const regularEnd = 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED;
  const maxEvent = Math.max(regularEnd, ...events.map(event => event.replayMinute));
  return maxEvent > regularEnd ? Math.max(maxEvent, regularEnd + 30) : regularEnd;
}

function formatMatchClock(replayMinute) {
  const minute = Math.floor(replayMinute);
  const secondHalfStart = 45 + FIRST_HALF_ADDED;
  const normalEnd = secondHalfStart + 45;
  const finalEnd = normalEnd + SECOND_HALF_ADDED;
  if (minute <= 45) return `${minute}'`;
  if (minute <= secondHalfStart) return `45+${minute - 45}'`;
  if (minute <= normalEnd) return `${45 + minute - secondHalfStart}'`;
  if (minute <= finalEnd) return `90+${minute - normalEnd}'`;
  return `${Math.min(120, 90 + minute - finalEnd)}'`;
}

function getFinalClockLabel(timelineEnd) {
  const regularEnd = 45 + FIRST_HALF_ADDED + 45 + SECOND_HALF_ADDED;
  return timelineEnd > regularEnd ? "120'" : `90+${SECOND_HALF_ADDED}'`;
}

function getVisibleInterpolatedMomentum(state, minute) {
  const visible = state.momentumSeries.filter(point => point.minute <= minute);
  const next = state.momentumSeries.find(point => point.minute > minute);
  if (!visible.length) return [{ minute: 0, value: 0 }];
  if (!next) return visible;
  const previous = visible[visible.length - 1];
  const ratio = (minute - previous.minute) / Math.max(1, next.minute - previous.minute);
  return [...visible, { minute, value: previous.value + (next.value - previous.value) * ratio }];
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
  note.textContent = "Pro live replay running";
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
  header.append(title, score);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 320 150");
  svg.classList.add("xg-graph", "momentum-graph");

  const grid = svgPath("M0 25 H320 M0 75 H320 M0 125 H320", "xg-grid");
  const axis = svgPath("M0 75 H320", "momentum-zero-axis");
  const positiveArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
  positiveArea.classList.add("momentum-area", "positive-momentum-area");
  const negativeArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
  negativeArea.classList.add("momentum-area", "negative-momentum-area");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.classList.add("xg-line", "momentum-line", "neutral-momentum-line");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
  marker.classList.add("momentum-minute-marker");
  marker.setAttribute("y1", "18");
  marker.setAttribute("y2", "132");
  const topLabel = svgText(8, 18, state.homeName, "momentum-label home-momentum-label");
  const bottomLabel = svgText(8, 142, state.awayName, "momentum-label away-momentum-label");
  svg.append(grid, positiveArea, negativeArea, axis, line, marker, topLabel, bottomLabel);
  wrapper.append(header, svg);
  return { wrapper, score, line, positiveArea, negativeArea, minuteMarker: marker };
}

function renderMomentumGraph(graph, state) {
  const series = state.visibleMomentumSeries.length ? state.visibleMomentumSeries : [{ minute: 0, value: 0 }];
  const centerY = 75;
  const scale = 44;
  const toX = minute => (minute / Math.max(1, state.timelineEnd)) * 320;
  const toY = value => centerY - value * scale;
  graph.line.setAttribute("points", series.map(point => `${toX(point.minute).toFixed(1)},${toY(point.value).toFixed(1)}`).join(" "));
  graph.positiveArea.setAttribute("d", buildAreaPath(series, toX, toY, centerY, value => value > 0));
  graph.negativeArea.setAttribute("d", buildAreaPath(series, toX, toY, centerY, value => value < 0));
  const markerX = toX(Math.min(state.currentReplayMinute, state.timelineEnd));
  graph.minuteMarker.setAttribute("x1", markerX.toFixed(1));
  graph.minuteMarker.setAttribute("x2", markerX.toFixed(1));
  const momentum = getCurrentMomentum(state);
  graph.line.classList.toggle("home-momentum-line", momentum > 0.12);
  graph.line.classList.toggle("away-momentum-line", momentum < -0.12);
  graph.line.classList.toggle("neutral-momentum-line", Math.abs(momentum) <= 0.12);
  graph.score.textContent = `${state.homeName} ${state.homeXg.toFixed(1)} xG - ${state.awayXg.toFixed(1)} xG ${state.awayName}`;
}

function buildAreaPath(series, toX, toY, centerY, predicate) {
  const parts = [];
  let segment = [];
  series.forEach(point => {
    if (predicate(point.value)) segment.push(point);
    else if (segment.length) {
      parts.push(segment);
      segment = [];
    }
  });
  if (segment.length) parts.push(segment);
  return parts.map(points => {
    const start = points[0];
    const end = points[points.length - 1];
    const line = points.map(point => `L ${toX(point.minute).toFixed(1)} ${toY(point.value).toFixed(1)}`).join(" ");
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
  label.textContent = `${teamName} ${Math.abs(momentum) > 0.7 ? "dominating" : "pushing"}`;
  label.classList.add(momentum > 0 ? "home-pressure" : "away-pressure");
}

function parseScoreTitle(text) {
  const match = text.match(SCORE_PATTERN);
  return match ? { homeName: match[1].trim(), homeGoals: Number(match[2]), awayGoals: Number(match[3]), awayName: match[4].trim() } : null;
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

function getEventSide(text, homeName, awayName) {
  const lower = text.toLowerCase();
  if (lower.includes(homeName.toLowerCase())) return "home";
  if (lower.includes(awayName.toLowerCase())) return "away";
  return null;
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

function eventPriority(type) {
  if (type === "GOAL") return 0;
  if (type === "CHANCE") return 1;
  if (type === "SAVE") return 2;
  return 3;
}

function getCurrentMomentum(state) {
  const series = state.visibleMomentumSeries;
  return series.length ? series[series.length - 1].value : 0;
}

function svgPath(d, className) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.classList.add(className);
  return path;
}

function svgText(x, y, text, className) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
  node.setAttribute("x", String(x));
  node.setAttribute("y", String(y));
  className.split(" ").forEach(name => node.classList.add(name));
  node.textContent = text;
  return node;
}
