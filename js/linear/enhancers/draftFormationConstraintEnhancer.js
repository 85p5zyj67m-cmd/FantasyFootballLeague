import { FORMATIONS } from "../../formations.js?v=detailed-formations-3";
import {
  draftPlayer,
  getPickInRound,
  getRound,
  getTeamOnClock,
  getVisiblePlayers
} from "../../draftRules.js";
import { autoPlacePlayer } from "../../lineup.js?v=strict-cdm-1";
import { getDisplayPosition } from "../../playerUtils.js?v=strict-cdm-1";
import {
  canPlayerBeDraftedForFormation,
  canSelectFormationDuringDraft
} from "../../draftFormationConstraints.js?v=draft-constraint-perf-1";
import { appState, userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js?v=page-flow-polish-1";

let observer = null;
let queued = false;
let lastSignature = "";
let pendingAutopick = false;

export function installDraftFormationConstraintEnhancer() {
  if (observer) return;

  installConstraintStyles();
  document.addEventListener("click", guardIllegalDraftPick, true);

  const app = document.getElementById("app");
  if (!app) return;

  observer = new MutationObserver(queueEnhancement);
  observer.observe(app, { childList: true, subtree: true });

  window.addEventListener("change", queueEnhancement, true);
  queueEnhancement();
}

function queueEnhancement() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    applyDraftFormationConstraints();
  });
}

function applyDraftFormationConstraints() {
  if (!document.querySelector(".linear-draft-page")) {
    lastSignature = "";
    return;
  }

  const signature = createLightSignature();
  if (signature === lastSignature) return;
  lastSignature = signature;

  const isUserTurn = getCurrentTeam() === userTeam();

  removeDraftStatusPanel();

  if (!isUserTurn) {
    clearDraftPlayerLocks();
    return;
  }

  updateDraftPlayerCards();
  maybeAutoPickRequiredPlayer();
  updateFormationSelects();
  updateFormationButtons();
}

function removeDraftStatusPanel() {
  document.querySelectorAll(".draft-formation-status").forEach(panel => panel.remove());
}

function updateDraftPlayerCards() {
  const cards = Array.from(document.querySelectorAll(".linear-player-list-view .draft-list-player-card"));
  if (!cards.length) return;

  const team = userTeam();
  const visiblePlayers = getCurrentVisiblePlayers();

  cards.forEach((card, index) => {
    const player = resolveCardPlayer(card, index, visiblePlayers);
    if (!player) return;

    const legal = canPlayerBeDraftedForFormation(team, player, team.formationId);
    card.dataset.playerId = player.id;
    card.classList.toggle("formation-draft-locked", !legal);
    card.disabled = !legal;
    card.title = legal
      ? ""
      : `Cannot draft this player and still complete ${getFormationName(team.formationId)} in 16 picks.`;
  });
}

function maybeAutoPickRequiredPlayer() {
  if (pendingAutopick) return;
  if (!document.querySelector(".linear-player-list-view")) return;
  if (getCurrentTeam() !== userTeam()) return;

  const visiblePlayers = getCurrentVisiblePlayers();
  const legalVisible = visiblePlayers.some(player => canPlayerBeDraftedForFormation(userTeam(), player, userTeam().formationId));
  if (legalVisible) return;

  const candidates = getLegalRequiredCandidates();
  if (!candidates.length) return;

  pendingAutopick = true;
  const player = candidates[Math.floor(Math.random() * candidates.length)];

  window.setTimeout(() => {
    pickRequiredPlayer(player);
    pendingAutopick = false;
  }, 120);
}

function getLegalRequiredCandidates() {
  return (appState.availablePlayers || [])
    .filter(player => canPlayerBeDraftedForFormation(userTeam(), player, userTeam().formationId));
}

function pickRequiredPlayer(player) {
  if (!player) return;
  if (getCurrentTeam() !== userTeam()) return;
  if (!canPlayerBeDraftedForFormation(userTeam(), player, userTeam().formationId)) return;

  const team = userTeam();
  const round = getRound(appState.currentPick);
  const pickInRound = getPickInRound(appState.currentPick) + 1;

  appState.availablePlayers = draftPlayer(team, player, appState.availablePlayers);
  autoPlacePlayer(team, player);
  appState.draftLog.push({
    round,
    pickInRound,
    teamName: team.name,
    playerName: player.name,
    position: getDisplayPosition(player),
    overall: player.overall
  });
  appState.currentPick += 1;
  goTo("page04");
}

function updateFormationSelects() {
  const team = userTeam();
  document.querySelectorAll(".my-team-formation-selector select").forEach(select => {
    Array.from(select.options).forEach(option => {
      const legal = canSelectFormationDuringDraft(team, option.value);
      option.disabled = !legal;
      const formation = FORMATIONS.find(item => item.id === option.value);
      option.textContent = legal ? formation?.name || option.value : `${formation?.name || option.value} (locked)`;
    });
  });
}

function updateFormationButtons() {
  const team = userTeam();
  document.querySelectorAll(".formation-option-btn[data-formation-id]").forEach(button => {
    const formationId = button.dataset.formationId;
    const legal = canSelectFormationDuringDraft(team, formationId);
    button.classList.toggle("formation-draft-locked", !legal);
    button.disabled = !legal;
    button.title = legal
      ? ""
      : "This formation can no longer be completed with your current squad and remaining picks.";
  });
}

function guardIllegalDraftPick(event) {
  const card = event.target?.closest?.(".draft-list-player-card");
  if (!card) return;
  if (!document.querySelector(".linear-player-list-view")) return;
  if (getCurrentTeam() !== userTeam()) return;

  const cards = Array.from(document.querySelectorAll(".linear-player-list-view .draft-list-player-card"));
  const visiblePlayers = getCurrentVisiblePlayers();
  const player = resolveCardPlayer(card, cards.indexOf(card), visiblePlayers);
  if (!player) return;

  if (canPlayerBeDraftedForFormation(userTeam(), player, userTeam().formationId)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  card.classList.add("formation-draft-locked");
  card.disabled = true;
}

function clearDraftPlayerLocks() {
  document.querySelectorAll(".draft-list-player-card.formation-draft-locked").forEach(card => {
    card.classList.remove("formation-draft-locked");
    card.title = "";
  });
  removeDraftStatusPanel();
}

function resolveCardPlayer(card, index, visiblePlayers) {
  const explicitId = card.dataset.playerId;
  if (explicitId) {
    const explicit = findAvailablePlayer(explicitId);
    if (explicit) return explicit;
  }

  return visiblePlayers[index] || null;
}

function getCurrentVisiblePlayers() {
  return getVisiblePlayers(appState.availablePlayers || [], appState.activePosition || "ALL");
}

function getCurrentTeam() {
  const activeIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
  return appState.teams[activeIndex];
}

function findAvailablePlayer(playerId) {
  return (appState.availablePlayers || []).find(player => String(player.id) === String(playerId));
}

function getFormationName(formationId) {
  return FORMATIONS.find(formation => formation.id === formationId)?.name || formationId || "Formation";
}

function createLightSignature() {
  const team = userTeam();
  const activeTeam = getCurrentTeam();
  const visibleCardCount = document.querySelectorAll(".linear-player-list-view .draft-list-player-card").length;
  const hasFormationControls = Boolean(document.querySelector(".formation-option-btn[data-formation-id], .my-team-formation-selector select"));

  return JSON.stringify({
    userTurn: activeTeam === team,
    teamPlayers: (team?.players || []).map(player => player.id).join("|"),
    formationId: team?.formationId,
    currentPick: appState.currentPick,
    activeView: appState.activeDraftView,
    activePosition: appState.activePosition,
    visibleCardCount,
    hasFormationControls
  });
}

function installConstraintStyles() {
  if (document.getElementById("draft-formation-constraint-styles")) return;

  const style = document.createElement("style");
  style.id = "draft-formation-constraint-styles";
  style.textContent = `
    .draft-formation-status {
      display: none !important;
    }
    .draft-list-player-card.formation-draft-locked,
    .formation-option-btn.formation-draft-locked {
      opacity: 0.34 !important;
      filter: grayscale(1);
      cursor: not-allowed !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
}
