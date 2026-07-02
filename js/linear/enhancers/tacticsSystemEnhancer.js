import { userTeam } from "../linearState.js";
import { getActiveTraitChains } from "../../traitChainEngine.js?v=balanced-trait-recipes-1";

const TACTIC_FIELDS = [
  {
    key: "attackingPlan",
    label: "Attacking Plan",
    help: "How you create chances. This can be countered by the opponent's defensive setup.",
    options: ["Balanced Attack", "Wing Play", "Central Overload", "Direct Runs", "Patient Build Up", "Long Shot Pressure"]
  },
  {
    key: "pressingPlan",
    label: "Pressing Plan",
    help: "How you disrupt the opponent's build-up. Strong or weak against specific build-up plans.",
    options: ["Low Block", "Mid Block", "High Press", "Counter Press"]
  },
  {
    key: "defensiveShape",
    label: "Defensive Shape",
    help: "Your defensive base shape. It counters some attacking patterns but opens other spaces.",
    options: ["Deep Compact", "Balanced Line", "High Line", "Man Oriented"]
  },
  {
    key: "buildUpPlan",
    label: "Build-Up Plan",
    help: "How you move the ball forward. It can beat pressing or get trapped by it.",
    options: ["Short Build Up", "Mixed Build Up", "Direct Build Up", "Fast Transitions"]
  },
  {
    key: "chanceFocus",
    label: "Chance Focus",
    help: "Which type of finish you force. This works especially well with matching chains.",
    options: ["Best Chance", "Crosses", "Through Balls", "Cutbacks", "Set Pieces", "Box Crashes"]
  },
  {
    key: "riskLevel",
    label: "Risk Level",
    help: "More risk increases pressure and goals, but makes you more vulnerable to counters.",
    options: ["Safe", "Balanced", "Brave", "All In"]
  }
];

const DEFAULT_TACTICS = {
  attackingPlan: "Balanced Attack",
  pressingPlan: "Mid Block",
  defensiveShape: "Balanced Line",
  buildUpPlan: "Mixed Build Up",
  chanceFocus: "Best Chance",
  riskLevel: "Balanced"
};

let observer = null;
let queued = false;
let lastSignature = "";

export function installTacticsSystemEnhancer() {
  if (observer) return;

  observer = new MutationObserver(mutations => {
    const shouldRefresh = mutations.some(mutation =>
      Array.from(mutation.addedNodes).some(node => node.nodeType === 1 && (node.matches?.(".linear-tactics-view") || node.querySelector?.(".linear-tactics-view")))
    );
    if (shouldRefresh) queueTacticsEnhancement();
  });

  observer.observe(document.getElementById("app"), { childList: true, subtree: true });
  window.addEventListener("change", queueTacticsEnhancement, true);
  queueTacticsEnhancement();
}

function queueTacticsEnhancement() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    enhanceTacticsView();
  });
}

function enhanceTacticsView() {
  const view = document.querySelector(".linear-tactics-view");
  const controls = view?.querySelector(".linear-tactics-controls-grid");
  if (!view || !controls) {
    lastSignature = "";
    return;
  }

  const team = userTeam();
  ensureTactics(team);
  const signature = createSignature(team);

  if (controls.dataset.tacticalCounterUi === "1" && signature === lastSignature) return;

  controls.dataset.tacticalCounterUi = "1";
  controls.innerHTML = "";
  controls.classList.add("counter-tactics-grid");
  TACTIC_FIELDS.forEach(field => controls.appendChild(createTacticControl(team, field)));

  let guide = view.querySelector(".counter-tactics-guide");
  if (!guide) {
    guide = document.createElement("section");
    guide.className = "counter-tactics-guide";
    controls.insertAdjacentElement("afterend", guide);
  }
  guide.replaceChildren(createGuideCard(team));
  installTacticsStyles();
  lastSignature = signature;
}

function createTacticControl(team, field) {
  const label = document.createElement("label");
  label.className = "linear-tactic-control compact counter-tactic-control";

  const span = document.createElement("span");
  span.textContent = field.label;

  const select = document.createElement("select");
  field.options.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  select.value = team.tactics[field.key] || DEFAULT_TACTICS[field.key];
  select.addEventListener("change", () => {
    team.tactics[field.key] = select.value;
    lastSignature = "";
    queueTacticsEnhancement();
  });

  const help = document.createElement("small");
  help.textContent = field.help;

  label.append(span, select, help);
  return label;
}

const TACTIC_SUMMARY = {
  attackingPlan: {
    "Balanced Attack": "a balanced attack that doesn't overcommit to one plan",
    "Wing Play": "wide overloads down the flanks",
    "Central Overload": "central combinations through the middle",
    "Direct Runs": "quick direct runs in behind",
    "Patient Build Up": "patient, possession-first buildup",
    "Long Shot Pressure": "shooting from distance to stretch defenses"
  },
  pressingPlan: {
    "Low Block": "a low block that sits back and conserves energy",
    "Mid Block": "a mid block that balances risk and control",
    "High Press": "an aggressive high press to win the ball early",
    "Counter Press": "an immediate counter-press the moment you lose it"
  },
  defensiveShape: {
    "Deep Compact": "a deep, compact defensive shape",
    "Balanced Line": "a balanced defensive line",
    "High Line": "a high line that squeezes space",
    "Man Oriented": "man-oriented marking"
  },
  buildUpPlan: {
    "Short Build Up": "short passing out from the back",
    "Mixed Build Up": "a mixed buildup that adapts as it goes",
    "Direct Build Up": "long, direct buildup",
    "Fast Transitions": "fast transitions the moment you win the ball"
  },
  chanceFocus: {
    "Best Chance": "whatever chance is on, without forcing it",
    "Crosses": "crosses into the box",
    "Through Balls": "through balls in behind the line",
    "Cutbacks": "cutbacks from the byline",
    "Set Pieces": "set-piece routines",
    "Box Crashes": "bodies crashing the box for second balls"
  },
  riskLevel: {
    "Safe": "a safe, low-risk approach",
    "Balanced": "a balanced risk appetite",
    "Brave": "a brave, front-footed approach",
    "All In": "an all-in, high-risk gamble"
  }
};

const CHAIN_KEYWORDS = {
  "Wing Play": ["wing", "wide", "cross"],
  "Crosses": ["cross"],
  "Through Balls": ["through ball", "behind the defense", "runs behind"],
  "Cutbacks": ["cutback", "low cross", "box"],
  "Set Pieces": ["set piece", "set-piece"],
  "Box Crashes": ["box", "header", "aerial"],
  "High Press": ["press", "high recover"],
  "Counter Press": ["press", "recover"],
  "Direct Runs": ["direct", "transition", "behind"],
  "Fast Transitions": ["transition", "direct"],
  "Central Overload": ["central", "half-space", "combinat"],
  "Patient Build Up": ["build-up", "buildup", "possession"],
  "Short Build Up": ["build-up", "buildup", "possession"]
};

function createGuideCard(team) {
  const card = document.createElement("div");
  card.className = "linear-mini-card counter-tactics-card";

  const title = document.createElement("strong");
  title.textContent = "Your Tactical Analysis";
  card.appendChild(title);

  const summary = document.createElement("p");
  summary.textContent = buildTacticSummary(team.tactics);
  card.appendChild(summary);

  const synergies = findChainSynergies(team);
  if (synergies.length) {
    const synergyBox = document.createElement("div");
    synergyBox.className = "counter-tactics-synergy";

    const synergyTitle = document.createElement("strong");
    synergyTitle.textContent = "⚡ Working with your trait chains";
    synergyBox.appendChild(synergyTitle);

    const list = document.createElement("ul");
    synergies.forEach(text => {
      const item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    synergyBox.appendChild(list);
    card.appendChild(synergyBox);
  } else {
    const note = document.createElement("p");
    note.className = "counter-tactics-note";
    note.textContent = "No tactic is currently reinforcing one of your active trait chains. Match a setting above to a chain's effect (e.g. Crosses with a crossing chain) to add a synergy bonus.";
    card.appendChild(note);
  }

  return card;
}

function buildTacticSummary(tactics) {
  const attacking = TACTIC_SUMMARY.attackingPlan[tactics.attackingPlan] || tactics.attackingPlan;
  const buildUp = TACTIC_SUMMARY.buildUpPlan[tactics.buildUpPlan] || tactics.buildUpPlan;
  const focus = TACTIC_SUMMARY.chanceFocus[tactics.chanceFocus] || tactics.chanceFocus;
  const pressing = TACTIC_SUMMARY.pressingPlan[tactics.pressingPlan] || tactics.pressingPlan;
  const shape = TACTIC_SUMMARY.defensiveShape[tactics.defensiveShape] || tactics.defensiveShape;
  const risk = TACTIC_SUMMARY.riskLevel[tactics.riskLevel] || tactics.riskLevel;

  return `Your team plays ${attacking}, building through ${buildUp} to create ${focus}. Out of possession you rely on ${pressing} in front of ${shape}, with ${risk}.`;
}

function findChainSynergies(team) {
  let chains = [];
  try {
    chains = getActiveTraitChains(team) || [];
  } catch (error) {
    chains = [];
  }
  if (!chains.length) return [];

  const results = [];
  TACTIC_FIELDS.forEach(field => {
    const value = team.tactics[field.key];
    const keywords = CHAIN_KEYWORDS[value];
    if (!keywords) return;

    const match = chains.find(chain => {
      const haystack = `${chain.name} ${chain.effect}`.toLowerCase();
      return keywords.some(keyword => haystack.includes(keyword));
    });

    if (match) {
      results.push(`${field.label} "${value}" reinforces your ${match.name} (Lv.${match.level}) — ${match.effect}.`);
    }
  });

  return results;
}

function ensureTactics(team) {
  const old = team.tactics || {};
  team.tactics = {
    ...DEFAULT_TACTICS,
    ...translateLegacyTactics(old),
    ...pickModernTactics(old)
  };
}

function translateLegacyTactics(old) {
  const next = {};
  if (old.mentality === "Defensive") next.riskLevel = "Safe";
  if (old.mentality === "Attacking") next.riskLevel = "Brave";
  if (old.pressing === "Low Block") next.pressingPlan = "Low Block";
  if (old.pressing === "High Press") next.pressingPlan = "High Press";
  if (old.defensiveLine === "Deep Line") next.defensiveShape = "Deep Compact";
  if (old.defensiveLine === "High Line") next.defensiveShape = "High Line";
  if (old.passing === "Short Passing") next.buildUpPlan = "Short Build Up";
  if (old.passing === "Direct Passing") next.buildUpPlan = "Direct Build Up";
  if (old.tempo === "Fast Tempo") next.buildUpPlan = "Fast Transitions";
  if (old.risk === "High Risk") next.riskLevel = "Brave";
  if (old.risk === "Safe Risk") next.riskLevel = "Safe";
  return next;
}

function pickModernTactics(old) {
  const next = {};
  TACTIC_FIELDS.forEach(field => {
    if (field.options.includes(old[field.key])) next[field.key] = old[field.key];
  });
  return next;
}

function createSignature(team) {
  return TACTIC_FIELDS.map(field => `${field.key}:${team.tactics[field.key]}`).join("|");
}

function installTacticsStyles() {
  if (document.getElementById("counter-tactics-styles")) return;
  const style = document.createElement("style");
  style.id = "counter-tactics-styles";
  style.textContent = `
    .counter-tactics-grid {
      gap: 12px;
      align-items: stretch;
    }
    .counter-tactic-control {
      display: flex;
      flex-direction: column;
    }
    .counter-tactic-control small {
      display: block;
      margin-top: 5px;
      opacity: .72;
      font-size: .74rem;
      line-height: 1.3;
      min-height: 3.9em;
    }
    .counter-tactics-card {
      margin: 12px 0;
      padding: 14px;
    }
    .counter-tactics-card strong {
      display: block;
      margin-bottom: 8px;
      color: #d1b36e !important;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .counter-tactics-card > p {
      margin: 0 0 8px;
      opacity: .9;
      line-height: 1.45;
    }
    .counter-tactics-synergy {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(209, 179, 110, 0.35) !important;
      background: rgba(209, 179, 110, 0.08) !important;
    }
    .counter-tactics-synergy strong {
      margin-bottom: 6px;
      color: #f2d68a !important;
    }
    .counter-tactics-synergy ul {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 5px;
    }
    .counter-tactics-synergy li {
      opacity: .92;
      line-height: 1.35;
      font-size: 12.5px;
    }
    .counter-tactics-note {
      margin-top: 10px !important;
      opacity: .7;
      font-size: 12.5px;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(style);
}
