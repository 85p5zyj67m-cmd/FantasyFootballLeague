import { renderLinearMatchPage } from "./matchPageFactory.js";
import { appState, userTeam } from "../linearState.js";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";
import { renderMatchSummary, finalResultText } from "../seasonRenderUtils.js";
import { goTo } from "../linearRouter.js";

export function renderPage20Final() {
  const app = clearApp();
  const match = appState.lastMatch;
  const won = appState.season?.champion === userTeam();
  const shell = pageShell({
    eyebrow: "Page 20",
    title: "Final",
    subtitle: won ? "Winner. You are champions." : finalResultText()
  });

  shell.card.appendChild(renderMatchSummary(match));
  shell.card.appendChild(primaryButton("Season Statistics", () => goTo("seasonEnd")));
  app.appendChild(shell.section);
}
