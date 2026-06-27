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
  continueAfterTactics
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
  fast: 180,
  instant: 25
};

window.addEventListener("DOMContentLoaded", () => {
  const startDraftBtn = document.getElementById("startDraftBtn");
  const continueToFormationBtn = document.getElementById("continueToFormationBtn");
  const startSeasonBtn = document.getElementById("startSeasonBtn");
  const simulateMatchBtn = document.getElementById("simulateMatchBtn");
  const continueAfterTacticsBtn = document.getElementById("continueAfterTacticsBtn");
  const newSeasonBtn = document.getElementById("newSeasonBtn");

  if (startDraftBtn) {
    startDraftBtn.addEventListener("click", startGame);
  }

  if (continueToFormationBtn) {
    continueToFormationBtn.addEventListener("click", showFormationSelection);
  }

  if (startSeasonBtn) {
    startSeasonBtn.addEventListener("click", startSeason);
  }

  if (simulateMatchBtn) {
    simulateMatchBtn.addEventListener("click", simulateOneSeasonMatch);
  }

  if (continueAfterTacticsBtn) {
    continueAfterTacticsBtn.addEventListener("click", handleContinueAfterTactics);
  }

  if (newSeasonBtn) {
    newSeasonBtn.addEventListener("click", () => {
      window.location.href = window.location.pathname + "?v=" + Date.now();
    });
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

  const playStyleSelect = document.getElementById("playStyleSelect");

  if (playStyleSelect) {
    playStyleSelect.onchange = e => {
      userTeam.playStyle = e.target.value;
    };
  }

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

  currentSeason = createSeason(teams, GAME_CONFIG.userTeamIndex);

  showScreen("seasonScreen");
  renderSeasonResults(currentSeason);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function simulateOneSeasonMatch() {
  if (!currentSeason) return;

  saveUserTactics();
  simulateNextMatch(currentSeason);
  renderSeasonResults(currentSeason);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleContinueAfterTactics() {
  if (!currentSeason) return;

  saveUserTactics();
  continueAfterTactics(currentSeason);
  renderSeasonResults(currentSeason);

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
  const title = document.getElementById("seasonPhaseTitle");

  if (title) {
    title.textContent = getPhaseTitle(season);
  }

  renderLiveMatch(season);
  renderSeasonTables(season);
  updateSeasonButtons(season);
}

function getPhaseTitle(season) {
  if (season.phase === "GROUP_FIRST_HALF") return "Group Stage: First Half";
  if (season.phase === "GROUP_SECOND_HALF") return "Group Stage: Second Half";
  if (season.phase === "ROUND_OF_16") return "Round of 16";
  if (season.phase === "QUARTERFINALS") return "Quarterfinals";
  if (season.phase === "SEMIFINALS") return "Semifinals";
  if (season.phase === "FINAL") return "Final";
  if (season.phase === "COMPLETE") return `${season.champion.name} are Champions`;
  return "Season Mode";
}

function renderLiveMatch(season) {
  const box = document.getElementById("liveMatchCard");

  if (!box) return;

  if (!season.currentMatch) {
    box.innerHTML = `
      <div class="live-match-card">
        <h2>Ready</h2>
        <p>Press simulate to play the next match live.</p>
      </div>
    `;
    return;
  }

  const match = season.currentMatch;

  box.innerHTML = `
    <div class="live-match-card">
      <p class="eyebrow">${match.round}${match.leg ? " · " + match.leg : ""}</p>
      <h2>${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name}</h2>

      <div class="live-events">
        ${match.events.map(event => `
          <div class="live-event ${event.type.toLowerCase()}">
            ${event.text}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSeasonTables(season) {
  const box = document.getElementById("seasonResults");

  if (!box) return;

  box.innerHTML = `
    <h2>Standings</h2>
    ${renderStandings(season)}

    <h2>Recent Results</h2>
    ${renderRecentResults(season)}

    <h2>Playoff Progress</h2>
    ${renderPlayoffProgress(season)}
  `;
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

function renderRecentResults(season) {
  const recent = season.matchHistory.slice(-8);

  if (!recent.length) {
    return `<div class="season-card">No matches played yet.</div>`;
  }

  return `
    <div class="season-card">
      ${recent.map(match => `
        <div class="season-row match-row">
          <strong>${match.home.name}</strong>
          <span>${match.homeGoals} - ${match.awayGoals}</span>
          <strong>${match.away.name}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPlayoffProgress(season) {
  const playoffMatches = season.matchHistory.filter(match =>
    match.type === "PLAYOFF" || match.type === "FINAL"
  );

  if (!playoffMatches.length) {
    return `<div class="season-card">Playoffs have not started yet.</div>`;
  }

  return `
    <div class="season-card">
      ${playoffMatches.map(match => `
        <div class="season-row">
          <strong>${match.round} · ${match.leg}</strong>
          <span>${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function updateSeasonButtons(season) {
  const simulateBtn = document.getElementById("simulateMatchBtn");
  const tacticsBtn = document.getElementById("continueAfterTacticsBtn");
  const newSeasonBtn = document.getElementById("newSeasonBtn");

  if (simulateBtn) {
    simulateBtn.classList.toggle(
      "hidden",
      season.waitingForTactics || season.phase === "COMPLETE"
    );
  }

  if (tacticsBtn) {
    tacticsBtn.classList.toggle(
      "hidden",
      !season.waitingForTactics || season.phase === "COMPLETE"
    );
  }

  if (newSeasonBtn) {
    newSeasonBtn.classList.toggle("hidden", season.phase !== "COMPLETE");
  }
}
