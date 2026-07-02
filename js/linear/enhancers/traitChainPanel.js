import { getActiveTraitChains } from "../../traitChainEngine.js?v=balanced-trait-recipes-1";
import { userTeam } from "../linearState.js";

let observer = null;
let queued = false;
let activeDetailId = null;
let lastSignature = "";
let lastOverlaySignature = "";

export function installTraitChainEnhancer() {
  if (observer) return;

  installTraitChainPanelStyles();

  const app = document.getElementById("app");
  if (!app) return;

  observer = new MutationObserver(() => queueEnhancement());
  observer.observe(app, { childList: true, subtree: true });

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
    lastSignature = "";
    lastOverlaySignature = "";
    return;
  }

  const chains = safeGetActiveTraitChains(userTeam());
  const selectedChain = getSelectedChain(chains);
  const signature = createPanelSignature(chains, selectedChain);
  const existingPanel = s11View.querySelector(".trait-chain-panel");

  if (!existingPanel || signature !== lastSignature) {
    const panel = createTraitChainPanel(chains, selectedChain);
    const hint = s11View.querySelector(".compact-hint, .subtitle");

    if (existingPanel) existingPanel.replaceWith(panel);
    else if (hint) hint.insertAdjacentElement("afterend", panel);
    else s11View.prepend(panel);

    lastSignature = signature;
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

  const isMaxed = chain.level >= chain.maxLevel;

  const top = document.createElement("div");
  top.className = "trait-chain-detail-top";

  const title = document.createElement("strong");
  title.textContent = `${chain.name} — Level ${chain.level}/${chain.maxLevel}`;

  const bonus = document.createElement("span");
  bonus.className = "trait-chain-bonus-pill";
  bonus.textContent = `Win chance ${chain.winChance}`;

  top.append(title, bonus);
  detail.appendChild(top);

  if (isMaxed) {
    const maxedBadge = document.createElement("div");
    maxedBadge.className = "trait-chain-maxed-badge";
    maxedBadge.textContent = "★ Maxed out — full chain built";
    detail.appendChild(maxedBadge);
  }

  const effect = document.createElement("p");
  effect.className = "trait-chain-effect";
  effect.textContent = `Effect: ${chain.effect}.`;
  detail.appendChild(effect);

  if (isMaxed) {
    detail.appendChild(createCurrentOrder(chain, "Your completed chain"));
  } else {
    detail.appendChild(createCurrentOrder(chain, "Already connected"));
    detail.appendChild(createCompleteChain(chain));
  }

  return detail;
}

function createCurrentOrder(chain, headlineText) {
  const guide = document.createElement("div");
  guide.className = "trait-chain-build-guide";

  const headline = document.createElement("strong");
  headline.textContent = headlineText;

  const steps = document.createElement("ol");
  steps.className = "trait-chain-steps";

  chain.path.forEach((item, index) => {
    const step = document.createElement("li");
    step.className = "chain-step filled";
    const trait = chain.traits[index] || "Trait";
    const order = document.createElement("span");
    order.className = "chain-step-check";
    order.textContent = "✓";
    const label = document.createElement("span");
    label.textContent = `${trait} — ${item.player.name} (${item.slot.position})`;
    step.append(order, label);
    steps.appendChild(step);
  });

  guide.append(headline, steps);
  return guide;
}

function createCompleteChain(chain) {
  const wrapper = document.createElement("div");
  wrapper.className = "trait-chain-roadmap";

  const segment = getCompleteSegment(chain);
  if (!segment) {
    const empty = document.createElement("p");
    empty.className = "trait-chain-max-note";
    empty.textContent = "Complete chain data unavailable.";
    wrapper.appendChild(empty);
    return wrapper;
  }

  const headline = document.createElement("strong");
  headline.textContent = `Add these to reach Level ${segment.size}`;
  wrapper.appendChild(headline);

  const reward = document.createElement("p");
  reward.className = "trait-chain-roadmap-reward";
  reward.textContent = `${segment.effect} · win chance ${segment.winChance}`;
  wrapper.appendChild(reward);

  const steps = document.createElement("ol");
  steps.className = "trait-chain-steps roadmap";

  const activeByTrait = getActiveItemsByTrait(chain);
  const traits = getDisplayTraitsForSegment(chain, segment);

  traits.forEach((trait, index) => {
    const normalized = normalizeTrait(trait);
    const activeItems = activeByTrait.get(normalized) || [];
    const item = activeItems.shift();
    const step = document.createElement("li");

    const marker = document.createElement("span");
    const label = document.createElement("span");

    if (item) {
      step.className = "chain-step filled";
      marker.className = "chain-step-check";
      marker.textContent = "✓";
      label.textContent = `${trait} — ${item.player.name} (${item.slot.position})`;
    } else {
      step.className = "chain-step missing";
      marker.className = "chain-step-missing-marker";
      marker.textContent = "+";
      label.textContent = `${trait} — still needed`;
    }

    step.append(marker, label);
    steps.appendChild(step);
  });

  wrapper.appendChild(steps);
  return wrapper;
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

function createPanelSignature(chains, selectedChain) {
  return JSON.stringify({
    activeDetailId: selectedChain?.id || null,
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

function installTraitChainPanelStyles() {
  if (document.getElementById("traitChainPanelStyles")) return;

  const style = document.createElement("style");
  style.id = "traitChainPanelStyles";
  style.textContent = `
    .trait-chain-panel {
      display: grid;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(209, 179, 110, 0.28) !important;
      background: linear-gradient(180deg, #16241a, #0a1510) !important;
      color: #f3ead7 !important;
    }

    .trait-chain-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #f3ead7 !important;
    }

    .trait-chain-header strong {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .trait-chain-header span {
      font-size: 11px;
      font-weight: 800;
      color: #d1b36e !important;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .trait-chain-empty {
      margin: 0;
      font-size: 12px;
      color: rgba(243, 234, 215, 0.72) !important;
      line-height: 1.4;
    }

    .trait-chain-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .trait-chain-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 11px;
      border-radius: 999px;
      border: 1px solid rgba(209, 179, 110, 0.32) !important;
      background: rgba(209, 179, 110, 0.08) !important;
      color: #f3ead7 !important;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
    }

    .trait-chain-chip strong {
      color: #d1b36e !important;
      font-size: 10px;
    }

    .trait-chain-chip.active {
      background: linear-gradient(135deg, #e0bd74, #c9a24d) !important;
      border-color: rgba(209, 179, 110, 0.7) !important;
      color: #2a1c06 !important;
    }

    .trait-chain-chip.active strong {
      color: #2a1c06 !important;
    }

    .trait-chain-detail {
      display: grid;
      gap: 8px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(209, 179, 110, 0.2) !important;
      background: rgba(0, 0, 0, 0.18) !important;
    }

    .trait-chain-detail-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    .trait-chain-detail-top strong {
      font-size: 13px;
      color: #f3ead7 !important;
      font-weight: 800;
    }

    .trait-chain-bonus-pill {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(209, 179, 110, 0.14) !important;
      color: #d1b36e !important;
      font-size: 11px;
      font-weight: 900;
      white-space: nowrap;
    }

    .trait-chain-maxed-badge {
      padding: 7px 12px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f2d68a, #d1b36e) !important;
      color: #2a1c06 !important;
      font-size: 12px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 0.02em;
    }

    .trait-chain-effect {
      margin: 0;
      font-size: 12px;
      color: rgba(243, 234, 215, 0.86) !important;
      line-height: 1.4;
    }

    .trait-chain-build-guide,
    .trait-chain-roadmap {
      display: grid;
      gap: 6px;
    }

    .trait-chain-build-guide strong,
    .trait-chain-roadmap strong {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #d1b36e !important;
    }

    .trait-chain-roadmap-reward {
      margin: 0;
      font-size: 11px;
      color: rgba(243, 234, 215, 0.72) !important;
    }

    .trait-chain-steps {
      list-style: none;
      display: grid;
      gap: 5px;
      margin: 0;
      padding: 0;
    }

    .chain-step {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 9px;
      font-size: 11.5px;
      line-height: 1.3;
    }

    .chain-step.filled {
      background: rgba(209, 179, 110, 0.1) !important;
      border: 1px solid rgba(209, 179, 110, 0.3) !important;
      color: #f3ead7 !important;
    }

    .chain-step.missing {
      background: rgba(255, 255, 255, 0.02) !important;
      border: 1px dashed rgba(243, 234, 215, 0.28) !important;
      color: rgba(243, 234, 215, 0.56) !important;
    }

    .chain-step-check {
      flex: 0 0 auto;
      display: inline-grid;
      place-items: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #65e58d !important;
      color: #06110b !important;
      font-size: 10px;
      font-weight: 900;
    }

    .chain-step-missing-marker {
      flex: 0 0 auto;
      display: inline-grid;
      place-items: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px dashed rgba(243, 234, 215, 0.4) !important;
      color: rgba(243, 234, 215, 0.5) !important;
      font-size: 10px;
      font-weight: 900;
    }
  `;
  document.head.appendChild(style);
}
