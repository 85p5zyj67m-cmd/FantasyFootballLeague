let observer = null;
let queued = false;

export function installMatchActionTopEnhancer() {
  if (observer) return;

  installMatchActionTopStyles();

  const app = document.getElementById("app");
  if (!app) return;

  observer = new MutationObserver(queueEnhancement);
  observer.observe(app, { childList: true, subtree: true });

  queueEnhancement();
}

function queueEnhancement() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    moveMatchActionsToTop();
  });
}

function moveMatchActionsToTop() {
  document.querySelectorAll(".linear-live-sim").forEach(sim => {
    const controls = sim.querySelector(":scope > .live-controls");
    if (!controls || controls.classList.contains("live-controls-top")) return;

    controls.classList.add("live-controls-top");
    sim.insertBefore(controls, sim.firstElementChild);
  });
}

function installMatchActionTopStyles() {
  if (document.getElementById("match-action-top-styles")) return;

  const style = document.createElement("style");
  style.id = "match-action-top-styles";
  style.textContent = `
    .linear-live-sim > .live-controls-top {
      order: -999;
      position: sticky;
      top: 8px;
      z-index: 40;
      margin-bottom: 10px;
      border: none;
      background: none;
      box-shadow: none;
    }
  `;
  document.head.appendChild(style);
}
