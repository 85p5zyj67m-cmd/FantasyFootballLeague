import { getFormationById } from "../../formations.js";
import {
  getBenchPlayers,
  getPlayersBySlot,
  getSlotsFromFormation,
  movePlayer
} from "../../lineup.js";
import { appState, userTeam } from "../linearState.js";
import { startLinearSeason } from "../seasonFlow.js?v=second-half-route-1";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";

let selectedPlayerId = null;

export function renderPage05Tactics() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 5",
    title: "My Team",
    subtitle: "Set your starting eleven and tactics before the season starts."
  });

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
  const wrapper = document.createElement("div");
  wrapper.className = "linear-s11-view";

  const hint = document.createElement("p");
  hint.className = "subtitle";
  hint.textContent = "Drag players onto matching positions, or tap a player and then a position.";
  wrapper.appendChild(hint);

  wrapper.appendChild(createPitch(userTeam()));
  wrapper.appendChild(createBench(userTeam()));
  return wrapper;
}

function renderTacticsView() {
  const team = userTeam();
  team.tactics = team.tactics || defaultTactics();

  const wrapper = document.createElement("div");
  wrapper.className = "linear-tactics-view";
  wrapper.appendChild(createTacticSelect(team, "playStyle", "Play Style", ["Balanced", "Possession", "Counter Attack", "High Press", "Defensive Block"]));
  wrapper.appendChild(createTacticSelect(team, "mentality", "Mentality", ["Defensive", "Balanced", "Attacking"]));
  wrapper.appendChild(createTacticSelect(team, "pressing", "Pressing", ["Low Block", "Medium Press", "High Press"]));
  wrapper.appendChild(createTacticSelect(team, "defensiveLine", "Defensive Line", ["Deep Line", "Normal Line", "High Line"]));
  wrapper.appendChild(createTacticSelect(team, "passing", "Passing", ["Short Passing", "Mixed Passing", "Direct Passing"]));
  wrapper.appendChild(createTacticSelect(team, "tempo", "Tempo", ["Slow Tempo", "Normal Tempo", "Fast Tempo"]));
  wrapper.appendChild(createTacticSelect(team, "risk", "Risk", ["Safe Risk", "Balanced Risk", "High Risk"]));
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
  label.className = "linear-tactic-control";

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
  pitch.className = "linear-pitch";

  const lines = new Map();
  slots.forEach(slot => {
    const line = slot.key.split("-")[0];
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push(slot);
  });

  Array.from(lines.values()).forEach(lineSlots => {
    const line = document.createElement("div");
    line.className = "linear-pitch-line";
    lineSlots.forEach(slot => line.appendChild(createSlot(team, slot, playersBySlot.get(slot.key))));
    pitch.appendChild(line);
  });

  return pitch;
}

function createSlot(team, slot, player) {
  const box = document.createElement("div");
  box.className = "linear-slot";
  box.dataset.slot = slot.key;
  box.dataset.position = slot.position;

  const position = document.createElement("strong");
  position.textContent = slot.position;
  const name = document.createElement("span");
  name.textContent = player ? player.name : "Empty";
  const overall = document.createElement("small");
  overall.textContent = player ? String(player.overall) : "";
  box.append(position, name, overall);

  if (player) {
    box.draggable = true;
    box.dataset.playerId = player.id;
    box.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", player.id));
    box.addEventListener("click", () => {
      if (selectedPlayerId && selectedPlayerId !== player.id) {
        moveSelectedPlayer(team, slot.key);
        return;
      }
      selectedPlayerId = player.id;
      renderPage05Tactics();
    });
  } else {
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
  bench.className = "linear-bench";

  const heading = document.createElement("h3");
  heading.textContent = "Bench";
  bench.appendChild(heading);

  const players = document.createElement("div");
  players.className = "linear-bench-list";

  getBenchPlayers(team).forEach(player => {
    const item = document.createElement("div");
    item.className = "linear-bench-player";
    item.textContent = `${player.position} - ${player.name} - ${player.overall}`;
    item.draggable = true;
    item.dataset.playerId = player.id;
    item.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", player.id));
    item.addEventListener("click", () => {
      selectedPlayerId = player.id;
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

function moveSelectedPlayer(team, slotKey) {
  if (!selectedPlayerId) return;
  movePlayer(team, selectedPlayerId, slotKey);
  selectedPlayerId = null;
  renderPage05Tactics();
}
