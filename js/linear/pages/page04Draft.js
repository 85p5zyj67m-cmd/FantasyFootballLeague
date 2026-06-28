import { GAME_CONFIG } from "../../config.js";
import { chooseAIPlayer } from "../../aiDraft.js";
import {
  draftPlayer,
  getTeamOnClock,
  getVisiblePlayers,
  isDraftComplete
} from "../../draftRules.js";
import { appState, userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, pageShell, playerCard, primaryButton } from "../pageUtils.js";

export function renderPage04Draft() {
  if (isDraftComplete(appState.currentPick, appState.availablePlayers)) {
    goTo("page05");
    return;
  }

  const app = clearApp();
  const round = Math.floor(appState.currentPick / GAME_CONFIG.totalTeams) + 1;
  const teamIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
  const team = appState.teams[teamIndex];
  const isUser = team === userTeam();

  const { section, card } = pageShell({
    eyebrow: "Page 4",
    title: "Draft",
    subtitle: `Round ${round}. On the clock: ${team.name}`
  });

  const roster = document.createElement("p");
  roster.className = "subtitle";
  roster.textContent = `Your squad: ${userTeam().players.length} players`;
  card.appendChild(roster);

  if (!isUser) {
    card.appendChild(primaryButton("Run AI Pick", () => runAiPick(team)));
  } else {
    renderUserDraftBoard(card);
  }

  app.appendChild(section);
}

function renderUserDraftBoard(card) {
  const tabs = document.createElement("div");
  tabs.className = "linear-tabs";
  ["ALL", "ATT", "MID", "DEF", "GK"].forEach(position => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "primary-btn linear-tab-btn";
    btn.textContent = position;
    btn.addEventListener("click", () => {
      appState.activePosition = position;
      renderPage04Draft();
    });
    tabs.appendChild(btn);
  });
  card.appendChild(tabs);

  const grid = document.createElement("div");
  grid.className = "linear-player-grid";
  getVisiblePlayers(appState.availablePlayers, appState.activePosition).forEach(player => {
    grid.appendChild(playerCard(player, selected => pickUserPlayer(selected)));
  });
  card.appendChild(grid);
}

function pickUserPlayer(player) {
  appState.availablePlayers = draftPlayer(userTeam(), player, appState.availablePlayers);
  appState.currentPick += 1;
  renderPage04Draft();
}

function runAiPick(team) {
  const player = chooseAIPlayer(team, appState.availablePlayers);
  appState.availablePlayers = draftPlayer(team, player, appState.availablePlayers);
  appState.currentPick += 1;
  renderPage04Draft();
}
