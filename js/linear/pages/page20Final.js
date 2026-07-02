import { appState } from "../linearState.js";
import { clearApp, pageShell } from "../pageUtils.js?v=pos-icons-3";
import { goTo } from "../linearRouter.js?v=cache-fix-1";
import { renderLiveMatchSimulation } from "../liveMatchSimulation.js?v=live-simulation-5";

export function renderPage20Final() {
  const app = clearApp();
  const match = appState.lastMatch;
  const shell = pageShell({
    eyebrow: "Page 20",
    title: "Final",
    subtitle: match ? `Live simulation: ${match.round}` : "No final available."
  });
  shell.card.classList.add("linear-match-card");

  shell.card.appendChild(renderLiveMatchSimulation(match, {
    nextButtonText: "Season Statistics",
    onContinue: () => goTo("seasonEnd")
  }));

  app.appendChild(shell.section);
}
