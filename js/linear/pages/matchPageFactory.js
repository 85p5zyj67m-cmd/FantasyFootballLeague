import { continueAfterMatch, nextMatchButtonText } from "../seasonFlow.js?v=second-half-route-1";
import { appState } from "../linearState.js";
import { clearApp, pageShell } from "../pageUtils.js";
import { renderLiveMatchSimulation } from "../liveMatchSimulation.js?v=live-simulation-1";

export function renderLinearMatchPage(pageNumber, title) {
  const app = clearApp();
  const match = appState.lastMatch;

  const shell = pageShell({
    eyebrow: `Page ${pageNumber}`,
    title,
    subtitle: match ? `Live simulation: ${match.round}` : "No match available."
  });
  shell.card.classList.add("linear-match-card");

  shell.card.appendChild(renderLiveMatchSimulation(match, {
    nextButtonText: nextMatchButtonText(),
    onContinue: continueAfterMatch
  }));

  app.appendChild(shell.section);
}
