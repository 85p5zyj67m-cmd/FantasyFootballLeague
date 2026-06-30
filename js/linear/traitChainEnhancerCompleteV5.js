import { installTraitChainEnhancer as installCompleteChainEnhancer } from "./traitChainEnhancerComplete.js?v=complete-chain-ui-1";
import { getActiveTraitChains } from "../traitChainEngine.js?v=balanced-trait-recipes-1";
import { getFormationById } from "../formations.js?v=detailed-formations-3";
import { getSlotsFromFormation } from "../lineup.js?v=strict-cdm-1";
import { getFormationChainLinkScore, hasFormationSpecificChainLinks } from "../formationChainLinks.js?v=formation-links-1";
import { userTeam } from "./linearState.js";

const X_BY_LINE_LENGTH = {
  1: [0],
  2: [-0.62, 0.62],
  3: [-1.05, 0, 1.05],
  4: [-1.5, -0.5, 0.5, 1.5],
  5: [-2, -1, 0, 1, 2]
};

const LEFT_SIDE_POSITIONS = new Set(["LB", "LWB", "LM", "LW"]);
const RIGHT_SIDE_POSITIONS = new Set(["RB", "RWB", "RM", "RW"]);
const LEFT_DEFENDERS = new Set(["LB", "LWB"]);
const RIGHT_DEFENDERS = new Set(["RB", "RWB"]);
const LEFT_WIDE_ATTACK = new Set(["LM", "LW"]);
const RIGHT_WIDE_ATTACK = new Set(["RM", "RW"]);
const CENTRAL_MIDFIELD = new Set(["CDM", "CM", "CAM"]);
const CENTRAL_ATTACK = new Set(["CAM", "CF", "ST"]);
const CENTRAL_POSITIONS = new Set(["GK", "CB", "CDM", "CM", "CAM", "CF", "ST"]);
const FRONT_THREE = new Set(["LW", "RW", "CF", "ST", "CAM"]);

let positionObserver = null;
let queued = false;
let selectedSlotKey = null;
let showAllChains = false;
let allOverlaySignature = "";

export function installTraitChainEnhancer() {
  installCompleteChainEnhancer();
  installPositionChainStyles();
  installPositionChainHighlighter();
}

function installPositionChainHighlighter() {
  if (positionObserver) return;

  const app = document.getElementById("app");
  if (!app) return;

  app.addEventListener("click", event => {
    const slot = event.target?.closest?.(".linear-slot");
    if (!slot) return;

    selectedSlotKey = slot.dataset.slot || null;
    queuePositionHighlight();
  }, true);

  positionObserver = new MutationObserver(() => queuePositionHighlight());
  positionObserver.observe(app, { childList: true, subtree: true });

  window.addEventListener("change", queuePositionHighlight, true);
  window.addEventListener("dragend", queuePositionHighlight, true);
  window.addEventListener("drop", queuePositionHighlight, true);
  window.addEventListener("resize", queuePositionHighlight);

  queuePositionHighlight();
}

function queuePositionHighlight() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    ensureShowAllChainsControl();
    highlightChainReachablePositions();
    renderAllChainsOverlay();
  });
}

function ensureShowAllChainsControl() {
  const panel = document.querySelector(".trait-chain-panel");
  if (!panel || panel.querySelector(".trait-chain-show-all-toggle")) return;

  const header = panel.querySelector(".trait-chain-header");
  if (!header) return;

  const controls = document.createElement("div");
  controls.className = "trait-chain-display-controls";

  const label = document.createElement("label");
  label.className = "trait-chain-show-all-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = showAllChains;
  checkbox.addEventListener("change", event => {
    showAllChains = Boolean(event.target.checked);
    allOverlaySignature = "";
    renderAllChainsOverlay();
  });

  const text = document.createElement("span");
  text.textContent = "Show all chains on formation";

  label.append(checkbox, text);
  controls.appendChild(label);
  header.insertAdjacentElement("afterend", controls);
}

function renderAllChainsOverlay() {
  const pitch = document.querySelector(".compact-player-pitch");
  if (!pitch) {
    removeAllChainsOverlay();
    allOverlaySignature = "";
    return;
  }

  pitch.classList.toggle("chain-show-all-mode", showAllChains);

  if (!showAllChains) {
    removeAllChainsOverlay();
    allOverlaySignature = "";
    return;
  }

  const chains = safeGetActiveTraitChains(userTeam());
  const pitchRect = pitch.getBoundingClientRect();
  const signature = createAllOverlaySignature(chains, pitchRect);
  const oldOverlay = pitch.querySelector(".trait-chain-all-link-overlay");

  if (oldOverlay && signature === allOverlaySignature) return;
  if (oldOverlay) oldOverlay.remove();

  allOverlaySignature = signature;
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

function highlightChainReachablePositions() {
  clearPositionHighlights();

  const s11View = document.querySelector(".linear-s11-view");
  if (!s11View) return;

  const selectedSlot = getSelectedSlotElement();
  if (!selectedSlot) return;

  selectedSlotKey = selectedSlot.dataset.slot || selectedSlotKey;
  if (!selectedSlotKey) return;

  const slotItems = getPlacedSlotItems();
  const selectedItem = slotItems.find(item => item.slot.key === selectedSlotKey);
  if (!selectedItem) return;

  selectedSlot.classList.add("chain-position-selected-slot");

  slotItems.forEach(item => {
    if (item.slot.key === selectedSlotKey) return;
    if (getChainPositionLinkScore(selectedItem, item) === null) return;

    const element = document.querySelector(`.linear-slot[data-slot="${item.slot.key}"]`);
    if (!element) return;
    element.classList.add("chain-position-compatible-slot");
  });
}

function getSelectedSlotElement() {
  const selectedDomSlot = document.querySelector(".linear-slot.selected");
  if (selectedDomSlot) return selectedDomSlot;

  if (selectedSlotKey) {
    const remembered = document.querySelector(`.linear-slot[data-slot="${selectedSlotKey}"]`);
    if (remembered) return remembered;
  }

  return null;
}

function getPlacedSlotItems() {
  const team = userTeam();
  const formation = getFormationById(team?.formationId || "4-3-3");
  if (!formation?.lines?.length) return [];

  const slots = getSlotsFromFormation(formation);
  const slotItems = [];

  formation.lines.forEach((line, lineIndex) => {
    line.forEach((position, slotIndex) => {
      const key = `${lineIndex}-${slotIndex}`;
      const slot = slots.find(item => item.key === key) || { key, position };
      const lineLength = line.length || 1;
      slotItems.push({
        slot,
        position: String(slot.position || position || "").toUpperCase(),
        x: X_BY_LINE_LENGTH[lineLength]?.[slotIndex] ?? 0,
        y: lineIndex
      });
    });
  });

  return slotItems;
}

function getChainPositionLinkScore(a, b) {
  if (!a || !b) return null;

  const formationId = userTeam()?.formationId || "4-3-3";
  if (hasFormationSpecificChainLinks(formationId)) {
    return getFormationChainLinkScore(formationId, a.slot.key, b.slot.key);
  }

  const footballScore = getFootballAdjacencyScore(a, b);
  if (footballScore !== null) return footballScore;

  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const directDistance = Math.sqrt(dx * dx + dy * dy);

  if (directDistance <= 1.45) return directDistance + 0.15;
  if (dx <= 0.42 && dy <= 2.35) return directDistance + 0.25;
  if (Math.abs(a.x) <= 0.42 && Math.abs(b.x) <= 0.42 && dy <= 2.35) return directDistance + 0.35;

  return null;
}

function getFootballAdjacencyScore(a, b) {
  const first = a.position;
  const second = b.position;
  const dy = Math.abs(a.y - b.y);
  const dx = Math.abs(a.x - b.x);
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (first === second && dy <= 1.2) return distance;
  if (isPair(first, second, LEFT_DEFENDERS, LEFT_WIDE_ATTACK) && dy <= 2.5) return distance + 0.05;
  if (isPair(first, second, RIGHT_DEFENDERS, RIGHT_WIDE_ATTACK) && dy <= 2.5) return distance + 0.05;
  if (isPair(first, second, LEFT_WIDE_ATTACK, CENTRAL_ATTACK) && dy <= 2.1) return distance + 0.12;
  if (isPair(first, second, RIGHT_WIDE_ATTACK, CENTRAL_ATTACK) && dy <= 2.1) return distance + 0.12;
  if (isPair(first, second, LEFT_WIDE_ATTACK, CENTRAL_MIDFIELD) && dy <= 1.6) return distance + 0.18;
  if (isPair(first, second, RIGHT_WIDE_ATTACK, CENTRAL_MIDFIELD) && dy <= 1.6) return distance + 0.18;
  if (isPair(first, second, LEFT_DEFENDERS, new Set(["CB", "CDM", "CM"])) && dy <= 1.6) return distance + 0.2;
  if (isPair(first, second, RIGHT_DEFENDERS, new Set(["CB", "CDM", "CM"])) && dy <= 1.6) return distance + 0.2;
  if (CENTRAL_POSITIONS.has(first) && CENTRAL_POSITIONS.has(second) && dy <= 2.1) return distance + 0.22;
  if (FRONT_THREE.has(first) && FRONT_THREE.has(second) && dy <= 1.6) return distance + 0.24;
  if (LEFT_SIDE_POSITIONS.has(first) && LEFT_SIDE_POSITIONS.has(second) && dy <= 2.5) return distance + 0.26;
  if (RIGHT_SIDE_POSITIONS.has(first) && RIGHT_SIDE_POSITIONS.has(second) && dy <= 2.5) return distance + 0.26;
  if (isPair(first, second, new Set(["GK"]), new Set(["CB"])) && dy <= 2.5) return distance + 0.28;

  return null;
}

function isPair(first, second, groupA, groupB) {
  return (groupA.has(first) && groupB.has(second)) || (groupA.has(second) && groupB.has(first));
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

function createAllOverlaySignature(chains, pitchRect) {
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

function clearPositionHighlights() {
  document.querySelectorAll(".chain-position-selected-slot, .chain-position-compatible-slot").forEach(slot => {
    slot.classList.remove("chain-position-selected-slot", "chain-position-compatible-slot");
  });
}

function removeAllChainsOverlay() {
  document.querySelectorAll(".trait-chain-all-link-overlay").forEach(overlay => overlay.remove());
  document.querySelectorAll(".compact-player-pitch.chain-show-all-mode").forEach(pitch => pitch.classList.remove("chain-show-all-mode"));
}

function installPositionChainStyles() {
  if (document.getElementById("position-chain-highlight-styles")) return;

  const style = document.createElement("style");
  style.id = "position-chain-highlight-styles";
  style.textContent = `
    .trait-chain-display-controls {
      display: flex;
      justify-content: flex-end;
      margin: 8px 0 10px;
    }
    .trait-chain-show-all-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid rgba(110, 255, 160, 0.28);
      border-radius: 999px;
      background: rgba(7, 20, 14, 0.72);
      color: #d9ffe4;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .trait-chain-show-all-toggle input {
      accent-color: #79f2a0;
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
    .linear-slot.chain-position-selected-slot {
      outline: 3px solid rgba(255, 216, 112, 0.98);
      box-shadow: 0 0 0 4px rgba(255, 216, 112, 0.14), 0 0 26px rgba(255, 216, 112, 0.46);
    }
    .linear-slot.chain-position-compatible-slot {
      outline: 3px solid rgba(121, 242, 160, 0.98);
      box-shadow: 0 0 0 4px rgba(121, 242, 160, 0.14), 0 0 24px rgba(121, 242, 160, 0.42);
    }
  `;
  document.head.appendChild(style);
}

function safeGetActiveTraitChains(team) {
  try {
    return getActiveTraitChains(team) || [];
  } catch (error) {
    console.error("Trait chain calculation failed", error);
    return [];
  }
}
