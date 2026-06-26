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
import { createSeason, simulateNextPhase } from "./seasonEngine.js";

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
  fast: 180,
  instant: 25
};

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startDraftBtn").addEventListener("click", startGame);
  document.getElementById("continueToFormationBtn").addEventListener("click", showFormationSelection);

  const startSeasonBtn = document.getElementById("startSeasonBtn");
  const continueSeasonBtn = document.getElementById("continueSeasonBtn");
  const newSeasonBtn = document.getElementById("newSeasonBtn");

  if (startSeasonBtn) {
    startSeasonBtn.addEventListener("click", startSeason);
  }

  if (continueSeasonBtn) {
    continueSeasonBtn.addEventListener("click", continueSeason);
  }

  if (newSeasonBtn) {
    newSeasonBtn.addEventListener("click", () => {
      window.location.href = window.location.pathname + "?v=" + Date.now();
    });
  }
});

function getAiDelay() {
  const select = document.getElementById("aiSpeedSelect");
  return aiSpeedTimes[select.value] ?? aiSpeedTimes.normal;
}

async function startGame() {
  const btn = document.getElementById("startDraftBtn");
  btn.disabled = true;
  btn.textContent = "Loading...";

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

  renderFormationSelect("formationSelectDraft", userTeam.formationId, formationId => {
    userTeam.formationId = formationId;
    resetLineup(userTeam);
    renderDraftLayout();
  });

  renderLineup("lineupPitch", userTeam, (playerId, targetSlot) => {
    movePlayer(userTeam, playerId, targetSlot);
    renderDraftLayout();
  });

  renderPositionTabs(activePosition, position => {
    activePosition = position;
    activeMainView = "Player List";
    renderDraftLayout();
  });

  renderAvailablePlayers(availablePlayers, activePosition, handleUserPick);
  renderAITeamsPanel(teams, GAME_CONFIG.userTeamIndex, draftOrder);
}

function runNextPick() {
  clearTimeout(aiTimer);

  if (isDraftComplete(currentPick, availablePlayers)) {
    finishDraft();
    return;
  }

  renderDraftLayout();

  const teamIndex = getTeamOnClock(currentPick, draftOrder);
  const team = teams[teamIndex];

  if (teamIndex === GAME_CONFIG.userTeamIndex) {
    isPicking = false;
    activeMainView = "Player List";
    renderDraftLayout();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

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

    renderDraftLayout();
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

  const userTeam = teams[GAME_CONFIG.userTeamIndex];

  showScreen("tacticsScreen");

  renderFormationSelect("formationSelectTactics", userTeam.formationId, formationId => {
    userTeam.formationId = formationId;
    resetLineup(userTeam);
    renderTacticsLineup();
  });

  document.getElementById("playStyleSelect").onchange = e => {
    userTeam.playStyle = e.target.value;
  };

  renderTacticsLineup();
}

function renderTacticsLineup() {
  const userTeam = teams[GAME_CONFIG.userTeamIndex];

  renderLineup("tacticsLineup", userTeam, (playerId, targetSlot) => {
    movePlayer(userTeam, playerId, targetSlot);
    renderTacticsLineup();
  });
}

function startSeason() {
  saveUserTactics();

  currentSeason = createSeason(teams);

  showScreen("seasonScreen");
  continueSeason();
}

function continueSeason() {
  if (!currentSeason) return;

  saveUserTactics();

  simulateNextPhase(currentSeason);
  renderSeasonResults(currentSeason);

  const continueBtn = document.getElementById("continueSeasonBtn");
  const newSeasonBtn = document.getElementById("newSeasonBtn");

  if (currentSeason.phase === "COMPLETE") {
    continueBtn.classList.add("hidden");
    newSeasonBtn.classList.remove("hidden");
  } else {
    continueBtn.classList.remove("hidden");
    newSeasonBtn.classList.add("hidden");
    continueBtn.textContent = "Continue Season";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveUserTactics() {
  const userTeam = teams[GAME_CONFIG.userTeamIndex];
  const playStyleSelect = document.getElementById("playStyleSelect");

  if (playStyleSelect) {
    userTeam.playStyle = playStyleSelect.value;
  }
}

function renderSeasonResults(season) {
  document.getElementById("seasonPhaseTitle").textContent = getPhaseTitle(season.phase);

  const box = document.getElementById("seasonResults");

  box.innerHTML = `
    <h2>Latest Matches</h2>
    ${renderLatestMatches(season)}

    <h2>Standings</h2>
    ${renderStandings(season)}

    <h2>Playoffs</h2>
    ${renderPlayoffs(season)}
  `;
}

function getPhaseTitle(phase) {
  if (phase === "GROUP_SECOND_HALF") return "Group Stage: First Half Complete";
  if (phase === "ROUND_OF_16") return "Group Stage Complete";
  if (phase === "QUARTERFINALS") return "Round of 16 Complete";
  if (phase === "SEMIFINALS") return "Quarterfinals Complete";
  if (phase === "FINAL") return "Semifinals Complete";
  if (phase === "COMPLETE") return "Champion Crowned";
  return "Season Mode";
}

function renderLatestMatches(season) {
  const latest = season.playedMatches.slice(-20);

  if (!latest.length && !season.playoffRounds.length) {
    return `<div class="season-card">No matches played yet.</div>`;
  }

  const groupMatches = latest.map(match => `
    <div class="season-row">
      <strong>${match.home.name}</strong>
      <span>${match.homeGoals} - ${match.awayGoals}</span>
      <strong>${match.away.name}</strong>
    </div>
  `).join("");

  return `<div class="season-card">${groupMatches}</div>`;
}

function renderStandings(season) {
  return Object.keys(season.standings).map(groupName => `
    <div class="season-card">
      <h3>${groupName}</h3>
      ${season.standings[groupName].map((row, index) => `
        <div class="season-row ${index < 4 ? "qualified" : ""}">
          <strong>${index + 1}. ${row.team.name}</strong>
          <span>${row.points} pts · ${row.goalsFor}:${row.goalsAgainst}</span>
        </div>
      `).join("")}
    </div>
  `).join("");
}

function renderPlayoffs(season) {
  if (!season.playoffRounds.length) {
    return `<div class="season-card">Playoffs have not started yet.</div>`;
  }

  return season.playoffRounds.map(round => `
    <div class="season-card">
      <h3>${round.name}</h3>
      ${round.ties.map(tie => {
        if (round.name === "Final") {
          return `
            <div class="season-row qualified">
              <strong>${tie.teamA.name}</strong>
              <span>${tie.match.homeGoals} - ${tie.match.awayGoals}</span>
              <strong>${tie.teamB.name}</strong>
            </div>
            <p>Winner: <strong>${tie.winner.name}</strong></p>
          `;
        }

        return `
          <div class="season-row">
            <strong>${tie.teamA.name}</strong>
            <span>${tie.teamAGoals} - ${tie.teamBGoals}</span>
            <strong>${tie.teamB.name}</strong>
          </div>
          <p>Winner: <strong>${tie.winner.name}</strong></p>
        `;
      }).join("")}
    </div>
  `).join("");
}