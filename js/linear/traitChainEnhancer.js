import { getActiveTraitChains } from "../traitChainEngine.js?v=chain-engine-3";
import { userTeam } from "./linearState.js";

let observer = null;
let queued = false;
let activeDetailId = null;

export function installTraitChainEnhancer() {
  if (observer) return;

  observer = new MutationObserver(queueEnhancement);
  observer.observe(document.getElementById("app"), {
    childList: true,
    subtree: true
  });

  window.addEventListener("click", queueEnhancement, true);
  window.addEventListener("change", queueEnhancement, true);
  window.addEventListener("dragend", queueEnhancement, true);
  window.addEventListener("drop", queueEnhancement, true);
  window.addEventListener("resize", queueEnhancement);
  window.addEventListener("scroll", queueEnhancement, true);

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
    return;
  }

  const hint = s11View.querySelector(".compact-hint, .subtitle");
  const existingPanel = s11View.querySelector(".trait-chain-panel");
  const panel = createTraitChainPanel(userTeam());

  if (existingPanel) {
    existingPanel.replaceWith(panel);
  } else if (hint) {
    hint.insertAdjacentElement("afterend", panel);
  } else {
    s11View.prepend(panel);
  }

  markChainPlayers();
  drawChainLinks();
}

function createTraitChainPanel(team) {
  const chains = safeGetActiveTraitChains(team);
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

  chains.forEach(chain => {
    const item = createChainButton(chain);
    list.appendChild(item);
  });

  panel.appendChild(list);

  const selectedChain = chains.find(chain => chain.id === activeDetailId) || chains[0];
  activeDetailId = selectedChain.id;
  panel.appendChild(createChainDetail(selectedChain));

  return panel;
}

function createChainButton(chain) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = chain.id === activeDetailId ? "trait-chain-chip active" : "trait-chain-chip";
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
  effect.textContent = chain.effect;

  const players = document.createElement("p");
  players.className = "trait-chain-players";
  players.textContent = chain.path
    .map((item, index) => `${chain.traits[index]}: ${item.player.name} (${item.slot.position})`)
    .join("  →  ");

  const upgrade = document.createElement("p");
  upgrade.className = "trait-chain-upgrade";
  upgrade.textContent = chain.nextLevel
    ? `Upgrade: ${chain.nextLevel.traits.join(" → ")} | ${chain.nextLevel.effect} | ${chain.nextLevel.winChance}`
    : "Max level reached.";

  detail.append(top, effect, players, upgrade);
  return detail;
}

function markChainPlayers() {
  const chains = safeGetActiveTraitChains(userTeam());
  const activeSlotKeys = new Set();

  chains.forEach(chain => {
    chain.path.forEach(item => activeSlotKeys.add(item.slot.key));
  });

  document.querySelectorAll(".linear-slot").forEach(slot => {
    slot.classList.remove("chain-active-slot");
    if (activeSlotKeys.has(slot.dataset.slot)) {
      slot.classList.add("chain-active-slot");
    }
  });

  document.querySelectorAll(".compact-player-line").forEach(line => {
    const activeInLine = line.querySelectorAll(".chain-active-slot").length;
    line.classList.toggle("chain-active-line", activeInLine > 1);
  });
}

function drawChainLinks() {
  const pitch = document.querySelector(".compact-player-pitch");
  if (!pitch) {
    removeChainOverlay();
    return;
  }

  const chains = safeGetActiveTraitChains(userTeam());
  const oldOverlay = pitch.querySelector(".trait-chain-link-overlay");
  if (oldOverlay) oldOverlay.remove();

  if (!chains.length) return;

  const pitchRect = pitch.getBoundingClientRect();
  const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.classList.add("trait-chain-link-overlay");
  overlay.setAttribute("viewBox", `0 0 ${pitchRect.width} ${pitchRect.height}`);
  overlay.setAttribute("preserveAspectRatio", "none");
  overlay.setAttribute("aria-hidden", "true");

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  gradient.setAttribute("id", "trait-chain-link-gradient");
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("x2", "100%");

  const stopA = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stopA.setAttribute("offset", "0%");
  stopA.setAttribute("stop-color", "#75ff9e");

  const stopB = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stopB.setAttribute("offset", "100%");
  stopB.setAttribute("stop-color", "#f7c95f");

  gradient.append(stopA, stopB);
  defs.appendChild(gradient);
  overlay.appendChild(defs);

  const drawnLinks = new Set();

  chains.forEach(chain => {
    chain.path.forEach((item, index) => {
      if (index === 0) return;
      const previous = chain.path[index - 1];
      const linkKey = [previous.slot.key, item.slot.key].sort().join("|");
      const exactKey = `${chain.id}:${previous.slot.key}->${item.slot.key}`;
      const key = drawnLinks.has(linkKey) ? exactKey : linkKey;
      drawnLinks.add(key);

      const start = getSlotCenter(previous.slot.key, pitchRect);
      const end = getSlotCenter(item.slot.key, pitchRect);
      if (!start || !end) return;

      overlay.appendChild(createSvgLine(start, end, chain.level));
      overlay.appendChild(createSvgChainDot(start));
      overlay.appendChild(createSvgChainDot(end));
    });
  });

  pitch.prepend(overlay);
}

function createSvgLine(start, end, level) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(start.x));
  line.setAttribute("y1", String(start.y));
  line.setAttribute("x2", String(end.x));
  line.setAttribute("y2", String(end.y));
  line.setAttribute("class", `trait-chain-link level-${level}`);
  return line;
}

function createSvgChainDot(point) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", String(point.x));
  circle.setAttribute("cy", String(point.y));
  circle.setAttribute("r", "4");
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

function safeGetActiveTraitChains(team) {
  try {
    return getActiveTraitChains(team);
  } catch (error) {
    console.error("Trait chain calculation failed", error);
    return [];
  }
}
