import { loadPlayersFromCSV } from "../../csvLoader.js";
import { createTeams, createDraftOrder, selectDraftPool } from "../../draftRules.js";
import { appState, resetLinearState } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";

export function renderPage01StartDraft() {
  const app = clearApp();
  const { section, card } = pageShell({
    eyebrow: "Page 1",
    title: "Start Draft",
    subtitle: "Start a new fantasy season with a clean chronological page flow."
  });

  card.appendChild(primaryButton("Start Draft", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Loading players...";

    resetLinearState();
    appState.allPlayers = await loadPlayersFromCSV("players.csv");
    appState.teams = createTeams();
    appState.draftOrder = createDraftOrder();
    appState.availablePlayers = selectDraftPool(appState.allPlayers);

    goTo("page02");
  }));

  app.appendChild(section);
}
