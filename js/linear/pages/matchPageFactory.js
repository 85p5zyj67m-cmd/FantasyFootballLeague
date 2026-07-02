import { continueAfterMatch, nextMatchButtonText } from "../seasonFlow.js?v=second-half-route-1";
import { appState } from "../linearState.js";
import { clearApp, pageShell } from "../pageUtils.js?v=pos-icons-3";
import { renderLiveMatchSimulation } from "../liveMatchSimulation.js?v=live-simulation-5";

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

  const parsed = parseRoundLabel(match.round);
  if (parsed) return `${parsed.matchday} - ${parsed.phase} of the Season - Live simulation`;
  if (match.round) return `${match.round} - Live simulation`;
  return `${fallbackTitle} - Live simulation`;
}

function parseRoundLabel(round) {
  const match = String(round || "").match(/^(First Half|Second Half) - (Matchday \d+)$/);
  if (!match) return null;
  return { phase: match[1], matchday: match[2] };
}
