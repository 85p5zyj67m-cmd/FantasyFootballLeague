import { GAME_CONFIG } from "../config.js";
import { FORMATIONS } from "../formations.js?v=detailed-formations-3";
import {
  draftPlayer,
  getPickInRound,
  getRound,
  getTeamOnClock,
  getVisiblePlayers
} from "../draftRules.js";
import { autoPlacePlayer } from "../lineup.js?v=strict-cdm-1";
import { getDisplayPosition } from "../playerUtils.js?v=strict-cdm-1";
import {
  canPlayerBeDraftedForFormation,
  canSelectFormationDuringDraft,
  getDraftFormationStatus,
  getMissingPositionSummary
} from "../draftFormationConstraints.js?v=formation-draft-constraints-1";
import { appState, userTeam } from "./linearState.js";
import { goTo } from "./linearRouter.js?v=formation-draft-constraints-1";
import { playerCard } from "./pageUtils.js?v=formation-draft-constraints-1";

let observer = null;
let queued = false;
let lastSignature = "";

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
  const signature = createSignature();
  if (signature === lastSignature) return;
  lastSignature = signature;

  updateDraftStatusPanel();
  updateDraftPlayerCards();
  updateRequiredPickPanel();
  updateFormationSelects();
  updateFormationButtons();
}

function updateDraftStatusPanel() {
  const page = document.querySelector(".linear-draft-page");
  const listView = document.querySelector(".linear-player-list-view");
  if (!page || !listView) return;

  const old = listView.querySelector(".draft-formation-status");
  if (old) old.remove();

  const team = userTeam();
  const status = getDraftFormationStatus(team, team.formationId);
  const panel = document.createElement("div");
  panel.className = status.locked ? "draft-formation-status locked" : "draft-formation-status";

  const title = document.createElement("strong");
  title.textContent = `Formation target: ${getFormationName(team.formationId)} (${status.drafted}/${GAME_CONFIG.totalRounds})`;

  const body = document.createElement("span");
  body.textContent = status.complete
    ? "Your selected formation can already be filled. Extra picks are bench depth."
    : `Missing XI slots: ${getMissingPositionSummary(team, team.formationId)}. Picks left: ${status.remaining}.`;

  panel.append(title, body);

  const filters = listView.querySelector(".linear-tabs");
  if (filters) filters.insertAdjacentElement("afterend", panel);
  else listView.prepend(panel);
}

function updateDraftPlayerCards() {
  const cards = Array.from(document.querySelectorAll(".draft-list-player-card"));
  if (!cards.length) return;

  const isUserTurn = getCurrentTeam() === userTeam();
  const team = userTeam();
  const visiblePlayers = getCurrentVisiblePlayers();

  cards.forEach((card, index) => {
    const player = resolveCardPlayer(card, index, visiblePlayers);
    if (!player) return;

    const legal = !isUserTurn || canPlayerBeDraftedForFormation(team, player, team.formationId);
    card.dataset.playerId = player.id;
    card.classList.toggle("formation-draft-locked", !legal && isUserTurn);
    card.disabled = !isUserTurn || !legal;
    card.title = legal
      ? ""
      : `Cannot draft this player and still complete ${getFormationName(team.formationId)} in 16 picks.`;
  });
}

function updateRequiredPickPanel() {
  const listView = document.querySelector(".linear-player-list-view");
  if (!listView) return;

  const old = listView.querySelector(".draft-required-picks-panel");
  if (old) old.remove();

  if (getCurrentTeam() !== userTeam()) return;

  const visiblePlayers = getCurrentVisiblePlayers();
  const legalVisible = visiblePlayers.some(player => canPlayerBeDraftedForFormation(userTeam(), player, userTeam().formationId));
  if (legalVisible) return;

  const candidates = getLegalRequiredCandidates().slice(0, 8);
  if (!candidates.length) return;

  const panel = document.createElement("section");
  panel.className = "draft-required-picks-panel";

  const title = document.createElement("strong");
  title.textContent = "Required Picks";

  const note = document.createElement("p");
  note.textContent = "No legal pick is visible on the current board, so these formation-required players were pulled from the full draft pool.";

  const grid = document.createElement("div");
  grid.className = "linear-player-grid draft-required-picks-grid";

  candidates.forEach(player => {
    const card = playerCard(player, () => pickRequiredPlayer(player));
    card.classList.add("draft-required-pick-card");
    grid.appendChild(card);
  });

  panel.append(title, note, grid);

  const normalGrid = listView.querySelector(".linear-player-grid");
  if (normalGrid) normalGrid.insertAdjacentElement("beforebegin", panel);
  else listView.appendChild(panel);
}

function getLegalRequiredCandidates() {
  return (appState.availablePlayers || [])
    .filter(player => canPlayerBeDraftedForFormation(userTeam(), player, userTeam().formationId))
    .sort((a, b) => b.overall - a.overall);
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

  const isUserTurn = getCurrentTeam() === userTeam();
  if (!isUserTurn) return;

  const cards = Array.from(document.querySelectorAll(".draft-list-player-card"));
  const visiblePlayers = getCurrentVisiblePlayers();
  const player = resolveCardPlayer(card, cards.indexOf(card), visiblePlayers);
  if (!player) return;

  if (canPlayerBeDraftedForFormation(userTeam(), player, userTeam().formationId)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  card.classList.add("formation-draft-locked");
  card.disabled = true;
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

function createSignature() {
  const team = userTeam();
  const cards = Array.from(document.querySelectorAll(".draft-list-player-card"));
  const cardText = cards.map(card => `${card.dataset.playerId || ""}:${card.textContent}`).join("|");
  const formationOptions = Array.from(document.querySelectorAll(".formation-option-btn[data-formation-id], .my-team-formation-selector select"))
    .map(item => item.dataset?.formationId || item.value || "select")
    .join("|");

  return JSON.stringify({
    route: Boolean(document.querySelector(".linear-draft-page")),
    teamPlayers: (team?.players || []).map(player => player.id).join("|"),
    formationId: team?.formationId,
    currentPick: appState.currentPick,
    activeView: appState.activeDraftView,
    activePosition: appState.activePosition,
    cardText,
    formationOptions,
    legalCandidates: getLegalRequiredCandidates().slice(0, 8).map(player => player.id).join("|")
  });
}

function installConstraintStyles() {
  if (document.getElementById("draft-formation-constraint-styles")) return;

  const style = document.createElement("style");
  style.id = "draft-formation-constraint-styles";
  style.textContent = `
    .draft-formation-status,
    .draft-required-picks-panel {
      display: grid;
      gap: 4px;
      margin: 10px 0 14px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(110, 255, 160, 0.22);
      background: rgba(6, 18, 13, 0.62);
      color: #d9ffe4;
      font-size: 12px;
    }
    .draft-formation-status.locked,
    .draft-required-picks-panel {
      border-color: rgba(255, 216, 112, 0.42);
      box-shadow: 0 0 18px rgba(255, 216, 112, 0.08);
    }
    .draft-required-picks-panel > strong {
      color: #ffe5a0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .draft-required-picks-panel p {
      margin: 0 0 8px;
      opacity: 0.84;
    }
    .draft-list-player-card.formation-draft-locked,
    .formation-option-btn.formation-draft-locked {
      opacity: 0.34 !important;
      filter: grayscale(1);
      cursor: not-allowed !important;
      box-shadow: none !important;
    }
    .draft-required-pick-card {
      border-color: rgba(255, 216, 112, 0.52) !important;
      box-shadow: 0 0 20px rgba(255, 216, 112, 0.12) !important;
    }
  `;
  document.head.appendChild(style);
}
