import { appState } from "../linearState.js";
import { goTo } from "../linearRouter.js?v=draft-speed-live-2";

export function installDraftSpeedController() {
  document.addEventListener("input", handleSpeedEvent, true);
  document.addEventListener("change", handleSpeedEvent, true);
}

function handleSpeedEvent(event) {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement)) return;
  if (!select.closest(".linear-speed-box")) return;

  appState.aiSpeed = select.value;
  if (select.dataset.draftSpeedSelect === "true") return;

  window.setTimeout(() => goTo("page04"), 0);
}
