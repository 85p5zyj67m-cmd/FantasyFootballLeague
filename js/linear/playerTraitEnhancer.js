import { formatTraits, getDisplayPosition } from "../playerUtils.js";
import { appState } from "./linearState.js";

let installed = false;
let queued = false;

export function installPlayerTraitEnhancer() {
  if (installed) return;
  installed = true;
  addTraitStyles();

  const app = document.getElementById("app");
  if (!app) return;

  const observer = new MutationObserver(queueEnhanceVisiblePlayers);
  observer.observe(app, { childList: true, subtree: true });
  queueEnhanceVisiblePlayers();
}

function queueEnhanceVisiblePlayers() {
  if (queued) return;
  queued = true;

  window.requestAnimationFrame(() => {
    queued = false;
    enhanceVisiblePlayers();
  });
}

function enhanceVisiblePlayers() {
  document.querySelectorAll(".linear-slot[data-player-id]").forEach(enhanceSlotPlayer);
  document.querySelectorAll(".linear-bench-player[data-player-id]").forEach(enhanceBenchPlayer);
}

function enhanceSlotPlayer(element) {
  const player = findPlayer(element.dataset.playerId);
  if (!player) return;

  const displayPosition = getDisplayPosition(player);
  const position = element.querySelector("strong");
  if (position && position.textContent !== displayPosition) {
    position.textContent = displayPosition;
  }

  const traits = formatTraits(player);
  let traitLine = element.querySelector(".linear-player-traitline");

  if (!traitLine) {
    traitLine = document.createElement("small");
    traitLine.className = "linear-player-traitline";
    traitLine.textContent = traits;
    element.appendChild(traitLine);
    return;
  }

  if (traitLine.textContent !== traits) {
    traitLine.textContent = traits;
  }
}

function enhanceBenchPlayer(element) {
  const player = findPlayer(element.dataset.playerId);
  if (!player) return;

  const mainText = `${player.overall} - ${player.name} - ${getDisplayPosition(player)}`;
  const traitText = formatTraits(player);
  const currentMain = element.querySelector("span")?.textContent || "";
  const currentTraits = element.querySelector(".linear-player-traitline")?.textContent || "";

  if (currentMain === mainText && currentTraits === traitText) return;

  element.textContent = "";

  const main = document.createElement("span");
  main.textContent = mainText;

  const traitLine = document.createElement("small");
  traitLine.className = "linear-player-traitline";
  traitLine.textContent = traitText;

  element.append(main, traitLine);
}

function findPlayer(playerId) {
  if (!playerId) return null;

  for (const team of appState.teams || []) {
    const player = team.players?.find(candidate => candidate.id === playerId);
    if (player) return player;
  }

  return null;
}

function addTraitStyles() {
  if (document.getElementById("linear-player-trait-styles")) return;

  const style = document.createElement("style");
  style.id = "linear-player-trait-styles";
  style.textContent = ".linear-trait-chip-row{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}.linear-trait-chip{border:1px solid rgba(255,255,255,.14);border-radius:999px;font-size:.68rem;line-height:1.2;opacity:.88;padding:3px 7px;white-space:nowrap}.linear-player-traitline{display:block;font-size:.68rem;line-height:1.25;margin-top:4px;opacity:.74}";
  document.head.appendChild(style);
}
