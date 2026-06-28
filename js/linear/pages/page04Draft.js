import { GAME_CONFIG } from "../../config.js";
import { chooseAIPlayer } from "../../aiDraft.js";
import {
  draftPlayer,
  getNextUserPickDistances,
  getOrderThisRound,
  getPickInRound,
  getRound,
  getTeamOnClock,
  getVisiblePlayers,
  isDraftComplete
} from "../../draftRules.js";
import { getFormationById } from "../../formations.js";
import {
  autoPlacePlayer,
  getBenchPlayers,
  getPlayersBySlot,
  getSlotsFromFormation,
  movePlayer
} from "../../lineup.js";
import { appState, userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, playerCard } from "../pageUtils.js";

let aiTimer = null;
let selectedPlayerId = null;

const AI_SPEEDS = {
  normal: 650,
  fast: 90,
  instant: 1
};

export function renderPage04Draft() {
  if (isDraftComplete(appState.currentPick, appState.availablePlayers)) {
    clearAiTimer();
    goTo("page05");
    return;
  }

  const app = clearApp();
  const teamIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
  const team = appState.teams[teamIndex];
  const isUserTurn = team === userTeam();
  const round = getRound(appState.currentPick);
  const pickInRound = getPickInRound(appState.currentPick) + 1;

  const section = document.createElement("section");
  section.className = "linear-page linear-draft-page";

  const card = document.createElement("div");
  card.className = "linear-card linear-draft-card";

  card.appendChild(createDraftTopbar(round, pickInRound, team, isUserTurn));
  card.appendChild(createRoundPickCounter(round));
  card.appendChild(createDraftOrderTicker(teamIndex));
  card.appendChild(createDraftTabs());
  card.appendChild(createDraftView(isUserTurn));

  section.appendChild(card);
  app.appendChild(section);

  if (isUserTurn) {
    clearAiTimer();
  } else {
    scheduleAiPick(team);
  }
}

function createDraftTopbar(round, pickInRound, team, isUserTurn) {
  const topbar = document.createElement("div");
  topbar.className = "linear-draft-topbar";

  const info = document.createElement("div");
  const label = document.createElement("p");
  label.className = "eyebrow";
  label.textContent = "Live Snake Draft";

  const title = document.createElement("h1");
  title.textContent = `R${round}/${GAME_CONFIG.totalRounds} · P${pickInRound}`;

  const onClock = document.createElement("p");
  onClock.className = isUserTurn ? "linear-on-clock user" : "linear-on-clock";
  onClock.textContent = `${team.name} on clock`;

  info.append(label, title, onClock);

  const speedBox = document.createElement("label");
  speedBox.className = "linear-speed-box";
  const speedLabel = document.createElement("span");
  speedLabel.textContent = "AI Speed";
  const select = document.createElement("select");
  ["normal", "fast", "instant"].forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value[0].toUpperCase() + value.slice(1);
    select.appendChild(option);
  });
  select.value = appState.aiSpeed;
  select.addEventListener("change", () => {
    appState.aiSpeed = select.value;
    const activeIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
    const activeTeam = appState.teams[activeIndex];
    if (activeTeam && activeTeam !== userTeam()) {
      scheduleAiPick(activeTeam);
    }
  });
  speedBox.append(speedLabel, select);

  topbar.append(info, speedBox);
  return topbar;
}

function createRoundPickCounter(round) {
  const wrapper = document.createElement("div");
  wrapper.className = "linear-round-counter";

  const distances = getNextUserPickDistances(appState.currentPick, appState.draftOrder);
  wrapper.append(
    createCounterPill("Next", distances.next),
    createCounterPill("2nd", distances.second),
    createCounterPill("3rd", distances.third),
    createCounterPill("4th", distances.fourth)
  );

  const lastRoundPick = appState.draftLog.filter(pick => pick.round === round).at(-1);
  const ticker = document.createElement("div");
  ticker.className = "linear-round-picks";
  ticker.textContent = lastRoundPick
    ? `${lastRoundPick.teamName}: ${lastRoundPick.overall} · ${lastRoundPick.playerName} · ${lastRoundPick.position}`
    : "Waiting for the first pick of this round.";

  const block = document.createElement("div");
  block.className = "linear-counter-block";
  block.append(wrapper, ticker);
  return block;
}

function createCounterPill(label, value) {
  const pill = document.createElement("div");
  pill.className = "linear-counter-pill";
  const small = document.createElement("span");
  small.textContent = label;
  const big = document.createElement("strong");
  big.textContent = value;
  pill.append(small, big);
  return pill;
}

function createDraftOrderTicker(activeTeamIndex) {
  const ticker = document.createElement("div");
  ticker.className = "linear-order-ticker centered";
  const order = getOrderThisRound(appState.currentPick, appState.draftOrder);
  const activeOrderIndex = order.indexOf(activeTeamIndex);
  const visibleIndexes = getCenteredOrderIndexes(order.length, activeOrderIndex, 7);

  visibleIndexes.forEach(orderIndex => {
    const teamIndex = order[orderIndex];
    const item = document.createElement("span");
    item.className = teamIndex === activeTeamIndex ? "active" : orderIndex < activeOrderIndex ? "before" : "after";
    item.textContent = appState.teams[teamIndex].name;
    ticker.appendChild(item);
  });

  return ticker;
}

function getCenteredOrderIndexes(length, activeIndex, targetSize) {
  const size = Math.min(length, targetSize);
  let start = Math.max(0, activeIndex - Math.floor(size / 2));
  let end = start + size;

  if (end > length) {
    end = length;
    start = Math.max(0, end - size);
  }

  return Array.from({ length: end - start }, (_, index) => start + index);
}

function createDraftTabs() {
  const tabs = document.createElement("div");
  tabs.className = "linear-draft-tabs";
  ["Player List", "My Team", "AI Teams"].forEach(view => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = appState.activeDraftView === view ? "active" : "";
    button.textContent = view;
    button.addEventListener("click", () => {
      appState.activeDraftView = view;
      renderPage04Draft();
    });
    tabs.appendChild(button);
  });
  return tabs;
}

function createDraftView(isUserTurn) {
  const container = document.createElement("div");
  container.className = "linear-draft-view";

  if (appState.activeDraftView === "My Team") {
    container.appendChild(renderMyTeamView());
    return container;
  }

  if (appState.activeDraftView === "AI Teams") {
    container.appendChild(renderAiTeamsView());
    return container;
  }

  container.appendChild(renderPlayerListView(isUserTurn));
  return container;
}

function renderPlayerListView(isUserTurn) {
  const wrapper = document.createElement("div");
  wrapper.className = "linear-player-list-view";

  const heading = document.createElement("h2");
  heading.textContent = "Player List";
  wrapper.appendChild(heading);

  const filters = document.createElement("div");
  filters.className = "linear-tabs";
  ["ALL", "ATT", "MID", "DEF", "GK"].forEach(position => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = appState.activePosition === position ? "primary-btn linear-tab-btn active" : "primary-btn linear-tab-btn";
    button.textContent = position;
    button.addEventListener("click", () => {
      appState.activePosition = position;
      renderPage04Draft();
    });
    filters.appendChild(button);
  });
  wrapper.appendChild(filters);

  const grid = document.createElement("div");
  grid.className = "linear-player-grid";
  getVisiblePlayers(appState.availablePlayers, appState.activePosition).forEach(player => {
    grid.appendChild(playerCard(player, isUserTurn ? selected => pickPlayer(userTeam(), selected) : null));
  });
  wrapper.appendChild(grid);

  return wrapper;
}

function renderMyTeamView() {
  const wrapper = document.createElement("div");
  wrapper.className = "linear-my-team-view";

  const heading = document.createElement("h2");
  heading.textContent = "My Team";
  wrapper.appendChild(heading);

  wrapper.appendChild(createMyTeamTabs());

  if (appState.activeMyTeamView === "Tactics") {
    wrapper.appendChild(renderTacticsView());
  } else {
    wrapper.appendChild(renderStartingElevenView());
  }

  return wrapper;
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
      renderPage04Draft();
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
  team.tactics = team.tactics || {
    mentality: "Balanced",
    pressing: "Medium Press",
    defensiveLine: "Normal Line",
    passing: "Mixed Passing",
    tempo: "Normal Tempo",
    risk: "Balanced Risk"
  };

  const wrapper = document.createElement("div");
  wrapper.className = "linear-tactics-view";
  wrapper.appendChild(createTacticSelect(team, "mentality", "Mentality", ["Defensive", "Balanced", "Attacking"]));
  wrapper.appendChild(createTacticSelect(team, "pressing", "Pressing", ["Low Block", "Medium Press", "High Press"]));
  wrapper.appendChild(createTacticSelect(team, "defensiveLine", "Defensive Line", ["Deep Line", "Normal Line", "High Line"]));
  wrapper.appendChild(createTacticSelect(team, "passing", "Passing", ["Short Passing", "Mixed Passing", "Direct Passing"]));
  wrapper.appendChild(createTacticSelect(team, "tempo", "Tempo", ["Slow Tempo", "Normal Tempo", "Fast Tempo"]));
  wrapper.appendChild(createTacticSelect(team, "risk", "Risk", ["Safe Risk", "Balanced Risk", "High Risk"]));
  return wrapper;
}

function createTacticSelect(team, key, labelText, options) {
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
  select.value = team.tactics[key];
  select.addEventListener("change", () => {
    team.tactics[key] = select.value;
  });
  label.append(span, select);
  return label;
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
      renderPage04Draft();
    });
  } else {
    box.addEventListener("click", () => moveSelectedPlayer(team, slot.key));
  }

  box.addEventListener("dragover", event => event.preventDefault());
  box.addEventListener("drop", event => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/plain");
    movePlayer(team, playerId, slot.key);
    renderPage04Draft();
  });

  if (selectedPlayerId && player && player.id === selectedPlayerId) box.classList.add("selected");
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
    item.textContent = `${player.position} · ${player.name} · ${player.overall}`;
    item.draggable = true;
    item.dataset.playerId = player.id;
    item.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", player.id));
    item.addEventListener("click", () => {
      selectedPlayerId = player.id;
      renderPage04Draft();
    });
    if (selectedPlayerId === player.id) item.classList.add("selected");
    players.appendChild(item);
  });

  bench.addEventListener("dragover", event => event.preventDefault());
  bench.addEventListener("drop", event => {
    event.preventDefault();
    const playerId = event.dataTransfer.getData("text/plain");
    movePlayer(team, playerId, "BENCH");
    renderPage04Draft();
  });

  bench.appendChild(players);
  return bench;
}

function moveSelectedPlayer(team, slotKey) {
  if (!selectedPlayerId) return;
  movePlayer(team, selectedPlayerId, slotKey);
  selectedPlayerId = null;
  renderPage04Draft();
}

function renderAiTeamsView() {
  const wrapper = document.createElement("div");
  wrapper.className = "linear-ai-teams-view";

  const heading = document.createElement("h2");
  heading.textContent = "AI Teams";
  wrapper.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "linear-ai-grid";
  appState.teams.filter(team => team !== userTeam()).forEach(team => {
    const card = document.createElement("div");
    card.className = "linear-ai-card";
    const title = document.createElement("h3");
    title.textContent = `${team.name} · ${team.players.length} players`;
    card.appendChild(title);
    const list = document.createElement("div");
    list.className = "linear-ai-list";
    team.players.slice().sort((a, b) => b.overall - a.overall).forEach(player => {
      const row = document.createElement("p");
      row.textContent = `${player.overall} · ${player.name} · ${player.position}`;
      list.appendChild(row);
    });
    card.appendChild(list);
    grid.appendChild(card);
  });
  wrapper.appendChild(grid);
  return wrapper;
}

function scheduleAiPick(team) {
  clearAiTimer();
  aiTimer = window.setTimeout(() => pickPlayer(team, chooseAIPlayer(team, appState.availablePlayers)), AI_SPEEDS[appState.aiSpeed] || AI_SPEEDS.normal);
}

function clearAiTimer() {
  if (aiTimer) window.clearTimeout(aiTimer);
  aiTimer = null;
}

function pickPlayer(team, player) {
  if (!player) return;
  const round = getRound(appState.currentPick);
  const pickInRound = getPickInRound(appState.currentPick) + 1;

  appState.availablePlayers = draftPlayer(team, player, appState.availablePlayers);
  autoPlacePlayer(team, player);
  appState.draftLog.push({
    round,
    pickInRound,
    teamName: team.name,
    playerName: player.name,
    position: player.position,
    overall: player.overall
  });
  appState.currentPick += 1;
  renderPage04Draft();
}
