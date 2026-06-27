import { GAME_CONFIG } from "./config.js";
import { FORMATIONS } from "./formations.js";
import { loadPlayersFromCSV } from "./csvLoader.js";
import {
  createTeams,
  createDraftOrder,
  getTeamOnClock,
  getUserDraftPosition,
  selectDraftPool,
  draftPlayer,
  isDraftComplete
} from "./draftRules.js";
import { chooseAIPlayer } from "./aiDraft.js";
import {
  autoPlacePlayer,
  movePlayer,
  resetLineup
} from "./lineup.js";
import {
  showScreen,
  renderLotteryResult,
  renderFormationOptions,
  renderFormationSelect,
  renderDraftHeader,
  renderLastPick,
  renderPositionTabs,
  renderAvailablePlayers,
  renderLineup,
  renderMainViewTabs,
  renderAITeamsPanel
} from "./ui.js";
import {
  createSeason,
  simulateNextMatch,
  continueAfterTactics,
  getTeamStrength
} from "./seasonEngine.js";

let allPlayers = [];
let availablePlayers = [];
let teams = [];
let draftOrder = [];
let currentPick = 0;
let activePosition = "ALL";
let activeMainView = "Player List";
let isPicking = false;
let aiTimer = null;
let currentSeason = null;

const aiSpeedTimes = {
  normal: 650,
  fast: 80,
  instant: 1
};

window.addEventListener("DOMContentLoaded", () => {
  const startDraftBtn = document.getElementById("startDraftBtn");
  const continueToFormationBtn = document.getElementById("continueToFormationBtn");
  const startSeasonBtn = document.getElementById("startSeasonBtn");
  const continueToTacticsBtn = document.getElementById("continueToTacticsBtn");
  const simulateMatchBtn = document.getElementById("simulateMatchBtn");
  const continueAfterTacticsBtn = document.getElementById("continueAfterTacticsBtn");
  const newSeasonBtn = document.getElementById("newSeasonBtn");
  const titleNewSeasonBtn = document.getElementById("titleNewSeasonBtn");

  if (startDraftBtn) {
    startDraftBtn.addEventListener("click", startGame);
  }

  if (continueToFormationBtn) {
    continueToFormationBtn.addEventListener("click", showFormationSelection);
  }

  if (startSeasonBtn) {
    startSeasonBtn.addEventListener("click", handleTacticsConfirmed);
  }

  if (continueToTacticsBtn) {
    continueToTacticsBtn.addEventListener("click", showTacticsSetup);
  }

  if (simulateMatchBtn) {
    simulateMatchBtn.addEventListener("click", simulateOneSeasonMatch);
  }

  if (continueAfterTacticsBtn) {
    continueAfterTacticsBtn.addEventListener("click", handleContinueAfterTactics);
  }

  if (newSeasonBtn) {
    newSeasonBtn.addEventListener("click", restartGame);
  }

  if (titleNewSeasonBtn) {
    titleNewSeasonBtn.addEventListener("click", restartGame);
  }
});

function getAiDelay() {
  const select = document.getElementById("aiSpeedSelect");

  if (!select) {
    return aiSpeedTimes.normal;
  }

  return aiSpeedTimes[select.value] ?? aiSpeedTimes.normal;
}

async function startGame() {
  const btn = document.getElementById("startDraftBtn");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Loading...";
  }

  allPlayers = await loadPlayersFromCSV("players.csv");
  teams = createTeams();
  availablePlayers = selectDraftPool(allPlayers);
  draftOrder = createDraftOrder();

  currentPick = 0;
  activePosition = "ALL";
  activeMainView = "Player List";
  isPicking = false;
  currentSeason = null;

  teams.forEach((team, index) => {
    if (index !== GAME_CONFIG.userTeamIndex) {
      team.formationId = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)].id;
    }
  });

  showScreen("lotteryScreen");
  renderLotteryResult(getUserDraftPosition(draftOrder));
}

function showFormationSelection() {
  showScreen("formationScreen");

  renderFormationOptions(formationId => {
    const userTeam = teams[GAME_CONFIG.userTeamIndex];
    userTeam.formationId = formationId;
    resetLineup(userTeam);
    startDraft();
  });
}

function startDraft() {
  showScreen("draftScreen");
  renderLastPick(null, null);
  runNextPick();
}

function renderDraftLayout() {
  const userTeam = teams[GAME_CONFIG.userTeamIndex];

  renderDraftHeader(
    currentPick,
    GAME_CONFIG.totalTeams,
    GAME_CONFIG.totalRounds,
    teams,
    draftOrder
  );

  renderMainViewTabs(activeMainView, view => {
    activeMainView = view;
    renderDraftLayout();
  });

  renderActiveDraftView(userTeam);
}

function renderActiveDraftView(userTeam) {
  if (activeMainView === "Player List") {
    renderPositionTabs(activePosition, position => {
      activePosition = position;
      activeMainView = "Player List";
      renderDraftLayout();
    });

    renderAvailablePlayers(availablePlayers, activePosition, handleUserPick);
    return;
  }

  if (activeMainView === "My Team") {
    renderFormationSelect("formationSelectDraft", userTeam.formationId, formationId => {
      userTeam.formationId = formationId;
      resetLineup(userTeam);
      renderDraftLayout();
    });

    renderLineup("lineupPitch", userTeam, (playerId, targetSlot) => {
      movePlayer(userTeam, playerId, targetSlot);
      renderDraftLayout();
    });
    return;
  }

  renderAITeamsPanel(teams, GAME_CONFIG.userTeamIndex, draftOrder);
}

function runNextPick() {
  clearTimeout(aiTimer);

  if (isDraftComplete(currentPick, availablePlayers)) {
    finishDraft();
    return;
  }

  const teamIndex = getTeamOnClock(currentPick, draftOrder);
  const team = teams[teamIndex];

  if (teamIndex === GAME_CONFIG.userTeamIndex) {
    isPicking = false;
    activeMainView = "Player List";
    renderDraftLayout();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  renderDraftLayout();

  aiTimer = setTimeout(() => {
    const player = chooseAIPlayer(team, availablePlayers);

    if (!player) {
      finishDraft();
      return;
    }

    availablePlayers = draftPlayer(team, player, availablePlayers);
    autoPlacePlayer(team, player);

    renderLastPick(team.name, player);
    currentPick++;

    runNextPick();
  }, getAiDelay());
}

function handleUserPick(player) {
  if (isPicking) return;

  isPicking = true;

  const userTeam = teams[GAME_CONFIG.userTeamIndex];
  const before = availablePlayers.length;

  availablePlayers = draftPlayer(userTeam, player, availablePlayers);

  if (availablePlayers.length === before) {
    isPicking = false;
    return;
  }

  autoPlacePlayer(userTeam, player);

  renderLastPick(userTeam.name, player);
  currentPick++;

  renderDraftLayout();

  aiTimer = setTimeout(runNextPick, getAiDelay());
}

function finishDraft() {
  clearTimeout(aiTimer);

  currentSeason = createSeason(teams, GAME_CONFIG.userTeamIndex);
  showScreen("divisionScreen");
  renderDivisionDraw(currentSeason);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showTacticsSetup() {
  if (!currentSeason) return;

  const userTeam = teams[GAME_CONFIG.userTeamIndex];
  const moment = currentSeason.tacticsMoment || {
    title: "Tactics",
    message: "Choose the setup you trust for the next match.",
    button: "Lock Tactics"
  };

  document.getElementById("tacticsTitle").textContent = moment.title;
  document.getElementById("tacticsContext").textContent = moment.message;
  document.getElementById("startSeasonBtn").textContent = moment.button;
  showScreen("tacticsScreen");

  renderFormationSelect("formationSelectTactics", userTeam.formationId, formationId => {
    userTeam.formationId = formationId;
    resetLineup(userTeam);
    renderTacticsLineup();
  });

  const playStyleSelect = document.getElementById("playStyleSelect");

  if (playStyleSelect) {
    playStyleSelect.value = userTeam.playStyle || "Balanced";
    playStyleSelect.onchange = e => {
      userTeam.playStyle = e.target.value;
    };
  }

  renderTacticsLineup();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTacticsLineup() {
  const userTeam = teams[GAME_CONFIG.userTeamIndex];

  renderLineup("tacticsLineup", userTeam, (playerId, targetSlot) => {
    movePlayer(userTeam, playerId, targetSlot);
    renderTacticsLineup();
  });
}

function handleTacticsConfirmed() {
  if (!currentSeason) return;

  saveUserTactics();
  continueAfterTactics(currentSeason);

  showScreen("seasonScreen");
  renderSeasonResults(currentSeason);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function simulateOneSeasonMatch() {
  if (!currentSeason) return;

  if (currentSeason.waitingForTactics) {
    showTacticsSetup();
    return;
  }

  saveUserTactics();
  simulateNextMatch(currentSeason);

  if (currentSeason.phase === "COMPLETE" && currentSeason.champion === teams[GAME_CONFIG.userTeamIndex]) {
    renderTitleScreen(currentSeason);
    return;
  }

  showScreen("seasonScreen");
  renderSeasonResults(currentSeason);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleContinueAfterTactics() {
  if (!currentSeason) return;

  showTacticsSetup();
}

function saveUserTactics() {
  const userTeam = teams[GAME_CONFIG.userTeamIndex];
  const playStyleSelect = document.getElementById("playStyleSelect");

  if (playStyleSelect) {
    userTeam.playStyle = playStyleSelect.value;
  }
}

function renderDivisionDraw(season) {
  const text = document.getElementById("divisionDrawText");
  const compass = document.getElementById("divisionCompass");
  const userDivision = season.divisions.find(division =>
    division.teams.includes(season.userTeam)
  );
  const fragment = document.createDocumentFragment();

  if (text && userDivision) {
    text.textContent = `You landed in the ${userDivision.name}. Top four from every division reach the knockouts.`;
  }

  season.divisions.forEach(division => {
    const card = document.createElement("div");
    card.className = `division-card compass-${division.compass}` +
      (division === userDivision ? " user-division" : "");

    const direction = document.createElement("span");
    direction.className = "division-direction";
    direction.textContent = division.name;

    const title = document.createElement("h2");
    title.textContent = `${division.name} Division`;

    const list = document.createElement("div");
    list.className = "division-team-list";

    division.teams.forEach(team => {
      const row = document.createElement("div");
      row.className = "division-team" + (team === season.userTeam ? " own-team" : "");
      row.textContent = team.name;
      list.appendChild(row);
    });

    card.append(direction, title, list);
    fragment.appendChild(card);
  });

  compass.replaceChildren(fragment);
}

function renderSeasonResults(season) {
  const title = document.getElementById("seasonPhaseTitle");
  const subtitle = document.getElementById("seasonSubtitle");

  if (title) {
    title.textContent = getPhaseTitle(season);
  }

  if (subtitle) {
    subtitle.textContent = getSeasonSubtitle(season);
  }

  renderNextMatchCard(season);
  renderLiveMatch(season);
  renderMySchedule(season);
  renderSeasonTables(season);
  updateSeasonButtons(season);
}

function getPhaseTitle(season) {
  if (season.phase === "FIRST_HALF") return "First Half";
  if (season.phase === "SECOND_HALF") return "Second Half";
  if (season.phase === "ROUND_OF_16") return "Round of 16";
  if (season.phase === "QUARTERFINALS") return "Quarterfinals";
  if (season.phase === "SEMIFINALS") return "Semifinals";
  if (season.phase === "FINAL") return "Final";
  if (season.phase === "COMPLETE") return `${season.champion.name} are Champions`;
  return "Season Mode";
}

function getSeasonSubtitle(season) {
  if (season.phase === "COMPLETE") {
    if (season.champion === season.userTeam) {
      return "The trophy is yours. That run was cold-blooded.";
    }

    return season.eliminationReason || "Your campaign is over.";
  }

  if (season.waitingForTactics) {
    return "A tactical window is open. Adjust your setup before the next decisive stretch.";
  }

  if (season.nextMatch) {
    const opponent = season.nextMatch.home === season.userTeam
      ? season.nextMatch.away
      : season.nextMatch.home;
    return `Next opponent: ${opponent.name}. Strength ${getTeamStrength(opponent)}.`;
  }

  return "Follow your own matches live. Other results update around the league.";
}

function renderNextMatchCard(season) {
  const box = document.getElementById("nextMatchCard");

  if (!box) return;

  const card = document.createElement("div");
  card.className = "next-match-card";

  if (season.phase === "COMPLETE") {
    const label = document.createElement("p");
    label.className = "eyebrow";
    label.textContent = "Season Complete";

    const title = document.createElement("h2");
    title.textContent = `${season.champion.name} lift the trophy`;

    card.append(label, title);
    box.replaceChildren(card);
    return;
  }

  if (season.waitingForTactics) {
    const label = document.createElement("p");
    label.className = "eyebrow";
    label.textContent = "Tactical Window";

    const title = document.createElement("h2");
    title.textContent = season.tacticsMoment?.title || "Adjust Tactics";

    const text = document.createElement("p");
    text.textContent = season.tacticsMoment?.message || "Set up before continuing.";

    card.append(label, title, text);
    box.replaceChildren(card);
    return;
  }

  if (!season.nextMatch) {
    card.textContent = "Preparing the next fixture...";
    box.replaceChildren(card);
    return;
  }

  const match = season.nextMatch;
  const label = document.createElement("p");
  label.className = "eyebrow";
  label.textContent = match.round;

  const teamsLine = document.createElement("div");
  teamsLine.className = "versus-line";
  teamsLine.append(
    createTeamStrengthBlock(match.home, match.home === season.userTeam),
    createVersusMarker(),
    createTeamStrengthBlock(match.away, match.away === season.userTeam)
  );

  card.append(label, teamsLine);
  box.replaceChildren(card);
}

function createTeamStrengthBlock(team, isUserTeam) {
  const block = document.createElement("div");
  block.className = "team-strength" + (isUserTeam ? " own-team" : "");

  const name = document.createElement("strong");
  name.textContent = team.name;

  const rating = document.createElement("span");
  rating.textContent = `Strength ${getTeamStrength(team)}`;

  block.append(name, rating);
  return block;
}

function createVersusMarker() {
  const marker = document.createElement("span");
  marker.className = "versus-marker";
  marker.textContent = "VS";
  return marker;
}

function renderLiveMatch(season) {
  const box = document.getElementById("liveMatchCard");

  if (!box) return;

  if (!season.currentMatch) {
    const card = document.createElement("div");
    card.className = "live-match-card";

    const title = document.createElement("h2");
    title.textContent = "Matchday Ready";

    const text = document.createElement("p");
    text.textContent = "Your live match feed will appear here after you play your next fixture.";

    card.append(title, text);
    box.replaceChildren(card);
    return;
  }

  const match = season.currentMatch;
  const card = document.createElement("div");
  card.className = "live-match-card";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = match.round + (match.leg ? " · " + match.leg : "");

  const title = document.createElement("h2");
  title.textContent = `${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name}`;

  const stats = document.createElement("div");
  stats.className = "match-stats";
  stats.append(
    createStatPill("xG", `${formatNumber(match.stats.homeXg)} - ${formatNumber(match.stats.awayXg)}`),
    createStatPill("Shots", `${match.stats.homeShots} - ${match.stats.awayShots}`),
    createStatPill("Momentum", `${match.stats.homeMomentum} - ${match.stats.awayMomentum}`)
  );

  if (match.decidedBy === "PEN" && match.penaltyScore) {
    stats.appendChild(createStatPill("Pens", match.penaltyScore));
  }

  const events = document.createElement("div");
  events.className = "live-events";
  match.events.forEach(event => events.appendChild(createLiveEvent(event)));

  card.append(eyebrow, title, stats, events);
  box.replaceChildren(card);
}

function createStatPill(label, value) {
  const pill = document.createElement("div");
  pill.className = "stat-pill";

  const labelNode = document.createElement("span");
  labelNode.textContent = label;

  const valueNode = document.createElement("strong");
  valueNode.textContent = value;

  pill.append(labelNode, valueNode);
  return pill;
}

function renderMySchedule(season) {
  const box = document.getElementById("mySchedule");

  if (!box) return;

  const wrapper = document.createElement("section");
  wrapper.className = "season-section";

  const heading = createSeasonHeading("My Schedule");
  const card = document.createElement("div");
  card.className = "schedule-card";

  season.userSchedule.forEach(match => {
    card.appendChild(createScheduleRow(season, match));
  });

  wrapper.append(heading, card);
  box.replaceChildren(wrapper);
}

function createScheduleRow(season, match) {
  const row = document.createElement("div");
  const isNext = season.nextMatch?.id === match.id && !season.waitingForTactics;
  const outcome = getScheduleOutcome(season, match);
  row.className = `schedule-row ${outcome}` + (isNext ? " next" : "");

  const meta = document.createElement("span");
  meta.textContent = match.label || match.round;

  const teamsLine = document.createElement("strong");
  teamsLine.textContent = `${match.home.name} vs ${match.away.name}`;

  const result = document.createElement("span");
  result.textContent = getScheduleResultText(match, isNext);

  row.append(meta, teamsLine, result);
  return row;
}

function getScheduleOutcome(season, match) {
  if (match.status !== "played") return "pending";
  if (match.homeGoals === match.awayGoals && !match.winner) return "draw";

  const userWon = match.winner
    ? match.winner === season.userTeam
    : (match.home === season.userTeam && match.homeGoals > match.awayGoals) ||
      (match.away === season.userTeam && match.awayGoals > match.homeGoals);

  return userWon ? "win" : "loss";
}

function getScheduleResultText(match, isNext) {
  if (match.status !== "played") {
    return isNext ? "Next" : "Scheduled";
  }

  const suffix = match.decidedBy === "PEN" ? " pens" : match.decidedBy === "ET" ? " aet" : "";
  return `${match.homeGoals} - ${match.awayGoals}${suffix}`;
}

function renderSeasonTables(season) {
  const box = document.getElementById("seasonResults");

  if (!box) return;

  box.replaceChildren(
    createSeasonHeading("Compass"),
    renderDivisionSnapshot(season),
    createSeasonHeading("Standings"),
    ...renderStandings(season),
    createSeasonHeading("Opponent Results"),
    renderOpponentResults(season),
    createSeasonHeading("Knockouts"),
    renderPlayoffProgress(season)
  );
}

function renderDivisionSnapshot(season) {
  const grid = document.createElement("div");
  grid.className = "season-compass compact-compass";

  season.divisions.forEach(division => {
    const card = document.createElement("div");
    card.className = `mini-division compass-${division.compass}` +
      (division.teams.includes(season.userTeam) ? " user-division" : "");

    const title = document.createElement("strong");
    title.textContent = division.name;

    const teamsText = document.createElement("span");
    teamsText.textContent = division.teams.map(team => team.name).join(", ");

    card.append(title, teamsText);
    grid.appendChild(card);
  });

  return grid;
}

function renderStandings(season) {
  return Object.keys(season.standings).map(groupName => {
    const card = createSeasonCard(groupName);

    season.standings[groupName].forEach((row, index) => {
      card.appendChild(createSeasonRow({
        left: `${index + 1}. ${row.team.name}`,
        right: `${row.points} pts - ${row.goalsFor}:${row.goalsAgainst}`,
        className: [
          index < 4 ? "qualified" : "",
          row.team === season.userTeam ? "user-row" : ""
        ].filter(Boolean).join(" ")
      }));
    });

    return card;
  });
}

function renderOpponentResults(season) {
  const recent = season.opponentResults.slice(0, 8);

  if (!recent.length) {
    return createSeasonCard(null, "No opponent results yet.");
  }

  const card = createSeasonCard();

  recent.forEach(match => {
    card.appendChild(createSeasonRow({
      left: match.home.name,
      center: `${match.homeGoals} - ${match.awayGoals}`,
      right: match.away.name,
      className: "match-row"
    }));
  });

  return card;
}

function renderPlayoffProgress(season) {
  const playoffRounds = season.knockoutRounds.filter(round =>
    round.results.some(Boolean)
  );

  if (!playoffRounds.length) {
    return createSeasonCard(null, "Knockouts have not started yet.");
  }

  const card = createSeasonCard();

  playoffRounds.forEach(round => {
    const roundTitle = document.createElement("h3");
    roundTitle.textContent = round.label;
    card.appendChild(roundTitle);

    round.results.filter(Boolean).forEach(match => {
      card.appendChild(createSeasonRow({
        left: match.winner ? `${match.winner.name} advance` : match.round,
        right: `${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name}`
      }));
    });
  });

  return card;
}

function createLiveEvent(event) {
  const row = document.createElement("div");
  row.className = `live-event ${event.type.toLowerCase()}`;
  row.textContent = event.text;
  return row;
}

function createSeasonHeading(text) {
  const heading = document.createElement("h2");
  heading.textContent = text;
  return heading;
}

function createSeasonCard(titleText = null, emptyText = null) {
  const card = document.createElement("div");
  card.className = "season-card";

  if (titleText) {
    const title = document.createElement("h3");
    title.textContent = titleText;
    card.appendChild(title);
  }

  if (emptyText) {
    card.textContent = emptyText;
  }

  return card;
}

function createSeasonRow({ left, center = null, right, className = "" }) {
  const row = document.createElement("div");
  row.className = className ? `season-row ${className}` : "season-row";

  const leftNode = document.createElement("strong");
  leftNode.textContent = left;
  row.appendChild(leftNode);

  if (center !== null) {
    const centerNode = document.createElement("span");
    centerNode.textContent = center;
    row.appendChild(centerNode);
  }

  const rightNode = document.createElement("span");
  rightNode.textContent = right;
  row.appendChild(rightNode);

  return row;
}

function updateSeasonButtons(season) {
  const simulateBtn = document.getElementById("simulateMatchBtn");
  const tacticsBtn = document.getElementById("continueAfterTacticsBtn");
  const newSeasonBtn = document.getElementById("newSeasonBtn");

  if (simulateBtn) {
    simulateBtn.textContent = season.nextMatch
      ? `Play ${season.nextMatch.round}`
      : "Play Next Match";
    simulateBtn.classList.toggle(
      "hidden",
      season.waitingForTactics || season.phase === "COMPLETE"
    );
  }

  if (tacticsBtn) {
    tacticsBtn.textContent = "Adjust Tactics";
    tacticsBtn.classList.toggle(
      "hidden",
      !season.waitingForTactics || season.phase === "COMPLETE"
    );
  }

  if (newSeasonBtn) {
    newSeasonBtn.classList.toggle("hidden", season.phase !== "COMPLETE");
  }
}

function renderTitleScreen(season) {
  const summary = document.getElementById("titleSummary");
  const cardBox = document.getElementById("titleMatchCard");
  const final = season.currentMatch;

  if (summary) {
    summary.textContent = `Your ${season.userSchedule.length}-match journey ends with the trophy.`;
  }

  if (cardBox && final) {
    const card = document.createElement("div");
    card.className = "title-match-card";

    const label = document.createElement("p");
    label.className = "eyebrow";
    label.textContent = final.round;

    const score = document.createElement("h2");
    score.textContent = `${final.home.name} ${final.homeGoals} - ${final.awayGoals} ${final.away.name}`;

    const text = document.createElement("p");
    text.textContent = final.decidedBy === "PEN"
      ? `Won on penalties: ${final.penaltyScore}.`
      : "A title-winning performance when it mattered most.";

    card.append(label, score, text);
    cardBox.replaceChildren(card);
  }

  showScreen("titleScreen");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatNumber(value) {
  return Number(value || 0).toFixed(1);
}

function restartGame() {
  window.location.href = window.location.pathname + "?v=" + Date.now();
}
