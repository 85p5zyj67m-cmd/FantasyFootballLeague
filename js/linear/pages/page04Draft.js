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
import { formatTraits, getDisplayPosition, getTraitList } from "../../playerUtils.js";
import { appState, userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, playerCard } from "../pageUtils.js";

let aiTimer = null;
let aiTimerToken = 0;
let selectedPlayerId = null;

const AI_SPEEDS = {
  normal: 650,
  fast: 90,
  instant: 1
};

export function renderPage04Draft() {
  installMyTeamCardStyles();

  if (isDraftComplete(appState.currentPick, appState.availablePlayers)) {
    clearAiTimer();
    goTo("page05");
    return;
  }

  const app = clearApp();
  const activeTeamIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
  const activeTeam = appState.teams[activeTeamIndex];
  const isUserTurn = activeTeam === userTeam();
  const round = getRound(appState.currentPick);
  const pickInRound = getPickInRound(appState.currentPick) + 1;

  const section = document.createElement("section");
  section.className = "linear-page linear-draft-page";

  const card = document.createElement("div");
  card.className = "linear-card linear-draft-card";
  card.appendChild(createDraftTopbar(round, pickInRound, activeTeam, isUserTurn));
  card.appendChild(createRoundPickCounter(round));
  card.appendChild(createDraftOrderTicker(activeTeamIndex));
  card.appendChild(createDraftTabs());
  card.appendChild(createDraftView(isUserTurn));

  section.appendChild(card);
  app.appendChild(section);

  if (isUserTurn) {
    clearAiTimer();
  } else {
    scheduleAiPick(activeTeam);
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
  title.textContent = `R${round}/${GAME_CONFIG.totalRounds} - P${pickInRound}`;

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

  const applySpeed = () => {
    appState.aiSpeed = select.value;
    const currentTeamIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
    const currentTeam = appState.teams[currentTeamIndex];
    if (currentTeam && currentTeam !== userTeam()) {
      scheduleAiPick(currentTeam, true);
    }
  };

  select.addEventListener("input", applySpeed);
  select.addEventListener("change", applySpeed);
  speedBox.append(speedLabel, select);

  topbar.append(info, speedBox);
  return topbar;
}

function createRoundPickCounter(round) {
  const block = document.createElement("div");
  block.className = "linear-counter-block";

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
    ? `${lastRoundPick.teamName}: ${lastRoundPick.overall} - ${lastRoundPick.playerName} - ${lastRoundPick.position}`
    : "Waiting for the first pick of this round.";

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
  if (appState.activeDraftView === "My Team") container.appendChild(renderMyTeamView());
  else if (appState.activeDraftView === "AI Teams") container.appendChild(renderAiTeamsView());
  else container.appendChild(renderPlayerListView(isUserTurn));
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
  wrapper.appendChild(appState.activeMyTeamView === "Tactics" ? renderTacticsView() : renderStartingElevenView());
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
  wrapper.className = "linear-s11-view linear-info-card-view";
  const hint = document.createElement("p");
  hint.className = "subtitle compact-hint";
  hint.textContent = "Your XI at a glance. Drag cards between matching slots or tap a card and then a position.";
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
  wrapper.className = "linear-tactics-view linear-info-card-view";

  const controls = document.createElement("div");
  controls.className = "linear-tactics-controls-grid";
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

function createTacticSelect(team, key, labelText, options) {
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
    box.appendChild(createPlayerInfoCard(player, "slot"));
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
    renderPage04Draft();
  });
  if (selectedPlayerId && player && player.id === selectedPlayerId) box.classList.add("selected");
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
    item.appendChild(createPlayerInfoCard(player, "bench"));
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

function createTacticsSquadOverview(team) {
  const section = document.createElement("div");
  section.className = "linear-tactics-squad";

  const heading = document.createElement("h3");
  heading.textContent = "Squad Card Overview";
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
    card.appendChild(createPlayerInfoCard(player, "tactics"));
    grid.appendChild(card);
  });

  if (!allVisible.length) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = "Draft players to see your squad cards here.";
    grid.appendChild(empty);
  }

  section.appendChild(grid);
  return section;
}

function createPlayerInfoCard(player, variant = "default") {
  const card = document.createElement("div");
  card.className = `linear-info-player-card ${variant}`;

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
  club.textContent = `${player.club} ${player.year}`;

  const country = document.createElement("span");
  country.textContent = player.nationality;

  meta.append(club, country);

  const traits = document.createElement("div");
  traits.className = "linear-info-traits";
  traits.title = formatTraits(player);
  const traitList = getTraitList(player);
  if (traitList.length) {
    traitList.forEach(trait => {
      const chip = document.createElement("small");
      chip.textContent = trait;
      traits.appendChild(chip);
    });
  } else {
    const chip = document.createElement("small");
    chip.textContent = "No traits";
    traits.appendChild(chip);
  }

  card.append(top, meta, traits);
  return card;
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
    title.textContent = `${team.name} - ${team.players.length} players`;
    card.appendChild(title);
    const list = document.createElement("div");
    list.className = "linear-ai-list";
    team.players.slice().sort((a, b) => b.overall - a.overall).forEach(player => {
      const row = document.createElement("p");
      row.textContent = `${player.overall} - ${player.name} - ${getDisplayPosition(player)}`;
      list.appendChild(row);
    });
    card.appendChild(list);
    grid.appendChild(card);
  });
  wrapper.appendChild(grid);
  return wrapper;
}

function scheduleAiPick(team, immediate = false) {
  clearAiTimer();
  const token = ++aiTimerToken;
  const delay = immediate && appState.aiSpeed === "instant"
    ? 0
    : AI_SPEEDS[appState.aiSpeed] || AI_SPEEDS.normal;

  aiTimer = window.setTimeout(() => {
    if (token !== aiTimerToken) return;
    const activeIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
    const activeTeam = appState.teams[activeIndex];
    if (activeTeam !== team || activeTeam === userTeam()) return;
    pickPlayer(team, chooseAIPlayer(team, appState.availablePlayers));
  }, delay);
}

function clearAiTimer() {
  aiTimerToken += 1;
  if (aiTimer) window.clearTimeout(aiTimer);
  aiTimer = null;
}

function pickPlayer(team, player) {
  if (!player) return;
  const activeIndex = getTeamOnClock(appState.currentPick, appState.draftOrder);
  if (appState.teams[activeIndex] !== team) return;
  const round = getRound(appState.currentPick);
  const pickInRound = getPickInRound(appState.currentPick) + 1;
  appState.availablePlayers = draftPlayer(team, player, appState.availablePlayers);
  autoPlacePlayer(team, player);
  appState.draftLog.push({
    round,
    pickInRound,
    teamName: team.name,
    playerName: player.name,
    position: getDisplayPosition(player),
    overall: player.overall
  });
  appState.currentPick += 1;
  renderPage04Draft();
}

function installMyTeamCardStyles() {
  if (document.getElementById("linear-my-team-card-styles")) return;

  const style = document.createElement("style");
  style.id = "linear-my-team-card-styles";
  style.textContent = `
    .linear-info-card-view .compact-hint { margin-bottom: 10px; }
    .compact-player-pitch { gap: 8px; padding: 14px; }
    .compact-player-line { gap: 8px; align-items: stretch; }
    .linear-slot-card { min-width: 148px; max-width: 188px; padding: 0; }
    .linear-empty-slot { min-width: 126px; padding: 12px; opacity: .78; }
    .linear-info-player-card { width: 100%; box-sizing: border-box; border-radius: 16px; padding: 9px; background: rgba(6, 18, 13, .58); border: 1px solid rgba(255, 255, 255, .11); }
    .linear-info-player-top { display: grid; grid-template-columns: 38px 1fr; gap: 8px; align-items: center; }
    .linear-info-rating { display: grid; place-items: center; min-width: 34px; height: 34px; border-radius: 11px; background: rgba(75, 255, 151, .14); font-size: 1rem; }
    .linear-info-identity { min-width: 0; display: grid; gap: 2px; }
    .linear-info-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .82rem; line-height: 1.05; }
    .linear-info-position { font-size: .68rem; line-height: 1; opacity: .8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .linear-info-meta { display: grid; grid-template-columns: 1fr; gap: 2px; margin-top: 6px; font-size: .66rem; line-height: 1.1; opacity: .76; }
    .linear-info-meta span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .linear-info-traits { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 6px; }
    .linear-info-traits small { border-radius: 999px; border: 1px solid rgba(255, 255, 255, .13); padding: 2px 5px; font-size: .58rem; line-height: 1.05; opacity: .88; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .compact-player-bench { margin-top: 12px; }
    .compact-bench-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; }
    .linear-bench-card { padding: 0; }
    .linear-tactics-controls-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 8px; margin-bottom: 14px; }
    .linear-tactic-control.compact { padding: 9px 10px; }
    .linear-tactics-squad h3 { margin: 4px 0 10px; }
    .linear-tactics-squad-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 8px; }
    .linear-tactics-player-card { min-width: 0; }
    .linear-info-player-card.tactics .linear-info-player-top { grid-template-columns: 36px 1fr; }
    @media (max-width: 760px) {
      .linear-slot-card { min-width: 132px; max-width: 160px; }
      .linear-info-name { font-size: .76rem; }
      .linear-info-traits small { font-size: .55rem; }
    }
  `;
  document.head.appendChild(style);
}
