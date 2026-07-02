import { getFormationById } from "../../formations.js";
import {
  getBenchPlayers,
  getPlayersBySlot,
  getSlotsFromFormation,
  movePlayer
} from "../../lineup.js";
import { formatTraits, getDisplayPosition, getTraitList } from "../../playerUtils.js";
import { appState, userTeam } from "../linearState.js";
import { startLinearSeason } from "../seasonFlow.js?v=real-overall-system-balance-3";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js?v=pos-icons-5";

let selectedPlayerId = null;

export function renderPage05Tactics() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 5",
    title: "My Team",
    subtitle: "Set your starting eleven and tactics before the season starts."
  });

  shell.card.classList.add("linear-info-card-view", "linear-season-setup-card");
  shell.card.appendChild(createMyTeamTabs());

  if (appState.activeMyTeamView === "Tactics") {
    shell.card.appendChild(renderTacticsView());
  } else {
    shell.card.appendChild(renderStartingElevenView());
  }

  shell.card.appendChild(primaryButton("Start Season", () => {
    syncPlayStyleFromTactics();
    startLinearSeason();
  }));

  app.appendChild(shell.section);
}

function createMyTeamTabs() {
  const tabs = document.createElement("div");
  tabs.className = "linear-myteam-tabs";

  ["S11", "Tactics"].forEach(view => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = appState.activeMyTeamView === view ? "active" : "";
    button.textContent = view;
    button.addEventListener("click", () => {
      appState.activeMyTeamView = view;
      renderPage05Tactics();
    });
    tabs.appendChild(button);
  });

  return tabs;
}

function renderStartingElevenView() {
  const team = userTeam();
  const wrapper = document.createElement("div");
  wrapper.className = "linear-s11-view linear-info-card-view";

  wrapper.appendChild(createPitch(team));

  if (selectedPlayerId && team.lineup?.[selectedPlayerId] && team.lineup[selectedPlayerId] !== "BENCH") {
    wrapper.appendChild(createMoveToBenchAction(team));
  }

  wrapper.appendChild(createBench(team));
  wrapper.addEventListener("click", event => {
    if (!selectedPlayerId) return;
    if (event.target.closest(".linear-slot, .linear-bench-player, .linear-move-to-bench")) return;
    selectedPlayerId = null;
    renderPage05Tactics();
  });
  return wrapper;
}

function createMoveToBenchAction(team) {
  const bar = document.createElement("div");
  bar.className = "linear-move-to-bench";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Move Selected Player to Bench";
  button.addEventListener("click", event => {
    event.stopPropagation();
    moveSelectedPlayer(team, "BENCH");
  });

  bar.appendChild(button);
  return bar;
}

function renderTacticsView() {
  const team = userTeam();
  team.tactics = team.tactics || defaultTactics();

  const wrapper = document.createElement("div");
  wrapper.className = "linear-tactics-view linear-info-card-view";

  const controls = document.createElement("div");
  controls.className = "linear-tactics-controls-grid";
  controls.appendChild(createTacticSelect(team, "playStyle", "Play Style", ["Balanced", "Possession", "Counter Attack", "High Press", "Defensive Block"]));
  controls.appendChild(createTacticSelect(team, "mentality", "Mentality", ["Defensive", "Balanced", "Attacking"]));
  controls.appendChild(createTacticSelect(team, "pressing", "Pressing", ["Low Block", "Medium Press", "High Press"]));
  controls.appendChild(createTacticSelect(team, "defensiveLine", "Defensive Line", ["Deep Line", "Normal Line", "High Line"]));
  controls.appendChild(createTacticSelect(team, "passing", "Passing", ["Short Passing", "Mixed Passing", "Direct Passing"]));
  controls.appendChild(createTacticSelect(team, "tempo", "Tempo", ["Slow Tempo", "Normal Tempo", "Fast Tempo"]));
  controls.appendChild(createTacticSelect(team, "risk", "Risk", ["Safe Risk", "Balanced Risk", "High Risk"]));

  wrapper.appendChild(controls);
  wrapper.appendChild(createTacticsSquadOverview(team));
  return wrapper;
}

function defaultTactics() {
  return {
    playStyle: userTeam().playStyle || "Balanced",
    mentality: "Balanced",
    pressing: "Medium Press",
    defensiveLine: "Normal Line",
    passing: "Mixed Passing",
    tempo: "Normal Tempo",
    risk: "Balanced Risk"
  };
}

function createTacticSelect(team, key, labelText, options) {
  team.tactics = team.tactics || defaultTactics();

  const label = document.createElement("label");
  label.className = "linear-tactic-control compact";

  const span = document.createElement("span");
  span.textContent = labelText;

  const select = document.createElement("select");
  options.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  select.value = key === "playStyle" ? team.playStyle || team.tactics.playStyle || "Balanced" : team.tactics[key];
  select.addEventListener("change", () => {
    if (key === "playStyle") {
      team.playStyle = select.value;
      team.tactics.playStyle = select.value;
      return;
    }
    team.tactics[key] = select.value;
  });

  label.append(span, select);
  return label;
}

function syncPlayStyleFromTactics() {
  const team = userTeam();
  if (team.tactics?.playStyle) {
    team.playStyle = team.tactics.playStyle;
  }
}

function createPitch(team) {
  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);
  const playersBySlot = getPlayersBySlot(team);
  const pitch = document.createElement("div");
  pitch.className = "linear-pitch compact-player-pitch";

  const lines = new Map();
  slots.forEach(slot => {
    const line = slot.key.split("-")[0];
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push(slot);
  });

  Array.from(lines.values()).forEach(lineSlots => {
    const line = document.createElement("div");
    line.className = "linear-pitch-line compact-player-line";
    lineSlots.forEach(slot => line.appendChild(createSlot(team, slot, playersBySlot.get(slot.key))));
    pitch.appendChild(line);
  });

  return pitch;
}

function createSlot(team, slot, player) {
  const box = document.createElement("div");
  box.className = player ? "linear-slot linear-slot-card" : "linear-slot linear-empty-slot";
  box.dataset.slot = slot.key;
  box.dataset.position = slot.position;

  if (player) {
    box.appendChild(createPlayerInfoCard(player));
    box.draggable = true;
    box.dataset.playerId = player.id;
    box.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", player.id));
    box.addEventListener("click", () => {
      if (selectedPlayerId && selectedPlayerId !== player.id) {
        moveSelectedPlayer(team, slot.key);
        return;
      }
      selectedPlayerId = selectedPlayerId === player.id ? null : player.id;
      renderPage05Tactics();
    });
  } else {
    const position = document.createElement("strong");
    position.textContent = slot.position;
    const name = document.createElement("span");
    name.textContent = "Empty";
    box.append(position, name);
    box.addEventListener("click", () => moveSelectedPlayer(team, slot.key));
  }

  box.addEventListener("dragover", event => event.preventDefault());
  box.addEventListener("drop", event => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/plain");
    movePlayer(team, playerId, slot.key);
    selectedPlayerId = null;
    renderPage05Tactics();
  });

  if (selectedPlayerId && player && player.id === selectedPlayerId) {
    box.classList.add("selected");
  }

  return box;
}

function createBench(team) {
  const bench = document.createElement("div");
  bench.className = "linear-bench compact-player-bench";

  const heading = document.createElement("h3");
  heading.textContent = "Bench";
  bench.appendChild(heading);

  const players = document.createElement("div");
  players.className = "linear-bench-list compact-bench-grid";

  getBenchPlayers(team).forEach(player => {
    const item = document.createElement("div");
    item.className = "linear-bench-player linear-bench-card";
    item.appendChild(createPlayerInfoCard(player));
    item.draggable = true;
    item.dataset.playerId = player.id;
    item.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", player.id));
    item.addEventListener("click", () => {
      if (selectedPlayerId && selectedPlayerId !== player.id) {
        moveSelectedPlayer(team, "BENCH");
        return;
      }
      selectedPlayerId = selectedPlayerId === player.id ? null : player.id;
      renderPage05Tactics();
    });
    if (selectedPlayerId === player.id) {
      item.classList.add("selected");
    }
    players.appendChild(item);
  });

  bench.addEventListener("dragover", event => event.preventDefault());
  bench.addEventListener("drop", event => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/plain");
    movePlayer(team, playerId, "BENCH");
    selectedPlayerId = null;
    renderPage05Tactics();
  });

  bench.appendChild(players);
  return bench;
}

function createTacticsSquadOverview(team) {
  const section = document.createElement("div");
  section.className = "linear-tactics-squad";

  const heading = document.createElement("h3");
  heading.textContent = "Squad Cards";
  section.appendChild(heading);

  const playersBySlot = getPlayersBySlot(team);
  const starters = Array.from(playersBySlot.entries())
    .sort(([slotA], [slotB]) => slotA.localeCompare(slotB))
    .map(([, player]) => player);
  const bench = getBenchPlayers(team);
  const allVisible = [...starters, ...bench];

  const grid = document.createElement("div");
  grid.className = "linear-tactics-squad-grid";

  allVisible.forEach(player => {
    const card = document.createElement("div");
    card.className = "linear-tactics-player-card";
    card.appendChild(createPlayerInfoCard(player));
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function createPlayerInfoCard(player) {
  const card = document.createElement("div");
  card.className = "linear-info-player-card";

  const top = document.createElement("div");
  top.className = "linear-info-player-top";

  const rating = document.createElement("strong");
  rating.className = "linear-info-rating";
  rating.textContent = String(player.overall);

  const identity = document.createElement("div");
  identity.className = "linear-info-identity";

  const name = document.createElement("b");
  name.className = "linear-info-name";
  name.textContent = player.name;

  const position = document.createElement("span");
  position.className = "linear-info-position";
  position.textContent = getDisplayPosition(player);

  identity.append(name, position);
  top.append(rating, identity);

  const meta = document.createElement("div");
  meta.className = "linear-info-meta";

  const club = document.createElement("span");
  club.textContent = `${player.club} (${player.year})`;

  const country = document.createElement("span");
  country.textContent = player.nationality;

  meta.append(club, country);

  const traits = document.createElement("div");
  traits.className = "linear-info-traits";
  traits.title = formatTraits(player);
  const traitList = getTraitList(player);
  (traitList.length ? traitList : ["No traits"]).forEach(trait => {
    const chip = document.createElement("small");
    chip.textContent = trait;
    traits.appendChild(chip);
  });

  card.append(top, meta, traits);
  return card;
}

function moveSelectedPlayer(team, slotKey) {
  if (!selectedPlayerId) return;
  movePlayer(team, selectedPlayerId, slotKey);
  selectedPlayerId = null;
  renderPage05Tactics();
}
