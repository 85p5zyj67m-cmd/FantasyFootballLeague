import { userTeam } from "./linearState.js";

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

const COUNTER_TEXT = [
  "Direct Runs punish a High Line, but Deep Compact can slow them down.",
  "High Press is strong against Short Build Up, but risky against Direct Build Up and Fast Transitions.",
  "Wing Play and Set Pieces help against Deep Compact, while Man Oriented can disrupt Wing Play.",
  "Cutbacks are strong against Man Oriented; Through Balls are strong against a High Line.",
  "All In can break a Low Block, but High Press or Counter Press can punish it hard."
];

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

function createGuideCard(team) {
  const card = document.createElement("div");
  card.className = "linear-mini-card counter-tactics-card";

  const title = document.createElement("strong");
  title.textContent = "Tactical Counter Rules";

  const current = document.createElement("p");
  current.textContent = `Current plan: ${team.tactics.attackingPlan}, ${team.tactics.pressingPlan}, ${team.tactics.defensiveShape}, ${team.tactics.chanceFocus}.`;

  const list = document.createElement("ul");
  COUNTER_TEXT.forEach(text => {
    const item = document.createElement("li");
    item.textContent = text;
    list.appendChild(item);
  });

  const note = document.createElement("p");
  note.className = "counter-tactics-note";
  note.textContent = "Each chain strengthens a specific engine variable. Your tactics decide how often that variable actually matters during the match.";

  card.append(title, current, list, note);
  return card;
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
    .counter-tactics-grid { gap: 12px; }
    .counter-tactic-control small { display: block; margin-top: 5px; opacity: .72; font-size: .74rem; line-height: 1.25; }
    .counter-tactics-card { margin: 12px 0; padding: 14px; }
    .counter-tactics-card strong { display: block; margin-bottom: 8px; }
    .counter-tactics-card p { margin: 0 0 8px; opacity: .86; }
    .counter-tactics-card ul { margin: 8px 0; padding-left: 18px; display: grid; gap: 5px; }
    .counter-tactics-card li { opacity: .82; line-height: 1.25; }
    .counter-tactics-note { margin-top: 10px !important; color: #baf7ce; }
  `;
  document.head.appendChild(style);
}
