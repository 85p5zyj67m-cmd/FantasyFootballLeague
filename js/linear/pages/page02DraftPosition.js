import { getUserDraftPosition } from "../../draftRules.js";
import { appState } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";

export function renderPage02DraftPosition() {
  const app = clearApp();
  const position = getUserDraftPosition(appState.draftOrder);
  const { section, card } = pageShell({
    eyebrow: "Page 2",
    title: "Your Draft Position",
    subtitle: `You pick at position ${position}. The draft uses a snake order.`
  });

  const slot = document.createElement("div");
  slot.className = "linear-big-number";
  slot.textContent = position;
  card.appendChild(slot);
  card.appendChild(primaryButton("Choose System", () => goTo("page03")));
  app.appendChild(section);
}
