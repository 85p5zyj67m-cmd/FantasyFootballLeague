const REPLAY_DURATION_MS = 30000;
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
    .map(row => normalizeReplayEvent(row))
    .filter(Boolean)
    .sort((a, b) => a.replayMinute - b.replayMinute);

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
    const currentMinuteFloor = Math.floor(currentReplayMinute);

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

    replayState.visibleMomentumSeries = replayState.momentumSeries.filter(point =>
      point.minute <= currentMinuteFloor
    );

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
    header.clock.textContent = replayState.timelineEnd > 94 ? "120+" : "90+4";
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

function normalizeReplayEvent(row) {
  const text = row.textContent;
  const minute = getEventMinute(text);
  const type = getEventType(row);

  if (!minute) return null;

  return {
    minute,
    replayMinute: getReplayMinute(minute, type, text),
    text,
    type
  };
}

function getReplayMinute(minute, type, text) {
  const lower = text.toLowerCase();

  if (minute === 45 && lower.includes("half-time")) {
    return 45 + FIRST_HALF_ADDED;
  }

  if (minute === 90 && lower.includes("full-time")) {
    return 90 + SECOND_HALF_ADDED;
  }

  return minute;
}

function getTimelineEnd(events) {
  const maxReplayMinute = Math.max(90 + SECOND_HALF_ADDED, ...events.map(event => event.replayMinute));
  return maxReplayMinute > 94 ? Math.max(120, maxReplayMinute) : 90 + SECOND_HALF_ADDED;
}

function updateReplayStats(event, replayState) {
  const side = getEventSide(event, replayState);
  const xgValue = getApproxXg(event.text, event.type);

  if (event.type === "GOAL") {
    if (side === "home") replayState.homeGoals++;
    if (side === "away") replayState.awayGoals++;
  }

  if (side === "home") replayState.homeXg += xgValue;
  if (side === "away") replayState.awayXg += xgValue;
}

function buildMomentumSeries(events, timelineEnd) {
  const points = [];
  let momentum = 0;

  for (let minute = 0; minute <= timelineEnd; minute++) {
    const minuteEvents = events.filter(event => Math.floor(event.replayMinute) === minute);

    momentum *= 0.9;

    minuteEvents.forEach(event => {
      const side = getEventSideByNames(event.text, event.homeName, event.awayName);
      const impact = getEventImpact(event);

      if (side === "home") momentum += impact;
      if (side === "away") momentum -= impact;
      if (event.type === "INFO") momentum *= 0.82;
    });

    momentum += Math.sin(minute / 5) * 0.012;
    momentum = clamp(-1.25, 1.25, momentum);

    points.push({
      minute,
      value: Number(momentum.toFixed(3))
    });
  }

  return smoothSeries(points);
}

function getEventSide(event, replayState) {
  const text = event.text.toLowerCase();
  const homeKey = replayState.homeName.toLowerCase();
  const awayKey = replayState.awayName.toLowerCase();

  if (text.includes(homeKey)) return "home";
  if (text.includes(awayKey)) return "away";
  return null;
}

function getEventSideByNames() {
  return null;
}

function getEventImpact(event) {
  if (event.type === "GOAL") return 0.8;
  if (event.text.includes("Huge chance")) return 0.6;
  if (event.text.includes("sharp save")) return 0.42;
  if (event.text.includes("half chance")) return 0.22;
  if (event.type === "SAVE") return 0.34;
  if (event.type === "CHANCE") return 0.26;
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

function createReplayHeader(state) {
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
  line.classList.add("xg-line", "momentum-line");

  svg.append(grid, positiveArea, negativeArea, axis, line, topLabel, bottomLabel);
  wrapper.append(header, svg);

  const graph = { wrapper, score, line, positiveArea, negativeArea };
  renderMomentumGraph(graph, state);
  return graph;
}

function renderMomentumGraph(graph, state) {
  const series = state.visibleMomentumSeries.length
    ? state.visibleMomentumSeries
    : [{ minute: 0, value: 0 }];

  const width = 320;
  const centerY = 75;
  const scale = 46;
  const maxMinute = Math.max(1, state.timelineEnd);

  const toX = minute => (minute / maxMinute) * width;
  const toY = value => centerY - value * scale;

  const points = series.map(point =>
    `${toX(point.minute).toFixed(1)},${toY(point.value).toFixed(1)}`
  ).join(" ");

  graph.line.setAttribute("points", points);
  graph.positiveArea.setAttribute("d", buildMomentumAreaPath(series, maxMinute, toX, toY, value => Math.max(0, value), centerY));
  graph.negativeArea.setAttribute("d", buildMomentumAreaPath(series, maxMinute, toX, toY, value => Math.min(0, value), centerY));

  const current = getCurrentMomentum(state);
  const leadingTeam = current > 0.08 ? state.homeName : current < -0.08 ? state.awayName : "Balanced";
  graph.score.textContent = `${leadingTeam} · ${Math.abs(current).toFixed(2)}`;
}

function buildMomentumAreaPath(series, maxMinute, toX, toY, transformValue, centerY) {
  if (!series.length) return "";

  const startX = toX(series[0].minute);
  const line = series.map(point => {
    const value = transformValue(point.value);
    return `${toX(point.minute).toFixed(1)} ${toY(value).toFixed(1)}`;
  }).join(" L ");

  const endX = toX(series[series.length - 1].minute);
  return `M ${startX.toFixed(1)} ${centerY} L ${line} L ${endX.toFixed(1)} ${centerY} Z`;
}

function updateScoreTitle(title, state) {
  title.textContent = `${state.homeName} ${state.homeGoals} - ${state.awayGoals} ${state.awayName}`;
}

function updatePressureLabel(label, state, momentum) {
  label.classList.remove("home-pressure", "away-pressure", "neutral-pressure");

  if (Math.abs(momentum) < 0.1) {
    label.textContent = "Balanced game";
    label.classList.add("neutral-pressure");
    return;
  }

  const teamName = momentum > 0 ? state.homeName : state.awayName;
  const intensity = Math.abs(momentum) > 0.65 ? "dominating" : "pushing";
  label.textContent = `${teamName} ${intensity}`;
  label.classList.add(momentum > 0 ? "home-pressure" : "away-pressure");
}

function getCurrentMomentum(state) {
  const currentMinute = Math.floor(state.currentReplayMinute || 0);
  const point = state.momentumSeries.find(item => item.minute === currentMinute) || state.momentumSeries[0];
  return point ? point.value : 0;
}

function formatMatchClock(replayMinute, timelineEnd) {
  const minute = Math.floor(replayMinute);

  if (minute < 45) return `${minute}'`;
  if (minute <= 45 + FIRST_HALF_ADDED) return `45+${Math.max(0, minute - 45)}'`;
  if (minute < 90) return `${minute}'`;

  if (timelineEnd <= 94) {
    return `90+${Math.max(0, minute - 90)}'`;
  }

  if (minute <= 90 + SECOND_HALF_ADDED) return `90+${Math.max(0, minute - 90)}'`;
  if (minute <= 120) return `${minute}'`;
  return `120+${minute - 120}'`;
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

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}
