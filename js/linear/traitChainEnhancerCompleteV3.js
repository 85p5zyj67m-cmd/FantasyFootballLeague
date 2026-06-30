import { getActiveTraitChains } from "../traitChainEngine.js?v=balanced-trait-recipes-1";
import { getFormationById } from "../formations.js?v=detailed-formations-3";
import { getSlotsFromFormation } from "../lineup.js?v=strict-cdm-1";
import { canPlayPosition } from "../playerUtils.js?v=strict-cdm-1";
import { userTeam } from "./linearState.js";

let observer = null;
let queued = false;
let activeDetailId = null;
let showAllChains = false;
let lastSignature = "";
let lastOverlaySignature = "";

export function installTraitChainEnhancer() {
  if (observer) return;

  installChainHighlightStyles();

  const app = document.getElementById("app");
  if (!app) return;

  observer = new MutationObserver(mutations => {
    const shouldRefresh = mutations.some(mutation =>
      Array.from(mutation.addedNodes).some(isRelevantNode) ||
      Array.from(mutation.removedNodes).some(isRelevantNode)
    );
    if (shouldRefresh) queueEnhancement();
  });

  observer.observe(app, { childList: true, subtree: true });

  window.addEventListener("change", queueEnhancement, true);
  window.addEventListener("dragend", queueEnhancement, true);
  window.addEventListener("drop", queueEnhancement, true);
  window.addEventListener("click", queueEnhancement, true);
  window.addEventListener("resize", queueEnhancement);

  queueEnhancement();
}

function queueEnhancement() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    enhanceTraitChains();
  });
}

function enhanceTraitChains() {
  const s11View = document.querySelector(".linear-s11-view");
  if (!s11View) {
    removeChainOverlay();
    clearCompatibleSlotHighlights();
    lastSignature = "";
    lastOverlaySignature = "";
    return;
  }

  const chains = safeGetActiveTraitChains(userTeam());
  const selectedChain = getSelectedChain(chains);
  const selectedPlayerId = getSelectedPlayerIdFromDom();
  const signature = createPanelSignature(chains, selectedChain, selectedPlayerId);
  const existingPanel = s11View.querySelector(".trait-chain-panel");

  if (!existingPanel || signature !== lastSignature) {
    const panel = createTraitChainPanel(chains, selectedChain);
    const hint = s11View.querySelector(".compact-hint, .subtitle");

    if (existingPanel) existingPanel.replaceWith(panel);
    else if (hint) hint.insertAdjacentElement("afterend", panel);
    else s11View.prepend(panel);

    lastSignature = signature;
  }

  const visibleChains = showAllChains ? chains : selectedChain ? [selectedChain] : [];
  markChainPlayers(visibleChains);
  drawChainLinks(visibleChains);
  highlightCompatibleSlots(selectedPlayerId);
}

function createTraitChainPanel(chains, selectedChain) {
  const panel = document.createElement("section");
  panel.className = "trait-chain-panel";

  const header = document.createElement("div");
  header.className = "trait-chain-header";

  const title = document.createElement("strong");
  title.textContent = "Active Chains";

  const count = document.createElement("span");
  count.textContent = chains.length ? `${chains.length} active` : "0 active";

  header.append(title, count);
  panel.appendChild(header);

  if (!chains.length) {
    const empty = document.createElement("p");
    empty.className = "trait-chain-empty";
    empty.textContent = "No active chains yet. Place matching traits next to each other in your XI.";
    panel.appendChild(empty);
    return panel;
  }

  panel.appendChild(createDisplayControls());

  const list = document.createElement("div");
  list.className = "trait-chain-list";
  chains.forEach(chain => list.appendChild(createChainButton(chain, selectedChain?.id === chain.id)));
  panel.appendChild(list);

  if (selectedChain) panel.appendChild(createChainDetail(selectedChain));
  return panel;
}

function createDisplayControls() {
  const controls = document.createElement("div");
  controls.className = "trait-chain-display-controls";

  const label = document.createElement("label");
  label.className = "trait-chain-show-all-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = showAllChains;
  checkbox.addEventListener("change", event => {
    showAllChains = Boolean(event.target.checked);
    lastSignature = "";
    lastOverlaySignature = "";
    removeChainOverlay();
    queueEnhancement();
  });

  const text = document.createElement("span");
  text.textContent = "Show all chains on formation";

  label.append(checkbox, text);
  controls.appendChild(label);
  return controls;
}

function createChainButton(chain, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isActive ? "trait-chain-chip active" : "trait-chain-chip";

  const name = document.createElement("span");
  name.textContent = chain.name;

  const level = document.createElement("strong");
  level.textContent = `Lv.${chain.level}`;

  button.append(name, level);
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    activeDetailId = chain.id;
    lastSignature = "";
    lastOverlaySignature = "";
    removeChainOverlay();
    queueEnhancement();
  });

  return button;
}

function createChainDetail(chain) {
  const detail = document.createElement("article");
  detail.className = "trait-chain-detail";

  const top = document.createElement("div");
  top.className = "trait-chain-detail-top";

  const title = document.createElement("strong");
  title.textContent = `${chain.name} - Level ${chain.level}/${chain.maxLevel}`;

  const bonus = document.createElement("span");
  bonus.textContent = chain.winChance;

  top.append(title, bonus);

  const effect = document.createElement("p");
  effect.className = "trait-chain-effect";
  effect.textContent = chain.effect;

  const note = document.createElement("p");
  note.className = "trait-chain-build-note";
  note.textContent = "Complete the max-level recipe with connected players. Missing traits can be added in any order.";

  detail.append(top, effect, note, createCurrentOrder(chain), createCompleteChain(chain));
  return detail;
}

function createCurrentOrder(chain) {
  const guide = document.createElement("div");
  guide.className = "trait-chain-build-guide";

  const headline = document.createElement("strong");
  headline.textContent = "Current active order";

  const steps = document.createElement("ol");
  steps.className = "trait-chain-steps";

  chain.path.forEach((item, index) => {
    const step = document.createElement("li");
    step.className = "chain-step active";
    const trait = chain.traits[index] || "Trait";
    step.textContent = `${index + 1}. ${trait} - ${item.player.name} (${item.slot.position})`;
    steps.appendChild(step);
  });

  guide.append(headline, steps);
  return guide;
}

function createCompleteChain(chain) {
  const wrapper = document.createElement("div");
  wrapper.className = "trait-chain-roadmap";

  const headline = document.createElement("strong");
  headline.textContent = "Complete Chain";
  wrapper.appendChild(headline);

  const segment = getCompleteSegment(chain);
  if (!segment) {
    const empty = document.createElement("p");
    empty.className = "trait-chain-max-note";
    empty.textContent = "Complete chain data unavailable.";
    wrapper.appendChild(empty);
    return wrapper;
  }

  const plan = document.createElement("div");
  plan.className = "trait-chain-level-plan";

  const title = document.createElement("div");
  title.className = "trait-chain-level-title";

  const label = document.createElement("strong");
  label.textContent = `Max Level ${segment.size}`;

  const reward = document.createElement("span");
  reward.textContent = `${segment.effect} (${segment.winChance})`;

  title.append(label, reward);

  const steps = document.createElement("ol");
  steps.className = "trait-chain-steps roadmap";

  const activeByTrait = getActiveItemsByTrait(chain);
  const traits = getDisplayTraitsForSegment(chain, segment);

  traits.forEach((trait, index) => {
    const normalized = normalizeTrait(trait);
    const activeItems = activeByTrait.get(normalized) || [];
    const item = activeItems.shift();
    const step = document.createElement("li");

    if (item) {
      step.className = "chain-step active";
      step.textContent = `${index + 1}. ${trait} - ${item.player.name} (${item.slot.position})`;
    } else {
      step.className = "chain-step missing";
      step.textContent = `${index + 1}. ${trait} - missing`;
    }

    steps.appendChild(step);
  });

  plan.append(title, steps);
  wrapper.appendChild(plan);
  return wrapper;
}

function highlightCompatibleSlots(selectedPlayerId) {
  clearCompatibleSlotHighlights();
  if (!selectedPlayerId) return;

  const team = userTeam();
  const selectedPlayer = (team.players || []).find(player => String(player.id) === String(selectedPlayerId));
  if (!selectedPlayer) return;

  const slots = getFormationSlots(team);
  const previousSlot = team.lineup?.[selectedPlayerId] || "BENCH";

  slots.forEach(slot => {
    if (!canPlayPosition(selectedPlayer, slot.position)) return;

    const previewTeam = createPreviewPlacement(team, selectedPlayerId, slot.key);
    if (!selectedPlayerCreatesChain(previewTeam, selectedPlayerId)) return;

    const element = document.querySelector(`.linear-slot[data-slot="${slot.key}"]`);
    if (!element) return;

    element.classList.add("chain-compatible-slot");
    if (slot.key === previousSlot) element.classList.add("chain-compatible-current-slot");
  });
}

function selectedPlayerCreatesChain(team, selectedPlayerId) {
  const chains = safeGetActiveTraitChains(team);
  return chains.some(chain =>
    Array.isArray(chain.path) && chain.path.some(item => String(item.player.id) === String(selectedPlayerId))
  );
}

function createPreviewPlacement(team, selectedPlayerId, targetSlotKey) {
  const lineup = { ...(team.lineup || {}) };

  Object.entries(lineup).forEach(([playerId, slotKey]) => {
    if (slotKey === targetSlotKey && String(playerId) !== String(selectedPlayerId)) {
      lineup[playerId] = "BENCH";
    }
  });

  lineup[selectedPlayerId] = targetSlotKey;

  return {
    ...team,
    lineup,
    players: team.players || []
  };
}

function getFormationSlots(team) {
  const formation = getFormationById(team?.formationId || "4-3-3");
  return formation ? getSlotsFromFormation(formation) : [];
}

function getSelectedPlayerIdFromDom() {
  const selectedSlot = document.querySelector(".linear-slot.selected[data-player-id]");
  if (selectedSlot?.dataset?.playerId) return selectedSlot.dataset.playerId;

  const selectedBench = document.querySelector(".linear-bench-player.selected[data-player-id]");
  if (selectedBench?.dataset?.playerId) return selectedBench.dataset.playerId;

  return null;
}

function clearCompatibleSlotHighlights() {
  document.querySelectorAll(".chain-compatible-slot, .chain-compatible-current-slot").forEach(slot => {
    slot.classList.remove("chain-compatible-slot", "chain-compatible-current-slot");
  });
}

function getCompleteSegment(chain) {
  const options = Array.isArray(chain.segmentOptions) ? chain.segmentOptions : [];
  return options
    .filter(segment => segment.size === chain.maxLevel)
    .sort((a, b) => a.startIndex - b.startIndex)[0] || null;
}

function getActiveItemsByTrait(chain) {
  const map = new Map();

  chain.path.forEach((item, index) => {
    const trait = normalizeTrait(chain.traits[index]);
    if (!map.has(trait)) map.set(trait, []);
    map.get(trait).push(item);
  });

  return map;
}

function getDisplayTraitsForSegment(chain, segment) {
  const traits = segment.traits || [];
  return chain.direction === "reverse" ? [...traits].reverse() : traits;
}

function getSelectedChain(chains) {
  if (!chains.length) {
    activeDetailId = null;
    return null;
  }

  const selected = chains.find(chain => chain.id === activeDetailId) || chains[0];
  activeDetailId = selected.id;
  return selected;
}

function markChainPlayers(chains) {
  const activeSlotKeys = new Set();
  chains.forEach(chain => chain.path.forEach(item => activeSlotKeys.add(item.slot.key)));

  document.querySelectorAll(".linear-slot").forEach(slot => {
    slot.classList.remove("chain-active-slot");
    if (activeSlotKeys.has(slot.dataset.slot)) slot.classList.add("chain-active-slot");
  });

  document.querySelectorAll(".compact-player-line").forEach(line => {
    const activeInLine = line.querySelectorAll(".chain-active-slot").length;
    line.classList.toggle("chain-active-line", activeInLine > 1);
  });
}

function drawChainLinks(chains) {
  const pitch = document.querySelector(".compact-player-pitch");
  if (!pitch) {
    removeChainOverlay();
    lastOverlaySignature = "";
    return;
  }

  const pitchRect = pitch.getBoundingClientRect();
  const signature = createOverlaySignature(chains, pitchRect);
  const oldOverlay = pitch.querySelector(".trait-chain-link-overlay");

  if (oldOverlay && signature === lastOverlaySignature) return;
  if (oldOverlay) oldOverlay.remove();

  lastOverlaySignature = signature;
  if (!chains.length) return;

  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.classList.add("trait-chain-link-overlay");
  overlay.setAttribute("viewBox", `0 0 ${pitchRect.width} ${pitchRect.height}`);
  overlay.setAttribute("preserveAspectRatio", "none");
  overlay.setAttribute("aria-hidden", "true");

  chains.forEach(chain => {
    chain.path.forEach((item, index) => {
      if (index === 0) return;
      const previous = chain.path[index - 1];
      const start = getSlotCenter(previous.slot.key, pitchRect);
      const end = getSlotCenter(item.slot.key, pitchRect);
      if (!start || !end) return;
      overlay.appendChild(createSvgLine(start, end, chain.level));
      overlay.appendChild(createSvgDot(start));
      overlay.appendChild(createSvgDot(end));
    });
  });

  pitch.appendChild(overlay);
}

function createSvgLine(start, end, level) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(start.x));
  line.setAttribute("y1", String(start.y));
  line.setAttribute("x2", String(end.x));
  line.setAttribute("y2", String(end.y));
  line.setAttribute("class", `trait-chain-link level-${level}`);
  line.setAttribute("stroke-width", String(level >= 4 ? 8 : level >= 3 ? 7 : 6));
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("opacity", "0.98");
  return line;
}

function createSvgDot(point) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", String(point.x));
  circle.setAttribute("cy", String(point.y));
  circle.setAttribute("r", "5");
  circle.setAttribute("class", "trait-chain-link-dot");
  return circle;
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

function removeChainOverlay() {
  document.querySelectorAll(".trait-chain-link-overlay").forEach(overlay => overlay.remove());
}

function createPanelSignature(chains, selectedChain, selectedPlayerId) {
  return JSON.stringify({
    activeDetailId: selectedChain?.id || null,
    showAllChains,
    selectedPlayerId,
    chains: chains.map(chain => ({
      id: chain.id,
      level: chain.level,
      traits: chain.traits,
      slots: chain.path.map(item => item.slot.key),
      players: chain.path.map(item => item.player.id)
    }))
  });
}

function createOverlaySignature(chains, pitchRect) {
  return JSON.stringify({
    selected: activeDetailId,
    showAllChains,
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

function installChainHighlightStyles() {
  if (document.getElementById("chain-highlight-styles")) return;

  const style = document.createElement("style");
  style.id = "chain-highlight-styles";
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
    .linear-slot.chain-compatible-slot {
      outline: 3px solid rgba(121, 242, 160, 0.96);
      box-shadow: 0 0 0 4px rgba(121, 242, 160, 0.16), 0 0 22px rgba(121, 242, 160, 0.48);
    }
    .linear-slot.chain-compatible-current-slot {
      outline-color: rgba(255, 216, 112, 0.98);
      box-shadow: 0 0 0 4px rgba(255, 216, 112, 0.16), 0 0 24px rgba(255, 216, 112, 0.48);
    }
  `;
  document.head.appendChild(style);
}

function isRelevantNode(node) {
  if (!(node instanceof Element)) return false;
  if (node.classList?.contains("trait-chain-panel")) return false;
  if (node.classList?.contains("trait-chain-link-overlay")) return false;
  return Boolean(
    node.matches?.(".linear-s11-view, .compact-player-pitch, .linear-slot, .linear-info-card-view") ||
    node.querySelector?.(".linear-s11-view, .compact-player-pitch, .linear-slot, .linear-info-card-view")
  );
}

function normalizeTrait(trait) {
  return String(trait || "").trim().toLowerCase();
}

function safeGetActiveTraitChains(team) {
  try {
    return getActiveTraitChains(team);
  } catch (error) {
    console.error("Trait chain calculation failed", error);
    return [];
  }
}
