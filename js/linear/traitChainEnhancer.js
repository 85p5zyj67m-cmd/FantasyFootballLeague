import { getActiveTraitChains } from "../traitChainEngine.js?v=normalized-chain-upgrades-1";
import { userTeam } from "./linearState.js";

let observer = null;
let queued = false;
let activeDetailId = null;
let lastPanelSignature = "";
let lastOverlaySignature = "";

export function installTraitChainEnhancer() {
  if (observer) return;

  observer = new MutationObserver(mutations => {
    const shouldRefresh = mutations.some(mutation =>
      Array.from(mutation.addedNodes).some(isRelevantNode) ||
      Array.from(mutation.removedNodes).some(isRelevantNode)
    );

    if (shouldRefresh) queueEnhancement();
  });

  observer.observe(document.getElementById("app"), {
    childList: true,
    subtree: true
  });

  window.addEventListener("change", queueEnhancement, true);
  window.addEventListener("dragend", queueEnhancement, true);
  window.addEventListener("drop", queueEnhancement, true);
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
    lastPanelSignature = "";
    lastOverlaySignature = "";
    return;
  }

  const chains = safeGetActiveTraitChains(userTeam());
  const selectedChain = getSelectedChain(chains);
  const panelSignature = createPanelSignature(chains, selectedChain);
  const existingPanel = s11View.querySelector(".trait-chain-panel");

  if (!existingPanel || panelSignature !== lastPanelSignature) {
    const hint = s11View.querySelector(".compact-hint, .subtitle");
    const panel = createTraitChainPanel(chains, selectedChain);

    if (existingPanel) existingPanel.replaceWith(panel);
    else if (hint) hint.insertAdjacentElement("afterend", panel);
    else s11View.prepend(panel);

    lastPanelSignature = panelSignature;
  }

  const visibleChains = selectedChain ? [selectedChain] : [];
  markChainPlayers(visibleChains);
  drawChainLinks(visibleChains);
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

  const list = document.createElement("div");
  list.className = "trait-chain-list";
  chains.forEach(chain => list.appendChild(createChainButton(chain, selectedChain?.id === chain.id)));
  panel.appendChild(list);

  if (selectedChain) panel.appendChild(createChainDetail(selectedChain));
  return panel;
}

function createChainButton(chain, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isActive ? "trait-chain-chip active" : "trait-chain-chip";
  button.dataset.chainId = chain.id;

  const name = document.createElement("span");
  name.textContent = chain.name;

  const meta = document.createElement("strong");
  meta.textContent = `Lv.${chain.level}`;

  button.append(name, meta);
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    activeDetailId = chain.id;
    lastPanelSignature = "";
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
  note.textContent = "Build the exact level recipe with connected players. Higher levels keep the lower-level idea and add more traits.";

  detail.append(top, effect, note, createCurrentOrder(chain), createBuildRoadmap(chain));
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

function createBuildRoadmap(chain) {
  const roadmap = document.createElement("div");
  roadmap.className = "trait-chain-roadmap";

  const headline = document.createElement("strong");
  headline.textContent = "Upgrade roadmap";
  roadmap.appendChild(headline);

  const segments = getUpgradeSegments(chain);

  if (!segments.length) {
    const max = document.createElement("p");
    max.className = "trait-chain-max-note";
    max.textContent = "Max level reached. This chain is fully built.";
    roadmap.appendChild(max);
    return roadmap;
  }

  segments.forEach(segment => roadmap.appendChild(createSegmentPlan(chain, segment)));
  return roadmap;
}

function createSegmentPlan(chain, segment) {
  const plan = document.createElement("div");
  plan.className = "trait-chain-level-plan";

  const title = document.createElement("div");
  title.className = "trait-chain-level-title";

  const label = document.createElement("strong");
  label.textContent = `Build Level ${segment.size}`;

  const reward = document.createElement("span");
  reward.textContent = `${segment.effect} (${segment.winChance})`;

  title.append(label, reward);

  const steps = document.createElement("ol");
  steps.className = "trait-chain-steps roadmap";

  const activeByTrait = getActiveItemsByTrait(chain);
  const orderedTraits = getDisplayTraitsForSegment(chain, segment);

  orderedTraits.forEach((trait, index) => {
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
  return plan;
}

function getUpgradeSegments(chain) {
  const options = Array.isArray(chain.segmentOptions) ? chain.segmentOptions : [];
  return options
    .filter(segment => segment.size > chain.level)
    .sort((a, b) => a.size - b.size);
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

function normalizeTrait(trait) {
  return String(trait || "").trim().toLowerCase();
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
  const overlaySignature = createOverlaySignature(chains, pitchRect);
  const oldOverlay = pitch.querySelector(".trait-chain-link-overlay");

  if (oldOverlay && overlaySignature === lastOverlaySignature) return;
  if (oldOverlay) oldOverlay.remove();

  lastOverlaySignature = overlaySignature;
  if (!chains.length) return;

  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.classList.add("trait-chain-link-overlay");
  overlay.setAttribute("viewBox", `0 0 ${pitchRect.width} ${pitchRect.height}`);
  overlay.setAttribute("preserveAspectRatio", "none");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.selectedChainId = chains[0]?.id || "";

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  gradient.setAttribute("id", `trait-chain-link-gradient-${chains[0]?.id || "selected"}`);
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("x2", "100%");

  const stopA = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stopA.setAttribute("offset", "0%");
  stopA.setAttribute("stop-color", "#f7c95f");

  const stopB = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stopB.setAttribute("offset", "100%");
  stopB.setAttribute("stop-color", "#ffeaa0");

  gradient.append(stopA, stopB);
  defs.appendChild(gradient);
  overlay.appendChild(defs);

  chains.forEach(chain => {
    chain.path.forEach((item, index) => {
      if (index === 0) return;
      const previous = chain.path[index - 1];
      const start = getSlotCenter(previous.slot.key, pitchRect);
      const end = getSlotCenter(item.slot.key, pitchRect);
      if (!start || !end) return;

      overlay.appendChild(createSvgLine(start, end, chain.level, chain.id));
      overlay.appendChild(createSvgChainDot(start));
      overlay.appendChild(createSvgChainDot(end));
    });
  });

  pitch.appendChild(overlay);

  window.requestAnimationFrame(() => {
    const currentOverlay = pitch.querySelector(".trait-chain-link-overlay");
    if (!currentOverlay) {
      lastOverlaySignature = "";
      drawChainLinks(chains);
    }
  });
}

function createSvgLine(start, end, level, chainId) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(start.x));
  line.setAttribute("y1", String(start.y));
  line.setAttribute("x2", String(end.x));
  line.setAttribute("y2", String(end.y));
  line.setAttribute("class", `trait-chain-link level-${level}`);
  line.setAttribute("stroke", `url(#trait-chain-link-gradient-${chainId || "selected"})`);
  line.setAttribute("stroke-width", String(level >= 4 ? 8 : level >= 3 ? 7 : 6));
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("opacity", "0.98");
  return line;
}

function createSvgChainDot(point) {
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

function createPanelSignature(chains, selectedChain) {
  return JSON.stringify({
    activeDetailId: selectedChain?.id || null,
    chains: chains.map(chain => ({
      id: chain.id,
      level: chain.level,
      traits: chain.traits,
      segmentStartIndex: chain.segmentStartIndex,
      slots: chain.path.map(item => item.slot.key),
      players: chain.path.map(item => item.player.id)
    }))
  });
}

function createOverlaySignature(chains, pitchRect) {
  return JSON.stringify({
    selected: activeDetailId,
    width: Math.round(pitchRect.width),
    height: Math.round(pitchRect.height),
    chains: chains.map(chain => ({
      id: chain.id,
      level: chain.level,
      segmentStartIndex: chain.segmentStartIndex,
      slots: chain.path.map(item => item.slot.key),
      players: chain.path.map(item => item.player.id)
    }))
  });
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

function safeGetActiveTraitChains(team) {
  try {
    return getActiveTraitChains(team);
  } catch (error) {
    console.error("Trait chain calculation failed", error);
    return [];
  }
}
