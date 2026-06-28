import { playNextLinearMatch } from "../seasonFlow.js";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";
import { renderHistoryBlock, renderStandingsBlock } from "../seasonRenderUtils.js";

export function renderPage06SeasonStats() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 6",
    title: "Season Overview",
    subtitle: "Groups, standings and your match history before the first game."
  });

  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(renderHistoryBlock());
  shell.card.appendChild(primaryButton("Play Next Match", playNextLinearMatch));
  app.appendChild(shell.section);
}
