let installed = false;
let starting = false;

export function installSeasonStartBridge() {
  if (installed) return;
  installed = true;

  document.addEventListener("click", async event => {
    const button = event.target?.closest?.("button");
    if (!button) return;
    if ((button.textContent || "").trim() !== "Start Season") return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    if (starting) return;
    starting = true;
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = "Starting Season...";

    try {
      const seasonFlow = await import("./seasonFlow.js?v=real-overall-system-balance-3");
      seasonFlow.startLinearSeason();
    } catch (error) {
      console.error("Start Season failed", error);
      button.disabled = false;
      button.textContent = button.dataset.originalText || "Start Season";
      starting = false;
      window.alert(`Start Season failed: ${error?.message || error}`);
    }
  }, true);
}
