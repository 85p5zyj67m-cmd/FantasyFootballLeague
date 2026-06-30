import { appState } from "../linearState.js";
import { playNextLinearMatch } from "../seasonFlow.js";
import { goTo } from "../linearRouter.js";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";
import { renderHistoryBlock, renderStandingsBlock } from "../seasonRenderUtils.js";

export function renderPage16SecondHalfOverview() {
  const app = clearApp();
  const season = appState.season;
  const complete = !season || season.phase === "COMPLETE";
  const shell = pageShell({
    eyebrow: "Page 16",
    title: "Second Half Overview",
    subtitle: complete ? "Your group stage is finished." : "Second-half summary. If you qualified, the knockouts start now."
  });

  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(renderHistoryBlock());

  if (complete) {
    shell.card.appendChild(primaryButton("Season Statistics", () => goTo("seasonEnd")));
  } else {
    shell.card.appendChild(primaryButton("Play Round of 16", playNextLinearMatch));
  }

  app.appendChild(shell.section);
}
