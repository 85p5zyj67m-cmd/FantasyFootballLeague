import { continueAfterMatch, nextMatchButtonText, userWonLastMatch } from "../seasonFlow.js";
import { appState } from "../linearState.js";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";
import { renderMatchSummary } from "../seasonRenderUtils.js";

export function renderLinearMatchPage(pageNumber, title) {
  const app = clearApp();
  const match = appState.lastMatch;
  const won = userWonLastMatch();
  const status = won ? "Winner" : "Loser";

  const shell = pageShell({
    eyebrow: `Page ${pageNumber}`,
    title,
    subtitle: match ? `${status}: ${match.round}` : "No match has been played yet."
  });

  shell.card.appendChild(renderMatchSummary(match));
  shell.card.appendChild(primaryButton(nextMatchButtonText(), continueAfterMatch));
  app.appendChild(shell.section);
}
