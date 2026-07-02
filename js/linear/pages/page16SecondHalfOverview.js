import { appState } from "../linearState.js";
import { playNextLinearMatch } from "../seasonFlow.js";
import { goTo } from "../linearRouter.js?v=cache-fix-1";
import { clearApp, pageShell, primaryButton, attachHeaderAction } from "../pageUtils.js?v=pos-icons-5";
import { renderHistoryBlock, renderStandingsBlock } from "../seasonRenderUtils.js";

export function renderPage16SecondHalfOverview() {
  const app = clearApp();
  const season = appState.season;
  const complete = !season || season.phase === "COMPLETE";
  const shell = pageShell({
    eyebrow: "Page 16",
    title: "Second Half Overview of the Season",
    subtitle: complete ? "Your group stage is finished." : "Second-half summary. If you qualified, the knockouts start now."
  });

  const continueButton = complete
    ? primaryButton("Season Statistics", () => goTo("seasonEnd"))
    : primaryButton("Play Round of 16", playNextLinearMatch);
  continueButton.classList.add("season-overview-cta");
  attachHeaderAction(shell, continueButton);

  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(renderHistoryBlock());

  app.appendChild(shell.section);
}
