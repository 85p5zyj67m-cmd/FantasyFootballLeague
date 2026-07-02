import { playNextLinearMatch } from "../seasonFlow.js?v=second-half-route-1";
import { clearApp, pageShell, primaryButton, attachHeaderAction } from "../pageUtils.js?v=pos-icons-3";
import { renderHistoryBlock, renderStandingsBlock } from "../seasonRenderUtils.js";

export function renderPage11FirstHalfOverview() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 11",
    title: "First Half Overview",
    subtitle: "First-half summary, standings and your match history."
  });

  attachHeaderAction(shell, primaryButton("Play Second Half", playNextLinearMatch));
  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(renderHistoryBlock());
  app.appendChild(shell.section);
}
