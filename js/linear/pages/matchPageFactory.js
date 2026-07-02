import { continueAfterMatch, nextMatchButtonText } from "../seasonFlow.js?v=second-half-route-1";
import { appState } from "../linearState.js";
import { clearApp, pageShell } from "../pageUtils.js?v=pos-icons-5";
import { renderLiveMatchSimulation } from "../liveMatchSimulation.js?v=live-simulation-7";

export function renderLinearMatchPage(pageNumber, title) {
  const app = clearApp();
  const match = appState.lastMatch;

  const shell = pageShell({
    eyebrow: `Page ${pageNumber}`,
    title: buildMatchHeaderTitle(match, title),
    subtitle: ""
  });
  shell.card.classList.add("linear-match-card");

  shell.card.appendChild(renderLiveMatchSimulation(match, {
    nextButtonText: nextMatchButtonText(),
    onContinue: continueAfterMatch
  }));

  app.appendChild(shell.section);
}

function buildMatchHeaderTitle(match, fallbackTitle) {
  if (!match) return "No match available.";

  const phase = parseRoundPhase(match.round);
  if (phase) {
    const matchday = ((appState.userMatchNumber - 1) % 4) + 1;
    return `Matchday ${matchday} - ${phase} of the Season - Live simulation`;
  }
  if (match.round) return `${match.round} - Live simulation`;
  return `${fallbackTitle} - Live simulation`;
}

function parseRoundPhase(round) {
  const match = String(round || "").match(/^(First Half|Second Half) - Matchday \d+$/);
  return match ? match[1] : null;
}
