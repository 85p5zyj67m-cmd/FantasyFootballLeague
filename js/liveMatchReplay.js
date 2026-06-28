const REPLAY_DURATION_MS = 26000;
const SCORE_PATTERN = /^(.*)\s+(\d+)\s+-\s+(\d+)\s+(.*)$/;

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
    .map(row => ({
      minute: getEventMinute(row.textContent),
      text: row.textContent,
      type: getEventType(row)
    }))
    .sort((a, b) => a.minute - b.minute);

  const maxMinute = Math.max(90, ...replayEvents.map(event => event.minute));
  const replayState = {
    homeName: parsedScore.homeName,
    awayName: parsedScore.awayName,
    finalHomeGoals: parsedScore.homeGoals,
    finalAwayGoals: parsedScore.awayGoals,
    homeGoals: 0,
    awayGoals: 0,
    homeXg: 0,
    awayXg: 0,
    maxMinute,
    xgPoints: [{ minute: 0, homeXg: 0, awayXg: 0 }]
  };

  const header = createReplayHeader(replayState);
  const graph = createXgGraph(replayState);
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
    const currentMinute = Math.floor(progress * replayState.maxMinute);
    const minutesLeft = Math.max(0, replayState.maxMinute - currentMinute);

    header.clock.textContent = `${String(minutesLeft).padStart(2, "0")}:00 left`;
    header.progress.style.width = `${progress * 100}%`;

    while (
      currentEventIndex < replayEvents.length &&
      replayEvents[currentEventIndex].minute <= currentMinute
    ) {
      revealEvent(replayEvents[currentEventIndex], eventsBox, replayState, graph);
      currentEventIndex++;
    }

    updateScoreTitle(title, replayState);
    updatePressureLabel(header.pressure, replayState);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    replayState.homeGoals = replayState.finalHomeGoals;
    replayState.awayGoals = replayState.finalAwayGoals;
    updateScoreTitle(title, replayState);
    header.clock.textContent = "FT";
    playBtn.textContent = "Replay complete";
    playBtn.disabled = true;
  };

  playBtn.addEventListener("click", () => {
    window.location.reload();
  });

  requestAnimationFrame(tick);
}

function revealEvent(event, eventsBox, replayState, graph) {
  updateReplayStats(event, replayState);

  const row = document.createElement("div");
  row.className = `live-event ${event.type.toLowerCase()} replay-event-enter`;
  row.textContent = event.text;
  eventsBox.prepend(row);

  replayState.xgPoints.push({
    minute: event.minute,
    homeXg: replayState.homeXg,
    awayXg: replayState.awayXg
  });

  renderXgGraph(graph, replayState);
}

function updateReplayStats(event, replayState) {
  const text = event.text.toLowerCase();
  const homeKey = replayState.homeName.toLowerCase();
  const awayKey = replayState.awayName.toLowerCase();
  const isHomeEvent = text.includes(homeKey);
  const isAwayEvent = text.includes(awayKey);
  const xgValue = getApproxXg(event.text, event.type);

  if (event.type === "GOAL") {
    if (isHomeEvent) replayState.homeGoals++;
    if (isAwayEvent) replayState.awayGoals++;
  }

  if (isHomeEvent) replayState.homeXg += xgValue;
  if (isAwayEvent) replayState.awayXg += xgValue;
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

function createReplayHeader(state) {
  const wrapper = document.createElement("div");
  wrapper.className = "replay-header";

  const clock = document.createElement("div");
  clock.className = "replay-clock";
  clock.textContent = `${state.maxMinute}:00 left`;

  const pressure = document.createElement("div");
  pressure.className = "replay-pressure";
  pressure.textContent = "Feeling out phase";

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

function createXgGraph(state) {
  const wrapper = document.createElement("div");
  wrapper.className = "xg-graph-card";

  const header = document.createElement("div");
  header.className = "xg-graph-header";

  const title = document.createElement("strong");
  title.textContent = "xG Momentum";

  const score = document.createElement("span");
  score.className = "xg-score";
  score.textContent = `${state.homeName} 0.0 - 0.0 ${state.awayName}`;

  header.append(title, score);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 320 130");
  svg.classList.add("xg-graph");

  const grid = document.createElementNS("http://www.w3.org/2000/svg", "path");
  grid.setAttribute("d", "M0 105 H320 M0 70 H320 M0 35 H320");
  grid.classList.add("xg-grid");

  const homeLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  homeLine.classList.add("xg-line", "home-xg-line");

  const awayLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  awayLine.classList.add("xg-line", "away-xg-line");

  svg.append(grid, homeLine, awayLine);
  wrapper.append(header, svg);

  renderXgGraph({ wrapper, score, homeLine, awayLine }, state);
  return { wrapper, score, homeLine, awayLine };
}

function renderXgGraph(graph, state) {
  const maxXg = Math.max(1, state.homeXg, state.awayXg) + 0.2;
  const width = 320;
  const height = 110;
  const baseY = 115;

  const toPoints = key => state.xgPoints.map(point => {
    const x = (point.minute / state.maxMinute) * width;
    const y = baseY - (point[key] / maxXg) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  graph.homeLine.setAttribute("points", toPoints("homeXg"));
  graph.awayLine.setAttribute("points", toPoints("awayXg"));
  graph.score.textContent = `${state.homeName} ${state.homeXg.toFixed(1)} - ${state.awayXg.toFixed(1)} ${state.awayName}`;
}

function updateScoreTitle(title, state) {
  title.textContent = `${state.homeName} ${state.homeGoals} - ${state.awayGoals} ${state.awayName}`;
}

function updatePressureLabel(label, state) {
  const diff = state.homeXg - state.awayXg;

  if (Math.abs(diff) < 0.15) {
    label.textContent = "Balanced game";
    return;
  }

  const teamName = diff > 0 ? state.homeName : state.awayName;
  const intensity = Math.abs(diff) > 0.65 ? "dominating" : "pushing";
  label.textContent = `${teamName} ${intensity}`;
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
