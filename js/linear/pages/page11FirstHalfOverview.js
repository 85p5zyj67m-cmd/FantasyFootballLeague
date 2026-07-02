import { playNextLinearMatch } from "../seasonFlow.js?v=second-half-route-1";
import { clearApp, pageShell, primaryButton, attachHeaderAction } from "../pageUtils.js?v=pos-icons-5";
import { renderHistoryBlock, renderStandingsBlock } from "../seasonRenderUtils.js";

export function renderPage11FirstHalfOverview() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 11",
    title: "First Half Overview of the Season",
    subtitle: "First-half summary, standings and your match history."
  });

  const continueButton = primaryButton("Play Second Half", playNextLinearMatch);
  continueButton.classList.add("season-overview-cta");
  attachHeaderAction(shell, continueButton);
  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(renderHistoryBlock());
  app.appendChild(shell.section);
}
