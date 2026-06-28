import { clearApp, pageShell, primaryButton, twoColumnRow } from "../pageUtils.js";
import { renderHistoryBlock, renderStandingsBlock, finalResultText } from "../seasonRenderUtils.js";
import { appState } from "../linearState.js";

export function renderSeasonEndPage() {
  const app = clearApp();
  const champion = appState.season?.champion?.name || "Unknown";
  const shell = pageShell({
    eyebrow: "Season Statistics",
    title: finalResultText(),
    subtitle: `Champion: ${champion}`
  });

  const summary = document.createElement("div");
  summary.className = "linear-mini-card";
  summary.appendChild(twoColumnRow("Matches played", String(appState.season?.userMatchHistory.length || 0)));
  summary.appendChild(twoColumnRow("Champion", champion));
  summary.appendChild(twoColumnRow("Your result", finalResultText()));

  shell.card.appendChild(summary);
  shell.card.appendChild(renderHistoryBlock());
  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(primaryButton("New Season", () => {
    window.location.href = window.location.pathname + "?v=" + Date.now();
  }));
  app.appendChild(shell.section);
}
