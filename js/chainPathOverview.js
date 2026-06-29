import { FORMATIONS } from "./formations.js?v=detailed-formations-2";
import { TRAIT_CHAINS } from "./traitChains.js?v=chain-engine-1";

const X_BY_LINE_LENGTH = {
  1: [0],
  2: [-0.5, 0.5],
  3: [-1, 0, 1],
  4: [-1, -0.34, 0.34, 1],
  5: [-1, -0.5, 0, 0.5, 1]
};

const MAX_PLAYERS_PER_STEP = 10;

const state = {
  players: [],
  report: [],
  formation: "ALL",
  chain: "ALL",
  level: "ALL",
  onlyWithPaths: true
};

init();

async function init() {
  const players = await loadPlayers();
  state.players = players;
  state.report = buildReport(players);
  renderControls();
  renderSummary();
  renderReport();
}

async function loadPlayers() {
  const response = await fetch("players.csv?v=chain-path-overview-1");
  const text = await response.text();
  return parseCsv(text).map((row, index) => ({
    id: `${row.Name}-${row.Year}-${row.Club}-${index}`,
    name: row.Name,
    year: row.Year,
    club: row.Club,
    nationality: row.Nationality,
    overall: Number(row.Overall || 0),
    positions: splitList(row.Position),
    traits: [row["First Trait"], row["Second Trait"], row["Third Trait"]]
      .map(value => String(value || "").trim())
      .filter(Boolean)
  }));
}

function buildReport(players) {
  return FORMATIONS.map(formation => {
    const slots = getFormationSlots(formation);
    const chains = TRAIT_CHAINS.map(chain => {
      const levels = chain.levels.map(level => {
        const paths = findPathsForLevel(level.traits, slots, players);
        return {
          ...level,
          paths
        };
      });

      return {
        id: chain.id,
        name: chain.name,
        summary: chain.summary,
        levels
      };
    });

    return {
      id: formation.id,
      name: formation.name,
      shape: formation.lines.map(line => line.join(" ")).join(" / "),
      chains
    };
  });
}

function findPathsForLevel(traits, slots, players) {
  const directions = [
    { label: "forward", traits },
    { label: "reverse", traits: [...traits].reverse() }
  ];

  const paths = [];
  const seen = new Set();

  directions.forEach(direction => {
    const candidatesByTrait = direction.traits.map(trait =>
      slots
        .map(slot => ({
          slot,
          trait,
          players: findPlayersForTraitAndSlot(players, trait, slot.position)
        }))
        .filter(item => item.players.length)
    );

    if (candidatesByTrait.some(items => items.length === 0)) return;

    function walk(index, usedSlotKeys, path, score) {
      if (index >= direction.traits.length) {
        const key = `${direction.label}:${path.map(item => item.slot.key).join(">")}::${path.map(item => item.trait).join(">")}`;
        if (!seen.has(key)) {
          seen.add(key);
          paths.push({
            direction: direction.label,
            score,
            steps: path
          });
        }
        return;
      }

      const candidates = candidatesByTrait[index]
        .filter(item => {
          if (usedSlotKeys.has(item.slot.key)) return false;
          if (!path.length) return true;
          return getAdjacencyScore(path[path.length - 1].slot, item.slot) !== null;
        })
        .sort((a, b) => {
          if (!path.length) return a.slot.y - b.slot.y || a.slot.x - b.slot.x;
          return getAdjacencyScore(path[path.length - 1].slot, a.slot) - getAdjacencyScore(path[path.length - 1].slot, b.slot);
        });

      candidates.forEach(candidate => {
        const nextUsed = new Set(usedSlotKeys);
        nextUsed.add(candidate.slot.key);
        const linkScore = path.length ? getAdjacencyScore(path[path.length - 1].slot, candidate.slot) : 0;
        walk(index + 1, nextUsed, [...path, candidate], score + linkScore);
      });
    }

    walk(0, new Set(), [], 0);
  });

  return paths.sort((a, b) => a.score - b.score);
}

function findPlayersForTraitAndSlot(players, trait, slotPosition) {
  const normalizedTrait = normalize(trait);
  return players
    .filter(player => player.traits.some(playerTrait => normalize(playerTrait) === normalizedTrait))
    .filter(player => canPlaySlot(player, slotPosition))
    .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
}

function canPlaySlot(player, slotPosition) {
  const target = String(slotPosition || "").trim().toUpperCase();
  if (!target) return false;
  if (player.positions.includes(target)) return true;

  // Same one-way rule as the game: CM can fill CDM, but CDM-only cannot fill CM.
  if (target === "CDM" && player.positions.includes("CM")) return true;

  return false;
}

function getFormationSlots(formation) {
  const slots = [];

  formation.lines.forEach((line, lineIndex) => {
    const xs = X_BY_LINE_LENGTH[line.length] || [0];
    line.forEach((position, slotIndex) => {
      slots.push({
        key: `${lineIndex}-${slotIndex}`,
        label: `${position} ${lineIndex}-${slotIndex}`,
        position,
        lineIndex,
        slotIndex,
        x: xs[slotIndex] ?? 0,
        y: lineIndex
      });
    });
  });

  return slots;
}

function getAdjacencyScore(a, b) {
  if (!a || !b) return null;

  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const directDistance = Math.sqrt(dx * dx + dy * dy);

  if (directDistance <= 1.18) return directDistance;
  if (dx <= 0.42 && dy <= 2.1) return directDistance + 0.25;
  if (Math.abs(a.x) <= 0.42 && Math.abs(b.x) <= 0.42 && dy <= 2.1) return directDistance + 0.35;

  return null;
}

function renderControls() {
  const controls = document.getElementById("controls");
  controls.replaceChildren();

  const formationSelect = makeSelect(
    "Formation",
    "formation",
    [{ value: "ALL", label: "All formations" }, ...FORMATIONS.map(f => ({ value: f.id, label: f.name }))],
    state.formation
  );

  const chainSelect = makeSelect(
    "Chain",
    "chain",
    [{ value: "ALL", label: "All chains" }, ...TRAIT_CHAINS.map(c => ({ value: c.id, label: c.name }))],
    state.chain
  );

  const levelSelect = makeSelect(
    "Level",
    "level",
    ["ALL", "2", "3", "4"].map(value => ({ value, label: value === "ALL" ? "All levels" : `Lv.${value}` })),
    state.level
  );

  const checkbox = document.createElement("label");
  checkbox.className = "toggle";
  checkbox.innerHTML = `<input type="checkbox" ${state.onlyWithPaths ? "checked" : ""} /> Only possible paths`;
  checkbox.querySelector("input").addEventListener("change", event => {
    state.onlyWithPaths = event.target.checked;
    renderSummary();
    renderReport();
  });

  controls.append(formationSelect, chainSelect, levelSelect, checkbox);
}

function makeSelect(label, key, options, selectedValue) {
  const wrapper = document.createElement("label");
  wrapper.className = "control";

  const span = document.createElement("span");
  span.textContent = label;

  const select = document.createElement("select");
  options.forEach(optionData => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.appendChild(option);
  });
  select.value = selectedValue;
  select.addEventListener("change", event => {
    state[key] = event.target.value;
    renderSummary();
    renderReport();
  });

  wrapper.append(span, select);
  return wrapper;
}

function renderSummary() {
  const summary = document.getElementById("summary");
  const rows = getFilteredRows();
  const pathCount = rows.reduce((sum, row) => sum + row.level.paths.length, 0);
  const possibleLevels = rows.filter(row => row.level.paths.length).length;
  const formations = new Set(rows.map(row => row.formation.id)).size;
  const chains = new Set(rows.map(row => row.chain.id)).size;

  summary.innerHTML = `
    <div><strong>${formations}</strong><span>formations</span></div>
    <div><strong>${chains}</strong><span>chains</span></div>
    <div><strong>${possibleLevels}</strong><span>possible chain levels</span></div>
    <div><strong>${pathCount}</strong><span>slot paths</span></div>
  `;
}

function renderReport() {
  const container = document.getElementById("report");
  container.replaceChildren();

  const rows = getFilteredRows();

  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No chain paths match the current filters.";
    container.appendChild(empty);
    return;
  }

  const grouped = groupRows(rows);

  grouped.forEach(group => {
    const section = document.createElement("section");
    section.className = "formation-section";

    const header = document.createElement("header");
    header.innerHTML = `<h2>${escapeHtml(group.formation.name)}</h2><p>${escapeHtml(group.formation.shape)}</p>`;
    section.appendChild(header);

    group.rows.forEach(row => {
      const card = document.createElement("article");
      card.className = row.level.paths.length ? "chain-card possible" : "chain-card impossible";

      const title = document.createElement("button");
      title.type = "button";
      title.className = "chain-title";
      title.innerHTML = `
        <span>${escapeHtml(row.chain.name)} - Lv.${row.level.size}</span>
        <strong>${row.level.paths.length} paths</strong>
      `;

      const body = document.createElement("div");
      body.className = "chain-body";
      body.hidden = true;

      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = `${row.level.traits.join(" -> ")} | ${row.level.effect} | ${row.level.winChance}`;
      body.appendChild(meta);

      if (row.level.paths.length) {
        row.level.paths.forEach((path, index) => {
          body.appendChild(renderPath(path, index));
        });
      } else {
        const impossible = document.createElement("p");
        impossible.className = "empty small";
        impossible.textContent = "No valid connected slot path with available players for this level.";
        body.appendChild(impossible);
      }

      title.addEventListener("click", () => {
        body.hidden = !body.hidden;
        card.classList.toggle("open", !body.hidden);
      });

      card.append(title, body);
      section.appendChild(card);
    });

    container.appendChild(section);
  });
}

function renderPath(path, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "path-card";

  const head = document.createElement("h3");
  head.textContent = `Path ${index + 1} (${path.direction})`;
  wrapper.appendChild(head);

  const steps = document.createElement("div");
  steps.className = "path-steps";

  path.steps.forEach((step, stepIndex) => {
    const box = document.createElement("div");
    box.className = "path-step";

    const playersText = formatPlayers(step.players);
    box.innerHTML = `
      <strong>${escapeHtml(step.trait)}</strong>
      <span>${escapeHtml(step.slot.position)} slot ${escapeHtml(step.slot.key)}</span>
      <p>${playersText}</p>
    `;

    steps.appendChild(box);

    if (stepIndex < path.steps.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "arrow";
      arrow.textContent = "->";
      steps.appendChild(arrow);
    }
  });

  wrapper.appendChild(steps);
  return wrapper;
}

function getFilteredRows() {
  const rows = [];

  state.report.forEach(formation => {
    if (state.formation !== "ALL" && formation.id !== state.formation) return;

    formation.chains.forEach(chain => {
      if (state.chain !== "ALL" && chain.id !== state.chain) return;

      chain.levels.forEach(level => {
        if (state.level !== "ALL" && String(level.size) !== state.level) return;
        if (state.onlyWithPaths && !level.paths.length) return;
        rows.push({ formation, chain, level });
      });
    });
  });

  return rows;
}

function groupRows(rows) {
  const map = new Map();
  rows.forEach(row => {
    if (!map.has(row.formation.id)) {
      map.set(row.formation.id, { formation: row.formation, rows: [] });
    }
    map.get(row.formation.id).rows.push(row);
  });
  return Array.from(map.values());
}

function formatPlayers(players) {
  const visible = players.slice(0, MAX_PLAYERS_PER_STEP);
  const names = visible.map(player => `${escapeHtml(player.name)} ${escapeHtml(player.year)} (${player.overall})`).join(", ");
  const rest = players.length > MAX_PLAYERS_PER_STEP ? ` <em>+${players.length - MAX_PLAYERS_PER_STEP} more</em>` : "";
  return `${names}${rest}`;
}

function parseCsv(text) {
  const rows = [];
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);

  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  });

  return rows;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim().toUpperCase())
    .filter(Boolean);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
