import { playNextLinearMatch } from "../seasonFlow.js?v=second-half-route-1";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";
import { renderHistoryBlock, renderStandingsBlock } from "../seasonRenderUtils.js";

export function renderPage11FirstHalfOverview() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 11",
    title: "First Half Overview",
    subtitle: "First-half summary, standings and your match history."
  });

  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(renderHistoryBlock());
  shell.card.appendChild(primaryButton("Play Second Half", playNextLinearMatch));
  app.appendChild(shell.section);
}
