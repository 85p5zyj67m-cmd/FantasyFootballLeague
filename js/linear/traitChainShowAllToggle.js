import { installTraitChainEnhancer as installPositionChainEnhancer } from "./traitChainPositionHighlighter.js?v=position-chain-ui-1";
import { getActiveTraitChains } from "../traitChainEngine.js?v=balanced-trait-recipes-1";
import { userTeam } from "./linearState.js";

let observer = null;
let queued = false;
let showAllChains = false;
let overlaySignature = "";

export function installTraitChainEnhancer() {
  installPositionChainEnhancer();
  installShowAllStyles();
  installShowAllControl();
}

function installShowAllControl() {
  if (observer) return;

  const app = document.getElementById("app");
  if (!app) return;

  observer = new MutationObserver(() => queueRender());
  observer.observe(app, { childList: true, subtree: true });

  window.addEventListener("resize", queueRender);
  window.addEventListener("change", queueRender, true);
  window.addEventListener("dragend", queueRender, true);
  window.addEventListener("drop", queueRender, true);

  queueRender();
}

function queueRender() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    ensureControl();
    renderAllChainsOverlay();
  });
}

function ensureControl() {
  const s11View = document.querySelector(".linear-s11-view");
  if (!s11View) {
    removeOverlay();
    overlaySignature = "";
    return;
  }

  if (s11View.querySelector(".trait-chain-global-controls")) return;

  const controls = document.createElement("div");
  controls.className = "trait-chain-global-controls";

  const button = document.createElement("button");
  button.type = "button";
  button.className = showAllChains ? "trait-chain-show-all-button active" : "trait-chain-show-all-button";
  button.textContent = showAllChains ? "Showing all chains" : "Show all chains";
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    showAllChains = !showAllChains;
    button.className = showAllChains ? "trait-chain-show-all-button active" : "trait-chain-show-all-button";
    button.textContent = showAllChains ? "Showing all chains" : "Show all chains";
    overlaySignature = "";
    renderAllChainsOverlay();
  });

  controls.appendChild(button);

  const panel = s11View.querySelector(".trait-chain-panel");
  const hint = s11View.querySelector(".compact-hint, .subtitle");

  if (panel) panel.insertAdjacentElement("beforebegin", controls);
  else if (hint) hint.insertAdjacentElement("afterend", controls);
  else s11View.prepend(controls);
}

function renderAllChainsOverlay() {
  const pitch = document.querySelector(".compact-player-pitch");
  if (!pitch) {
    removeOverlay();
    overlaySignature = "";
    return;
  }

  pitch.classList.toggle("chain-show-all-mode", showAllChains);

  if (!showAllChains) {
    removeOverlay();
    overlaySignature = "";
    return;
  }

  const chains = safeGetActiveTraitChains(userTeam());
  const pitchRect = pitch.getBoundingClientRect();
  const signature = createOverlaySignature(chains, pitchRect);
  const oldOverlay = pitch.querySelector(".trait-chain-all-link-overlay");

  if (oldOverlay && signature === overlaySignature) return;
  if (oldOverlay) oldOverlay.remove();

  overlaySignature = signature;
  if (!chains.length) return;

  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.classList.add("trait-chain-all-link-overlay");
  overlay.setAttribute("viewBox", `0 0 ${pitchRect.width} ${pitchRect.height}`);
  overlay.setAttribute("preserveAspectRatio", "none");
  overlay.setAttribute("aria-hidden", "true");

  chains.forEach((chain, chainIndex) => {
    chain.path.forEach((item, index) => {
      if (index === 0) return;
      const previous = chain.path[index - 1];
      const start = getSlotCenter(previous.slot.key, pitchRect);
      const end = getSlotCenter(item.slot.key, pitchRect);
      if (!start || !end) return;
      overlay.appendChild(createSvgLine(start, end, chain.level, chainIndex));
      overlay.appendChild(createSvgDot(start));
      overlay.appendChild(createSvgDot(end));
    });
  });

  pitch.appendChild(overlay);
}

function getSlotCenter(slotKey, pitchRect) {
  const slot = document.querySelector(`.linear-slot[data-slot="${slotKey}"]`);
  if (!slot) return null;

  const rect = slot.getBoundingClientRect();
  return {
    x: rect.left - pitchRect.left + rect.width / 2,
    y: rect.top - pitchRect.top + rect.height / 2
  };
}

function createSvgLine(start, end, level, chainIndex) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(start.x));
  line.setAttribute("y1", String(start.y));
  line.setAttribute("x2", String(end.x));
  line.setAttribute("y2", String(end.y));
  line.setAttribute("class", `trait-chain-link level-${level} all-chain-${chainIndex % 6}`);
  line.setAttribute("stroke-width", String(level >= 4 ? 7 : level >= 3 ? 6 : 5));
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("opacity", "0.9");
  return line;
}

function createSvgDot(point) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", String(point.x));
  circle.setAttribute("cy", String(point.y));
  circle.setAttribute("r", "4.5");
  circle.setAttribute("class", "trait-chain-link-dot");
  return circle;
}

function createOverlaySignature(chains, pitchRect) {
  return JSON.stringify({
    width: Math.round(pitchRect.width),
    height: Math.round(pitchRect.height),
    chains: chains.map(chain => ({
      id: chain.id,
      level: chain.level,
      slots: chain.path.map(item => item.slot.key),
      players: chain.path.map(item => item.player.id)
    }))
  });
}

function removeOverlay() {
  document.querySelectorAll(".trait-chain-all-link-overlay").forEach(overlay => overlay.remove());
  document.querySelectorAll(".compact-player-pitch.chain-show-all-mode").forEach(pitch => pitch.classList.remove("chain-show-all-mode"));
}

function installShowAllStyles() {
  if (document.getElementById("show-all-chain-control-styles")) return;

  const style = document.createElement("style");
  style.id = "show-all-chain-control-styles";
  style.textContent = `
    .trait-chain-global-controls {
      display: flex;
      justify-content: flex-end;
      margin: 10px 0 12px;
      position: relative;
      z-index: 30;
    }
    .trait-chain-show-all-button {
      appearance: none;
      border: 1px solid rgba(110, 255, 160, 0.34);
      border-radius: 999px;
      background: rgba(7, 20, 14, 0.82);
      color: #d9ffe4;
      padding: 9px 14px;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      box-shadow: 0 0 16px rgba(110, 255, 160, 0.16);
    }
    .trait-chain-show-all-button.active {
      background: rgba(110, 255, 160, 0.16);
      border-color: rgba(110, 255, 160, 0.86);
      color: #ffffff;
      box-shadow: 0 0 24px rgba(110, 255, 160, 0.28);
    }
    .compact-player-pitch.chain-show-all-mode .trait-chain-link-overlay {
      display: none;
    }
    .trait-chain-all-link-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 4;
    }
  `;
  document.head.appendChild(style);
}

function safeGetActiveTraitChains(team) {
  try {
    return getActiveTraitChains(team) || [];
  } catch (error) {
    console.error("Show all chain calculation failed", error);
    return [];
  }
}
