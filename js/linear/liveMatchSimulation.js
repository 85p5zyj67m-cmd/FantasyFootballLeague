const LIVE_MATCH_DURATION_MS = 44000;
const SVG_NS = "http://www.w3.org/2000/svg";
const HOME_CLASS = "home";
const AWAY_CLASS = "away";

export function renderLiveMatchSimulation(match, options = {}) {
  installLiveMatchStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "linear-live-sim";

  if (!match) {
    const empty = document.createElement("div");
    empty.className = "linear-mini-card live-empty-card";
    empty.textContent = "No match has been played yet.";
    wrapper.appendChild(empty);
    return wrapper;
  }

  const state = createSimulationState(match);
  const scoreboard = createScoreboard(state);
  const momentum = createMomentumCard(state);
  const stats = createStatsPanel();
  const ticker = createTickerPanel();
  const controls = createControls(options.nextButtonText || "Continue", options.onContinue || (() => {}));

  state.nodes = {
    scoreboard,
    momentum,
    stats,
    ticker,
    controls
  };

  wrapper.append(scoreboard.wrapper, momentum.wrapper, ticker.wrapper, stats.wrapper, controls.wrapper);
  renderFrame(state);
  runSimulation(wrapper, state);

  return wrapper;
}

function createSimulationState(match) {
  const events = normalizeEvents(match);
  const timelineEnd = getTimelineEnd(events);
  const momentumSeries = buildMomentumSeries(match, events, timelineEnd);
  const finalStats = buildFinalStats(match, events, momentumSeries);

  return {
    match,
    events,
    timelineEnd,
    momentumSeries,
    visibleSeries: [{ minute: 0, value: 0 }],
    currentMinute: 0,
    eventIndex: 0,
    complete: false,
    live: {
      homeGoals: 0,
      awayGoals: 0,
      homeXg: 0,
      awayXg: 0,
      homeShots: 0,
      awayShots: 0,
      homeShotsOnTarget: 0,
      awayShotsOnTarget: 0,
      homeSaves: 0,
      awaySaves: 0
    },
    finalStats,
    goalLog: [],
    nodes: null
  };
}

function runSimulation(wrapper, state) {
  let startTime = null;

  const tick = now => {
    if (!wrapper.isConnected || state.complete) return;
    if (startTime === null) startTime = now;

    const progress = Math.min(1, (now - startTime) / LIVE_MATCH_DURATION_MS);
    state.currentMinute = progress * state.timelineEnd;
    revealEventsUntil(state, state.currentMinute);
    renderFrame(state);

    if (progress >= 1) {
      finishSimulation(state);
      return;
    }

    window.requestAnimationFrame(tick);
  };

  state.nodes.controls.skipButton.addEventListener("click", () => finishSimulation(state));
  window.requestAnimationFrame(tick);
}

function finishSimulation(state) {
  if (state.complete) return;

  state.currentMinute = state.timelineEnd;
  revealEventsUntil(state, state.timelineEnd + 1);
  state.visibleSeries = state.momentumSeries;
  state.live.homeGoals = Number(state.match.homeGoals || 0);
  state.live.awayGoals = Number(state.match.awayGoals || 0);
  state.live.homeXg = state.finalStats.homeXg;
  state.live.awayXg = state.finalStats.awayXg;
  state.live.homeShots = state.finalStats.homeShots;
  state.live.awayShots = state.finalStats.awayShots;
  state.live.homeShotsOnTarget = state.finalStats.homeShotsOnTarget;
  state.live.awayShotsOnTarget = state.finalStats.awayShotsOnTarget;
  state.complete = true;

  renderFrame(state);
  renderResultBanner(state);

  state.nodes.scoreboard.badge.textContent = "FT";
  state.nodes.scoreboard.badge.classList.remove("is-live");
  state.nodes.controls.continueButton.disabled = false;
  state.nodes.controls.continueButton.classList.add("ready");
  state.nodes.controls.skipButton.disabled = true;
}

function revealEventsUntil(state, minute) {
  while (state.eventIndex < state.events.length && state.events[state.eventIndex].replayMinute <= minute) {
    const event = state.events[state.eventIndex];
    applyEventToLiveStats(state, event);
    addTickerEvent(state, event);
    state.eventIndex += 1;
  }
}

function applyEventToLiveStats(state, event) {
  if (!event.side) return;

  const sidePrefix = event.side === HOME_CLASS ? "home" : "away";
  const xgKey = `${sidePrefix}Xg`;
  const shotsKey = `${sidePrefix}Shots`;
  const sotKey = `${sidePrefix}ShotsOnTarget`;
  const goalsKey = `${sidePrefix}Goals`;
  const finalXg = state.finalStats[xgKey];
  const finalShots = state.finalStats[shotsKey];
  const finalSot = state.finalStats[sotKey];

  if (isShotEvent(event)) {
    state.live[shotsKey] = Math.min(finalShots, state.live[shotsKey] + 1);
  }

  if (isScoringEvent(event) || event.type === "SAVE") {
    state.live[sotKey] = Math.min(finalSot, state.live[sotKey] + 1);
  }

  if (event.type === "SAVE") {
    const savesKey = sidePrefix === "home" ? "awaySaves" : "homeSaves";
    state.live[savesKey] += 1;
  }

  if (event.xg > 0) {
    state.live[xgKey] = finalXg > 0
      ? Math.min(finalXg, state.live[xgKey] + event.xg)
      : state.live[xgKey] + event.xg;
  }

  if (isScoringEvent(event)) {
    state.live[goalsKey] += 1;
    const scoringTeam = event.side === HOME_CLASS ? state.match.home : state.match.away;
    state.goalLog.push({
      minute: event.minute,
      side: event.side,
      scorer: extractScorerName(event.text, teamName(scoringTeam)),
      score: `${state.live.homeGoals} - ${state.live.awayGoals}`
    });
  }
}

const SCORER_PATTERNS = [
  /through ([^.]+?)(?:\.|$)/i,
  /and ([^.]+?) scores/i,
  /and ([^.]+?) converts/i,
  /([A-ZÀ-Ÿ][^.!?]+?) gets the final touch/i,
  /([A-ZÀ-Ÿ][^.!?]+?) fires in from distance/i,
  /and ([^.]+?) finishes/i,
  /finished by ([^.]+?)(?:\.|$)/i,
  /strike through ([^.]+?)(?:\.|$)/i
];

function extractScorerName(text, teamNameValue) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();

  for (const pattern of SCORER_PATTERNS) {
    const match = cleanText.match(pattern);
    if (match?.[1]) return cleanupScorerName(match[1], teamNameValue);
  }

  return "Unknown scorer";
}

function cleanupScorerName(value, teamNameValue) {
  return String(value || "")
    .replace(teamNameValue, "")
    .replace(/^the\s+/i, "")
    .replace(/\s+for\s+$/i, "")
    .replace(/[.,!]+$/g, "")
    .trim() || "Unknown scorer";
}

function renderFrame(state) {
  const progress = Math.min(1, state.currentMinute / Math.max(1, state.timelineEnd));
  state.visibleSeries = getVisibleSeries(state.momentumSeries, state.currentMinute);
  updateScoreboard(state, progress);
  renderMomentumGraph(state);
  updateStatsPanel(state, progress);
}

function normalizeEvents(match) {
  const rawEvents = Array.isArray(match.events) ? match.events : [];

  return rawEvents
    .map((event, index) => {
      const text = String(event.text || "");
      const type = String(event.type || "INFO").toUpperCase();
      const minute = Number(event.minute || parseMinute(text) || 1);
      const penaltyShootout = isPenaltyShootoutEvent(text);

      return {
        ...event,
        index,
        text,
        type,
        minute,
        replayMinute: minute,
        side: getEventSide(text, match, penaltyShootout),
        xg: getEventXg(text, type, penaltyShootout),
        penaltyShootout
      };
    })
    .sort((a, b) => a.replayMinute - b.replayMinute || eventPriority(a.type) - eventPriority(b.type) || a.index - b.index);
}

function getTimelineEnd(events) {
  const maxMinute = Math.max(90, ...events.map(event => event.replayMinute || 0));
  if (maxMinute > 120) return 121;
  if (maxMinute > 90) return 120;
  return 90;
}

function buildMomentumSeries(match, events, timelineEnd) {
  const rng = seededRandom(`${teamName(match.home)}-${teamName(match.away)}-${match.homeGoals}-${match.awayGoals}-${events.map(event => event.text).join("|")}`);
  const buckets = groupEventsByMinute(events);
  const points = [];
  const matchStats = match.stats || {};
  const baseEdge = ((Number(matchStats.homeMomentum || 0) - Number(matchStats.awayMomentum || 0)) / 180) + randomBetween(rng, -0.08, 0.08);
  let momentum = clamp(-0.4, 0.4, baseEdge);
  let phaseSide = rng() > 0.5 ? HOME_CLASS : AWAY_CLASS;
  let phasePower = randomBetween(rng, 0.08, 0.38);
  let phaseLeft = Math.floor(randomBetween(rng, 5, 14));

  for (let minute = 0; minute <= timelineEnd; minute++) {
    if (phaseLeft <= 0 || rng() < 0.09) {
      phaseSide = pickNextPhaseSide(rng, phaseSide, momentum);
      phasePower = randomBetween(rng, 0.07, 0.58);
      phaseLeft = Math.floor(randomBetween(rng, 4, 13));
    }

    const direction = phaseSide === HOME_CLASS ? 1 : -1;
    const pulse = Math.sin(minute / randomBetween(rng, 4.4, 7.8)) * 0.055;
    const chaos = randomBetween(rng, -0.09, 0.09);
    const lateSwing = minute > 75 ? randomBetween(rng, -0.08, 0.08) : 0;

    momentum = momentum * 0.82 + direction * phasePower * 0.24 + pulse + chaos + lateSwing;

    (buckets.get(minute) || []).forEach(event => {
      const impact = eventImpact(event);
      if (event.side === HOME_CLASS) momentum += impact;
      if (event.side === AWAY_CLASS) momentum -= impact;
      if (event.type === "INFO") momentum *= 0.72;
    });

    momentum = clamp(-1.55, 1.55, momentum);
    points.push({ minute, value: Number(momentum.toFixed(3)) });
    phaseLeft -= 1;
  }

  return smoothSeries(smoothSeries(points));
}

function buildFinalStats(match, events, momentumSeries) {
  const stats = match.stats || {};
  const homeGoals = Number(match.homeGoals || 0);
  const awayGoals = Number(match.awayGoals || 0);
  const eventShots = countEventShots(events);
  const homeShots = Math.max(Number(stats.homeShots || 0), eventShots.homeShots, homeGoals);
  const awayShots = Math.max(Number(stats.awayShots || 0), eventShots.awayShots, awayGoals);
  const homeShotsOnTarget = clampInteger(homeGoals, homeShots, Math.max(eventShots.homeShotsOnTarget, Math.round(homeShots * 0.38), homeGoals));
  const awayShotsOnTarget = clampInteger(awayGoals, awayShots, Math.max(eventShots.awayShotsOnTarget, Math.round(awayShots * 0.38), awayGoals));
  const homeXg = Number.isFinite(Number(stats.homeXg)) ? Number(stats.homeXg) : eventShots.homeXg;
  const awayXg = Number.isFinite(Number(stats.awayXg)) ? Number(stats.awayXg) : eventShots.awayXg;
  const averageMomentum = average(momentumSeries.map(point => point.value));
  const statEdge = (Number(stats.homeMomentum || 0) - Number(stats.awayMomentum || 0)) / 8;
  const scoreEdge = (homeGoals - awayGoals) * 2.2;
  const shotEdge = (homeShots - awayShots) * 0.9;
  const homePossession = clampInteger(34, 66, Math.round(50 + averageMomentum * 9 + statEdge));
  const homeDuels = clampInteger(36, 64, Math.round(50 + averageMomentum * 7 + shotEdge + scoreEdge));

  return {
    homeXg: roundStat(homeXg),
    awayXg: roundStat(awayXg),
    homeShots,
    awayShots,
    homeShotsOnTarget,
    awayShotsOnTarget,
    homePossession,
    awayPossession: 100 - homePossession,
    homeDuels,
    awayDuels: 100 - homeDuels
  };
}

function createScoreboard(state) {
  const wrapper = document.createElement("div");
  wrapper.className = "live-scoreboard";

  const badgeRow = document.createElement("div");
  badgeRow.className = "live-scoreboard-badge-row";

  const badge = document.createElement("span");
  badge.className = "live-badge is-live";
  badge.textContent = "LIVE";

  const clock = document.createElement("div");
  clock.className = "live-clock";
  clock.textContent = "0'";

  badgeRow.append(badge, clock);

  const board = document.createElement("div");
  board.className = "live-scoreboard-board";

  const homeCol = document.createElement("div");
  homeCol.className = "live-scoreboard-col home";
  const home = document.createElement("div");
  home.className = "live-team home-team";
  home.textContent = teamName(state.match.home);
  const homeScorers = document.createElement("div");
  homeScorers.className = "live-scoreboard-scorers";
  homeCol.append(home, homeScorers);

  const score = document.createElement("div");
  score.className = "live-score";
  score.textContent = "0 - 0";

  const awayCol = document.createElement("div");
  awayCol.className = "live-scoreboard-col away";
  const away = document.createElement("div");
  away.className = "live-team away-team";
  away.textContent = teamName(state.match.away);
  const awayScorers = document.createElement("div");
  awayScorers.className = "live-scoreboard-scorers";
  awayCol.append(away, awayScorers);

  board.append(homeCol, score, awayCol);

  const progressTrack = document.createElement("div");
  progressTrack.className = "live-progress-track";
  const progressFill = document.createElement("div");
  progressFill.className = "live-progress-fill";
  progressTrack.appendChild(progressFill);

  wrapper.append(badgeRow, board, progressTrack);
  return { wrapper, badge, home, away, score, clock, progressFill, homeScorers, awayScorers };
}

const MOMENTUM_VIEW_W = 560;
const MOMENTUM_VIEW_H = 260;
const MOMENTUM_CENTER_Y = 130;
const MOMENTUM_ROW_OFFSET = 104;
const MOMENTUM_MARKER_DELTA = 112;
const MOMENTUM_MAX_BAR_HEIGHT = 96;
const MOMENTUM_START_X = 34;
const MOMENTUM_PLOT_WIDTH = 508;

function createMomentumCard(state) {
  const wrapper = document.createElement("div");
  wrapper.className = "live-momentum-card";

  const header = document.createElement("div");
  header.className = "live-card-header";
  const title = document.createElement("h2");
  title.textContent = "Match Momentum";
  const hint = document.createElement("span");
  hint.className = "live-info-dot";
  hint.textContent = "i";
  header.append(title, hint);

  const subline = document.createElement("p");
  subline.className = "live-momentum-subline";
  subline.textContent = `${teamName(state.match.home)} pressure above the line, ${teamName(state.match.away)} below.`;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${MOMENTUM_VIEW_W} ${MOMENTUM_VIEW_H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("live-momentum-svg");

  const endX = MOMENTUM_START_X + MOMENTUM_PLOT_WIDTH;
  const cy = MOMENTUM_CENTER_Y;

  const grid = svgGroup("live-momentum-grid");
  [cy - 73, cy - 30, cy, cy + 30, cy + 73].forEach(y => grid.appendChild(svgLine(MOMENTUM_START_X, y, endX, y, "live-grid-line")));

  const zero = svgLine(MOMENTUM_START_X, cy, endX, cy, "live-zero-line");
  const bars = svgGroup("live-bars");
  const goals = svgGroup("live-goal-markers");
  const marker = svgLine(MOMENTUM_START_X, cy - MOMENTUM_MARKER_DELTA, MOMENTUM_START_X, cy + MOMENTUM_MARKER_DELTA, "live-minute-marker");
  const labels = svgGroup("live-graph-labels");
  labels.append(
    svgText(12, cy - MOMENTUM_ROW_OFFSET, shortTeamName(state.match.home), "live-home-label"),
    svgText(12, cy + MOMENTUM_ROW_OFFSET, shortTeamName(state.match.away), "live-away-label"),
    svgText(MOMENTUM_START_X, MOMENTUM_VIEW_H - 9, "0'", "live-time-label"),
    svgText((MOMENTUM_START_X + endX) / 2, MOMENTUM_VIEW_H - 9, "HT", "live-time-label middle"),
    svgText(endX, MOMENTUM_VIEW_H - 9, state.timelineEnd > 90 ? "120'" : "FT", "live-time-label end")
  );

  svg.append(grid, zero, bars, goals, marker, labels);
  wrapper.append(header, subline, svg);

  return { wrapper, svg, bars, goals, marker };
}

function createStatsPanel() {
  const wrapper = document.createElement("div");
  wrapper.className = "live-stats-panel";

  const possession = createStatRow("Ball Possession");
  const xg = createStatRow("Expected Goals (xG)");
  const shots = createStatRow("Total Shots");
  const shotsOnTarget = createStatRow("Shots on Target");
  const saves = createStatRow("Goalkeeper Saves");
  const duels = createStatRow("Duels Won");

  wrapper.append(possession.row, xg.row, shots.row, shotsOnTarget.row, saves.row, duels.row);
  return { wrapper, possession, xg, shots, shotsOnTarget, saves, duels };
}

function createStatRow(labelText) {
  const row = document.createElement("div");
  row.className = "live-stat-row";

  const home = document.createElement("span");
  home.className = "live-stat-value live-stat-home";

  const label = document.createElement("span");
  label.className = "live-stat-label";
  label.textContent = labelText;

  const away = document.createElement("span");
  away.className = "live-stat-value live-stat-away";

  row.append(home, label, away);
  return { row, home, away };
}

function createTickerPanel() {
  const wrapper = document.createElement("div");
  wrapper.className = "live-ticker-card";

  const header = document.createElement("div");
  header.className = "live-card-header";
  const title = document.createElement("h2");
  title.textContent = "Live Ticker";
  const note = document.createElement("span");
  note.className = "live-ticker-note";
  note.textContent = "latest first";
  header.append(title, note);

  const list = document.createElement("div");
  list.className = "live-ticker-list";

  const empty = document.createElement("p");
  empty.className = "live-ticker-empty";
  empty.textContent = "Kickoff is loading...";
  list.appendChild(empty);

  wrapper.append(header, list);
  return { wrapper, list };
}

function createControls(buttonText, onContinue) {
  const wrapper = document.createElement("div");
  wrapper.className = "live-controls";

  const skipButton = document.createElement("button");
  skipButton.type = "button";
  skipButton.className = "live-secondary-btn";
  skipButton.textContent = "Skip to result";

  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.className = "primary-btn linear-next-btn live-continue-btn";
  continueButton.textContent = buttonText;
  continueButton.disabled = true;
  continueButton.addEventListener("click", onContinue);

  wrapper.append(skipButton, continueButton);
  return { wrapper, skipButton, continueButton };
}

function updateScoreboard(state, progress) {
  const nodes = state.nodes.scoreboard;
  nodes.score.textContent = `${state.live.homeGoals} - ${state.live.awayGoals}`;
  nodes.clock.textContent = formatClock(state.currentMinute, state.timelineEnd);
  nodes.progressFill.style.width = `${Math.min(100, progress * 100).toFixed(2)}%`;

  fillScorerColumn(nodes.homeScorers, state.goalLog.filter(goal => goal.side === HOME_CLASS));
  fillScorerColumn(nodes.awayScorers, state.goalLog.filter(goal => goal.side === AWAY_CLASS));
}

function fillScorerColumn(node, goals) {
  node.replaceChildren();
  goals.forEach(goal => {
    const line = document.createElement("span");
    line.textContent = `⚽ ${goal.minute}' ${goal.scorer}`;
    node.appendChild(line);
  });
}

function renderMomentumGraph(state) {
  const graph = state.nodes.momentum;
  const width = MOMENTUM_PLOT_WIDTH;
  const startX = MOMENTUM_START_X;
  const centerY = MOMENTUM_CENTER_Y;
  const maxHeight = MOMENTUM_MAX_BAR_HEIGHT;
  const timelineEnd = Math.max(1, state.timelineEnd);
  const visibleMinute = Math.min(state.currentMinute, state.timelineEnd);

  graph.bars.replaceChildren();

  state.momentumSeries.forEach(point => {
    if (point.minute > visibleMinute) return;
    if (point.minute % 2 !== 0 && point.minute !== Math.floor(visibleMinute)) return;

    const x = startX + (point.minute / timelineEnd) * width;
    const h = Math.max(2, Math.abs(point.value) / 1.55 * maxHeight);
    const y = point.value >= 0 ? centerY - h : centerY;
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", (x - 1.4).toFixed(2));
    rect.setAttribute("y", y.toFixed(2));
    rect.setAttribute("width", "2.8");
    rect.setAttribute("height", h.toFixed(2));
    rect.setAttribute("rx", "1.4");
    rect.setAttribute("class", point.value >= 0 ? "live-momentum-bar home" : "live-momentum-bar away");
    graph.bars.appendChild(rect);
  });

  graph.goals.replaceChildren();
  state.events
    .filter(event => event.replayMinute <= visibleMinute && isScoringEvent(event))
    .forEach(event => {
      const x = startX + (event.replayMinute / timelineEnd) * width;
      const y = event.side === AWAY_CLASS ? centerY + MOMENTUM_ROW_OFFSET : centerY - MOMENTUM_ROW_OFFSET;
      const ball = svgText(x, y + 5, "⚽", `live-goal-ball-icon ${event.side || ""}`);
      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = `${event.minute}' ${event.text}`;
      ball.appendChild(title);
      graph.goals.appendChild(ball);
    });

  const markerX = startX + (visibleMinute / timelineEnd) * width;
  graph.marker.setAttribute("x1", markerX.toFixed(2));
  graph.marker.setAttribute("x2", markerX.toFixed(2));
}

function updateStatsPanel(state, progress) {
  const stats = state.nodes.stats;
  const currentMomentum = getCurrentMomentum(state.visibleSeries);
  const eased = easeOutCubic(progress);
  const homePossession = clampInteger(30, 70, Math.round(50 + (state.finalStats.homePossession - 50) * eased + currentMomentum * 4 * (1 - progress)));
  const homeDuels = clampInteger(30, 70, Math.round(50 + (state.finalStats.homeDuels - 50) * eased + currentMomentum * 3 * (1 - progress)));

  setStat(stats.possession, `${homePossession}%`, `${100 - homePossession}%`, homePossession, 100 - homePossession);
  setStat(stats.xg, state.live.homeXg.toFixed(2), state.live.awayXg.toFixed(2), state.live.homeXg, state.live.awayXg);
  setStat(stats.shots, String(state.live.homeShots), String(state.live.awayShots), state.live.homeShots, state.live.awayShots);
  setStat(stats.shotsOnTarget, String(state.live.homeShotsOnTarget), String(state.live.awayShotsOnTarget), state.live.homeShotsOnTarget, state.live.awayShotsOnTarget);
  setStat(stats.saves, String(state.live.homeSaves), String(state.live.awaySaves), state.live.homeSaves, state.live.awaySaves);
  setStat(stats.duels, `${homeDuels}%`, `${100 - homeDuels}%`, homeDuels, 100 - homeDuels);
}

function setStat(stat, homeText, awayText, homeValue, awayValue) {
  stat.home.textContent = homeText;
  stat.away.textContent = awayText;
  stat.home.classList.toggle("is-leading", homeValue >= awayValue);
  stat.away.classList.toggle("is-leading", awayValue > homeValue);
}

function addTickerEvent(state, event) {
  const list = state.nodes.ticker.list;
  const empty = list.querySelector(".live-ticker-empty");
  if (empty) empty.remove();

  const row = document.createElement("div");
  row.className = `live-ticker-event ${event.type.toLowerCase()}`;
  if (event.side) row.classList.add(event.side);

  const minute = document.createElement("span");
  minute.className = "live-event-minute";
  minute.textContent = `${event.minute}'`;

  const text = document.createElement("span");
  text.className = "live-event-text";

  const scorerName = isScoringEvent(event) ? state.goalLog[state.goalLog.length - 1]?.scorer : null;
  renderTickerText(text, event.text, scorerName);

  row.append(minute, text);
  list.prepend(row);
}

function renderTickerText(container, fullText, scorerName) {
  const goalIndex = fullText.indexOf("GOAL!");
  if (goalIndex === -1) {
    container.textContent = fullText;
    return;
  }

  container.append(fullText.slice(0, goalIndex));

  const goalSpan = document.createElement("span");
  goalSpan.className = "live-ticker-goal-word";
  goalSpan.textContent = "GOAL!";
  container.appendChild(goalSpan);

  let rest = fullText.slice(goalIndex + "GOAL!".length);
  const scorerIndex = scorerName && scorerName !== "Unknown scorer" ? rest.indexOf(scorerName) : -1;

  if (scorerIndex !== -1) {
    container.append(rest.slice(0, scorerIndex));

    const scorerSpan = document.createElement("span");
    scorerSpan.className = "live-ticker-scorer-name";
    scorerSpan.textContent = scorerName;
    container.appendChild(scorerSpan);

    rest = rest.slice(scorerIndex + scorerName.length);
  }

  container.append(rest);
}

function renderResultBanner(state) {
  const existing = state.nodes.ticker.wrapper.querySelector(".live-result-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.className = "live-result-banner";
  banner.textContent = getResultText(state.match);
  state.nodes.ticker.wrapper.insertBefore(banner, state.nodes.ticker.list);
}

function getResultText(match) {
  const home = teamName(match.home);
  const away = teamName(match.away);
  const score = `${home} ${match.homeGoals} - ${match.awayGoals} ${away}`;

  if (match.decidedBy === "PEN" && match.winner) {
    return `${score}. ${teamName(match.winner)} win on penalties${match.penaltyScore ? ` (${match.penaltyScore})` : ""}.`;
  }

  if (match.decidedBy === "ET" && match.winner) {
    return `${score}. ${teamName(match.winner)} win after extra time.`;
  }

  if (match.winner) {
    return `${score}. Winner: ${teamName(match.winner)}.`;
  }

  return `${score}. Draw.`;
}

function getVisibleSeries(series, minute) {
  const visible = series.filter(point => point.minute <= minute);
  const next = series.find(point => point.minute > minute);

  if (!visible.length) return [{ minute: 0, value: 0 }];
  if (!next) return visible;

  const previous = visible[visible.length - 1];
  const ratio = (minute - previous.minute) / Math.max(1, next.minute - previous.minute);
  return [
    ...visible,
    {
      minute,
      value: previous.value + (next.value - previous.value) * ratio
    }
  ];
}

function countEventShots(events) {
  const result = {
    homeShots: 0,
    awayShots: 0,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    homeXg: 0,
    awayXg: 0
  };

  events.forEach(event => {
    if (!event.side) return;
    const side = event.side === HOME_CLASS ? "home" : "away";
    if (isShotEvent(event)) result[`${side}Shots`] += 1;
    if (isScoringEvent(event) || event.type === "SAVE") result[`${side}ShotsOnTarget`] += 1;
    result[`${side}Xg`] += event.xg || 0;
  });

  result.homeXg = roundStat(result.homeXg);
  result.awayXg = roundStat(result.awayXg);
  return result;
}

function isShotEvent(event) {
  return isScoringEvent(event) || event.type === "CHANCE" || event.type === "SAVE";
}

function isScoringEvent(event) {
  return event.type === "GOAL" && !event.penaltyShootout;
}

function getEventSide(text, match, penaltyShootout) {
  if (penaltyShootout && match.winner) {
    return match.winner === match.home ? HOME_CLASS : AWAY_CLASS;
  }

  const lower = text.toLowerCase();
  const home = teamName(match.home).toLowerCase();
  const away = teamName(match.away).toLowerCase();
  const homeIndex = lower.indexOf(home);
  const awayIndex = lower.indexOf(away);

  if (homeIndex === -1 && awayIndex === -1) return null;
  if (homeIndex !== -1 && awayIndex === -1) return HOME_CLASS;
  if (awayIndex !== -1 && homeIndex === -1) return AWAY_CLASS;
  return homeIndex <= awayIndex ? HOME_CLASS : AWAY_CLASS;
}

function getEventXg(text, type, penaltyShootout) {
  if (penaltyShootout) return 0;
  if (type === "GOAL") return 0.34;
  if (text.includes("Huge chance")) return 0.32;
  if (text.includes("sharp save")) return 0.21;
  if (text.includes("half chance")) return 0.09;
  if (type === "SAVE") return 0.18;
  if (type === "CHANCE") return 0.12;
  return 0;
}

function eventImpact(event) {
  if (!event.side) return 0;
  if (isScoringEvent(event)) return 0.95;
  if (event.text.includes("Huge chance")) return 0.58;
  if (event.text.includes("sharp save")) return 0.42;
  if (event.text.includes("half chance")) return 0.22;
  if (event.type === "SAVE") return 0.36;
  if (event.type === "CHANCE") return 0.26;
  return 0;
}

function pickNextPhaseSide(rng, currentSide, momentum) {
  if (momentum > 0.7) return rng() < 0.6 ? AWAY_CLASS : HOME_CLASS;
  if (momentum < -0.7) return rng() < 0.6 ? HOME_CLASS : AWAY_CLASS;
  if (rng() < 0.55) return currentSide;
  return currentSide === HOME_CLASS ? AWAY_CLASS : HOME_CLASS;
}

function groupEventsByMinute(events) {
  const buckets = new Map();
  events.forEach(event => {
    const minute = Math.floor(event.replayMinute);
    const bucket = buckets.get(minute) || [];
    bucket.push(event);
    buckets.set(minute, bucket);
  });
  return buckets;
}

function formatClock(minute, timelineEnd) {
  if (minute >= timelineEnd) return timelineEnd > 90 ? "120'" : "90'";
  const rounded = Math.max(0, Math.floor(minute));
  if (rounded <= 90) return `${rounded}'`;
  return `${Math.min(120, rounded)}'`;
}

function parseMinute(text) {
  const match = text.match(/^(\d+)'/);
  return match ? Number(match[1]) : null;
}

function isPenaltyShootoutEvent(text) {
  return text.toLowerCase().includes("penalties");
}

function teamName(team) {
  return team?.name || "Unknown Team";
}

function shortTeamName(team) {
  const name = teamName(team);
  if (name.length <= 13) return name;
  return name.slice(0, 12).trim() + ".";
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function roundStat(value) {
  return Math.max(0, Number(Number(value || 0).toFixed(2)));
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function clampInteger(min, max, value) {
  return Math.round(clamp(min, max, value));
}

function eventPriority(type) {
  if (type === "GOAL") return 0;
  if (type === "CHANCE") return 1;
  if (type === "SAVE") return 2;
  return 3;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function getCurrentMomentum(series) {
  return series.length ? series[series.length - 1].value : 0;
}

function smoothSeries(points) {
  return points.map((point, index) => {
    const prev = points[Math.max(0, index - 1)].value;
    const next = points[Math.min(points.length - 1, index + 1)].value;
    return {
      minute: point.minute,
      value: Number(((prev + point.value * 2 + next) / 4).toFixed(3))
    };
  });
}

function seededRandom(seedText) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) {
    seed = (seed * 31 + seedText.charCodeAt(i)) % 2147483647;
  }
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function randomBetween(rng, min, max) {
  return min + rng() * (max - min);
}

function svgGroup(className) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", className);
  return group;
}

function svgLine(x1, y1, x2, y2, className) {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("class", className);
  return line;
}

function svgText(x, y, text, className) {
  const node = document.createElementNS(SVG_NS, "text");
  node.setAttribute("x", String(x));
  node.setAttribute("y", String(y));
  node.setAttribute("class", className);
  node.textContent = text;
  return node;
}


function installLiveMatchStyles() {
  if (document.getElementById("linearLiveMatchStyles")) return;

  const style = document.createElement("style");
  style.id = "linearLiveMatchStyles";
  style.textContent = `
    .linear-live-sim {
      --live-panel-height: clamp(230px, 34vh, 320px);
      display: grid;
      gap: 7px;
      margin-top: 2px;
    }

    .linear-page:has(> .linear-match-card) {
      padding: 12px 0 !important;
    }

    .linear-match-card {
      gap: 6px !important;
      padding: 10px 14px !important;
    }

    .linear-match-card .eyebrow {
      display: none !important;
    }

    .linear-match-card h1 {
      font-size: clamp(15px, 3.1vw, 21px) !important;
      line-height: 1.2 !important;
      letter-spacing: -0.3px !important;
    }

    .linear-match-card .subtitle {
      margin: 0 !important;
      font-size: 11px !important;
      line-height: 1.3 !important;
    }

    .live-momentum-card,
    .live-stats-panel,
    .live-ticker-card {
      border: 1px solid #ffffff16;
      background: linear-gradient(180deg, #191919, #101311);
      box-shadow: inset 0 1px 0 #ffffff0c, 0 20px 60px #00000040;
    }

    .live-scoreboard {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .live-scoreboard-badge-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .live-scoreboard-board {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      gap: 12px;
      width: min(100%, 460px);
      padding: 14px 16px;
      border-radius: 14px;
      background: linear-gradient(180deg, #0b0f0a, #050704);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.04), inset 0 2px 12px rgba(0,0,0,.55), 0 14px 34px rgba(0,0,0,.4);
    }

    .live-scoreboard-col {
      display: grid;
      gap: 6px;
      min-width: 0;
    }

    .live-scoreboard-col.home { justify-items: end; }
    .live-scoreboard-col.away { justify-items: start; }

    .live-scoreboard-scorers {
      display: grid;
      gap: 2px;
      width: 100%;
    }

    .live-scoreboard-col.home .live-scoreboard-scorers { justify-items: end; }
    .live-scoreboard-col.away .live-scoreboard-scorers { justify-items: start; }

    .live-scoreboard-scorers span {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #f2d68a;
      font-size: 10px;
      font-weight: 700;
      opacity: .9;
    }

    .live-badge {
      display: inline-grid;
      place-items: center;
      min-width: 38px !important;
      padding: 4px 8px !important;
      border-radius: 999px;
      color: #07110d;
      background: #65e58d;
      font-size: 10px !important;
      font-weight: 950;
      letter-spacing: .08em;
    }

    .live-badge.is-live {
      animation: livePulse 1.2s infinite;
    }

    .live-team {
      min-width: 0;
      color: #f4f4f5;
      font-size: clamp(11px, 2vw, 15px) !important;
      font-weight: 900;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .home-team { text-align: right; }
    .away-team { text-align: left; }

    .live-score {
      color: white;
      font-variant-numeric: tabular-nums;
      font-size: clamp(20px, 4vw, 30px) !important;
      font-weight: 950;
      letter-spacing: .02em;
      text-align: center;
      text-shadow: 0 0 14px rgba(101, 229, 141, .3);
    }

    .live-clock {
      color: #f7c95f;
      font-weight: 950;
      font-size: 12px !important;
      min-width: 34px;
      text-align: right;
    }

    .live-progress-track {
      width: min(100%, 460px);
      height: 4px !important;
      border-radius: 999px;
      background: #ffffff12;
      overflow: hidden;
    }

    .live-progress-fill {
      width: 0%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #65e58d, #f7c95f);
      transition: width .16s linear;
    }

    .live-momentum-card {
      display: flex;
      flex-direction: column;
      min-height: calc(var(--live-panel-height) + 46px);
      padding: 7px 9px;
      border-radius: 18px;
    }

    .live-card-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 1px;
      text-align: center;
    }

    .live-card-header h2 {
      margin: 0;
      color: #f4f4f5;
      font-size: clamp(13px, 2.1vw, 17px);
      font-weight: 700;
      letter-spacing: .02em;
    }

    .live-info-dot {
      display: inline-grid;
      place-items: center;
      width: 16px;
      height: 16px;
      border: 1.5px solid #f4f4f5;
      border-radius: 50%;
      color: #f4f4f5;
      font-weight: 900;
      font-size: 10px;
    }

    .live-momentum-subline {
      margin: 0 0 1px;
      color: #a1a1aa;
      text-align: center;
      font-size: 10px;
      line-height: 1.2;
    }

    .live-momentum-svg {
      display: block;
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
      max-height: var(--live-panel-height, 320px);
      overflow: visible;
    }

    .live-grid-line {
      stroke: #ffffff0b;
      stroke-width: 1;
    }

    .live-zero-line {
      stroke: #ffffff26;
      stroke-width: 2;
    }

    .live-minute-marker {
      stroke: #e5e7eb;
      stroke-width: 2.5;
      stroke-dasharray: 6 6;
      opacity: .8;
    }

    .live-momentum-bar.home {
      fill: #22c55e;
      opacity: .78;
    }

    .live-momentum-bar.away {
      fill: #ef4444;
      opacity: .82;
    }

    .live-home-label,
    .live-away-label,
    .live-time-label {
      fill: #d4d4d8;
      font-family: inherit;
      font-weight: 900;
      font-size: 13px;
    }

    .live-home-label { fill: #65e58d; }
    .live-away-label { fill: #ff5d5d; }
    .live-time-label { fill: #a1a1aa; font-size: 11px; }
    .live-time-label.middle { text-anchor: middle; }
    .live-time-label.end { text-anchor: end; }

    .live-goal-ball-icon {
      font-size: 17px;
      text-anchor: middle;
      dominant-baseline: middle;
      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .8));
    }

    .live-stats-panel {
      display: grid;
      gap: 12px;
      padding: 16px clamp(12px, 2.5vw, 22px);
      border-radius: 20px;
    }

    .live-stat-row {
      display: grid;
      grid-template-columns: minmax(56px, 90px) 1fr minmax(56px, 90px);
      align-items: center;
      gap: 12px;
    }

    .live-stat-label {
      color: #f4f4f5;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .02em;
    }

    .live-stat-value {
      justify-self: center;
      min-width: 48px;
      padding: 6px 12px;
      border-radius: 999px;
      color: #f4f4f5;
      background: #ffffff10;
      font-size: 13px;
      font-weight: 950;
      text-align: center;
    }

    .live-stat-home.is-leading {
      color: #06110b;
      background: linear-gradient(90deg, #65e58d, #16c46f);
      box-shadow: 0 10px 24px #22c55e33;
    }

    .live-stat-away.is-leading {
      color: #fff;
      background: linear-gradient(90deg, #ef4444, #b91c1c);
      box-shadow: 0 10px 24px #ef444433;
    }

    .live-ticker-card {
      display: flex;
      flex-direction: column;
      min-height: calc(var(--live-panel-height) + 46px);
      gap: 6px;
      padding: 10px 12px;
      border-radius: 18px;
    }

    .live-ticker-note {
      color: #a1a1aa;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .live-result-banner {
      padding: 7px 12px;
      border-radius: 14px;
      color: #07110d;
      background: linear-gradient(90deg, #65e58d, #f7c95f);
      font-weight: 950;
      font-size: 11.5px;
      line-height: 1.3;
      text-align: center;
    }

    .live-ticker-list {
      display: grid;
      align-content: start;
      gap: 6px;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      padding-right: 4px;
    }

    .live-ticker-empty {
      margin: 0;
      color: #a1a1aa;
      text-align: center;
    }

    .live-ticker-event {
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 8px;
      align-items: start;
      padding: 7px 10px;
      border: 1px solid #ffffff12;
      border-left: 4px solid #71717a;
      border-radius: 12px;
      color: #e5e7eb;
      background: #050807aa;
      font-size: 12px;
      animation: tickerEnter .22s ease-out;
    }

    .live-ticker-event.home { border-left-color: #22c55e; }
    .live-ticker-event.away { border-left-color: #ef4444; }
    .live-ticker-event.goal { border-left-color: #f7c95f; }

    .live-event-minute {
      color: #f7c95f;
      font-weight: 950;
    }

    .live-event-text {
      line-height: 1.3;
    }

    .live-ticker-goal-word,
    .live-ticker-scorer-name {
      color: #f7c95f;
      font-weight: 950;
    }

    .live-controls {
      display: flex !important;
      flex-wrap: nowrap !important;
      align-items: stretch;
      justify-content: center;
      gap: 8px !important;
      padding: 0 !important;
      border: none !important;
      background: none !important;
      box-shadow: none !important;
      border-radius: 0;
      grid-template-columns: none !important;
    }

    .live-controls .live-secondary-btn {
      display: flex !important;
      align-items: center;
      justify-content: center;
      flex: 1.15 1 0 !important;
      min-height: 44px !important;
      border: 1px solid rgba(217, 167, 61, .35);
      border-radius: 999px;
      padding: 0 12px !important;
      font-size: 12px !important;
      color: #f4f4f5;
      background: #ffffff0d;
      font-weight: 700;
      cursor: pointer;
    }

    .live-secondary-btn:disabled,
    .live-continue-btn:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    .live-controls .live-continue-btn {
      display: flex !important;
      align-items: center;
      justify-content: center;
      flex: 1 1 0 !important;
      width: auto !important;
      min-height: 44px !important;
      padding: 0 12px !important;
      font-size: 13px !important;
    }

    .live-continue-btn.ready {
      box-shadow: 0 12px 32px #65e58d33;
    }

    @keyframes livePulse {
      0%, 100% { box-shadow: 0 0 0 0 #65e58d66; }
      50% { box-shadow: 0 0 0 8px #65e58d00; }
    }

    @keyframes tickerEnter {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 360px) {
      .live-badge { min-width: 30px; padding: 3px 6px; font-size: 9px; }
      .live-clock { min-width: 26px; font-size: 11px; }
      .live-team { font-size: 10px; }
    }

    @media (max-width: 720px) {
      .live-stat-row {
        grid-template-columns: 70px 1fr 70px;
        gap: 8px;
      }

      .live-stat-value {
        min-width: 52px;
        padding: 8px 10px;
      }
    }
  `;

  document.head.appendChild(style);
}
