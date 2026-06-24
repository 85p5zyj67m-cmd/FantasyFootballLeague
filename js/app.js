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

let allPlayers = [];
let availablePlayers = [];
let teams = [];
let draftOrder = [];
let currentPick = 0;
let activePosition = "ALL";
let activeMainView = "Player List";
let isPicking = false;
let aiTimer = null;

const aiSpeedTimes = {
  normal: 650,
  fast: 180,
  instant: 25
};

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startDraftBtn").addEventListener("click", startGame);
  document.getElementById("continueToFormationBtn").addEventListener("click", showFormationSelection);
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
