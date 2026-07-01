import { installTraitChainEnhancer as installCompleteChainEnhancer } from "./traitChainPanel.js?v=complete-chain-ui-1";
import { getFormationById } from "../../formations.js?v=detailed-formations-3";
import { getSlotsFromFormation } from "../../lineup.js?v=strict-cdm-1";
import { getFormationChainLinkScore, hasFormationSpecificChainLinks } from "../../formationChainLinks.js?v=formation-links-1";
import { userTeam } from "../linearState.js";

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
    highlightChainReachablePositions();
  });
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

function clearPositionHighlights() {
  document.querySelectorAll(".chain-position-selected-slot, .chain-position-compatible-slot").forEach(slot => {
    slot.classList.remove("chain-position-selected-slot", "chain-position-compatible-slot");
  });
}

function installPositionChainStyles() {
  if (document.getElementById("position-chain-highlight-styles")) return;

  const style = document.createElement("style");
  style.id = "position-chain-highlight-styles";
  style.textContent = `
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
