import { getActiveTraitChains } from "../traitChainEngine.js?v=chain-engine-1";
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
  if (!s11View) return;
  if (s11View.querySelector(".trait-chain-panel")) return;

  const hint = s11View.querySelector(".compact-hint, .subtitle");
  const panel = createTraitChainPanel(userTeam());

  if (hint) {
    hint.insertAdjacentElement("afterend", panel);
  } else {
    s11View.prepend(panel);
  }

  markChainPlayers();
}

function createTraitChainPanel(team) {
  const chains = getActiveTraitChains(team);
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
  button.addEventListener("click", () => {
    activeDetailId = chain.id;
    const currentPanel = document.querySelector(".trait-chain-panel");
    if (!currentPanel) return;
    currentPanel.replaceWith(createTraitChainPanel(userTeam()));
    markChainPlayers();
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
  const team = userTeam();
  const chains = getActiveTraitChains(team);
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
