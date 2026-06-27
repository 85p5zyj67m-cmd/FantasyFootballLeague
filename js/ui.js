import { FORMATIONS, getFormationById } from "./formations.js";
import {
  getVisiblePlayers,
  getOrderThisRound,
  getPickInRound,
  getNextUserPickDistances
} from "./draftRules.js";
import {
  getPlayersBySlot,
  getBenchPlayers
} from "./lineup.js";

let selectedPlayerId = null;

export function showScreen(screenId) {
  [
    "startScreen",
    "lotteryScreen",
    "formationScreen",
    "draftScreen",
    "tacticsScreen",
    "divisionScreen",
    "seasonScreen",
    "titleScreen"
  ].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });

  document.getElementById(screenId).classList.remove("hidden");
}

export function renderLotteryResult(position) {
  const slot = document.getElementById("lotterySlot");
  const text = document.getElementById("lotteryText");
  const button = document.getElementById("continueToFormationBtn");

  slot.classList.add("spinning");
  button.classList.add("hidden");

  const interval = setInterval(() => {
    slot.textContent = Math.floor(Math.random() * 20) + 1;
  }, 80);

  setTimeout(() => {
    clearInterval(interval);
    slot.classList.remove("spinning");
    slot.textContent = position;
    text.textContent = `You have the number ${position} pick in the draft.`;
    button.classList.remove("hidden");
  }, 2200);
}

export function renderFormationOptions(onSelect) {
  const box = document.getElementById("formationOptions");
  const fragment = document.createDocumentFragment();

  FORMATIONS.forEach(f => {
    const btn = document.createElement("button");
    btn.textContent = f.name;
    btn.onclick = () => onSelect(f.id);
    fragment.appendChild(btn);
  });

  box.replaceChildren(fragment);
}

export function renderMainViewTabs(activeView, onChange) {
  const box = document.getElementById("mainViewTabs");
  const fragment = document.createDocumentFragment();

  ["Player List", "My Team", "AI Teams"].forEach(view => {
    const btn = document.createElement("button");
    btn.className = "main-tab" + (activeView === view ? " active" : "");
    btn.textContent = view;
    btn.onclick = () => onChange(view);
    fragment.appendChild(btn);
  });

  box.replaceChildren(fragment);
  document.getElementById("playerListView").classList.toggle("hidden", activeView !== "Player List");
  document.getElementById("myTeamView").classList.toggle("hidden", activeView !== "My Team");
  document.getElementById("aiTeamsView").classList.toggle("hidden", activeView !== "AI Teams");
}

export function renderFormationSelect(elementId, selectedId, onChange) {
  const select = document.getElementById(elementId);

  if (select.dataset.ready !== "true") {
    const fragment = document.createDocumentFragment();

    FORMATIONS.forEach(f => {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = f.name;
      fragment.appendChild(option);
    });

    select.replaceChildren(fragment);
    select.dataset.ready = "true";
  }

  select.value = selectedId;
  select.onchange = () => onChange(select.value);
}

export function renderDraftHeader(currentPick, totalTeams, totalRounds, teams, draftOrder) {
  const round = Math.floor(currentPick / totalTeams) + 1;
  const pick = (currentPick % totalTeams) + 1;
  const order = getOrderThisRound(currentPick, draftOrder);
  const pickInRound = getPickInRound(currentPick);
  const teamIndex = order[pickInRound];
  const distances = getNextUserPickDistances(currentPick, draftOrder);

  document.getElementById("roundInfo").textContent = `R${round}/${totalRounds} · P${pick}`;
  document.getElementById("pickInfo").textContent = `${teams[teamIndex].name} on clock`;

  const counterFragment = document.createDocumentFragment();
  counterFragment.append(
    createCounterPill("NEXT", distances.next),
    createCounterPill("2ND", distances.second),
    createCounterPill("3RD", distances.third),
    createCounterPill("4TH", distances.fourth)
  );
  document.getElementById("turnCounter").replaceChildren(counterFragment);

  const ticker = document.getElementById("draftOrderTicker");
  const tickerFragment = document.createDocumentFragment();
  let activeChip = null;

  order.forEach((idx, i) => {
    const chip = document.createElement("div");
    chip.className = "order-chip" + (i === pickInRound ? " active" : "");
    chip.textContent = teams[idx].name;

    if (i === pickInRound) {
      activeChip = chip;
    }

    tickerFragment.appendChild(chip);
  });

  ticker.replaceChildren(tickerFragment);

  requestAnimationFrame(() => {
    if (!activeChip) return;

    ticker.scrollTo({
      left: activeChip.offsetLeft - ticker.clientWidth / 2 + activeChip.clientWidth / 2,
      behavior: "smooth"
    });
  });
}

function createCounterPill(labelText, numberText) {
  const pill = document.createElement("div");
  pill.className = "counter-pill";

  const label = document.createElement("span");
  label.className = "counter-label";
  label.textContent = labelText;

  const number = document.createElement("span");
  number.className = "counter-number";
  number.textContent = numberText;

  pill.append(label, number);
  return pill;
}

export function renderLastPick(teamName, player) {
  const box = document.getElementById("lastPick");

  if (!player) {
    box.textContent = "Waiting...";
    return;
  }

  const team = document.createElement("strong");
  team.textContent = teamName;

  box.replaceChildren(
    team,
    document.createTextNode(`: ${player.overall} · ${player.name} (${player.year}) · ${player.position}`)
  );
}

export function renderPositionTabs(activePosition, onChange) {
  const tabs = document.getElementById("draftPositionTabs");
  const fragment = document.createDocumentFragment();

  ["ALL", "ATT", "MID", "DEF", "GK"].forEach(pos => {
    const btn = document.createElement("button");
    btn.className = "chip" + (activePosition === pos ? " active" : "");
    btn.textContent = pos;
    btn.onclick = () => onChange(pos);
    fragment.appendChild(btn);
  });

  tabs.replaceChildren(fragment);
}

export function renderAvailablePlayers(availablePlayers, activePosition, onDraftPlayer) {
  const box = document.getElementById("playerList");
  const fragment = document.createDocumentFragment();

  getVisiblePlayers(availablePlayers, activePosition).forEach(player => {
    fragment.appendChild(createPlayerCard(player, onDraftPlayer));
  });

  box.replaceChildren(fragment);
}

export function renderLineup(elementId, team, onMovePlayer) {
  const box = document.getElementById(elementId);
  const formation = getFormationById(team.formationId);
  const playersBySlot = getPlayersBySlot(team);

  const pitchWrapper = document.createElement("div");
  pitchWrapper.className = "pitch-wrapper";

  const pitch = document.createElement("div");
  pitch.className = "pitch";
  pitch.id = `${elementId}-pitch`;
  pitchWrapper.appendChild(pitch);

  const bench = document.createElement("div");
  bench.className = "bench";
  bench.id = `${elementId}-bench`;

  box.replaceChildren(pitchWrapper, bench);

  const pitchFragment = document.createDocumentFragment();

  formation.lines.forEach((line, lineIndex) => {
    const row = document.createElement("div");
    row.className = "line";

    line.forEach((position, slotIndex) => {
      const slotKey = `${lineIndex}-${slotIndex}`;
      const player = playersBySlot.get(slotKey);

      const slot = document.createElement("div");
      slot.className = "slot";

      const positionLabel = document.createElement("div");
      positionLabel.className = "slot-position";
      positionLabel.textContent = position;

      slot.append(
        positionLabel,
        player ? createSlotPlayer(player, slotKey) : createEmptySlot()
      );

      slot.onclick = () => {
        if (selectedPlayerId) {
          onMovePlayer(selectedPlayerId, slotKey);
          selectedPlayerId = null;
        }
      };

      addDropEvents(slot, slotKey, onMovePlayer);
      row.appendChild(slot);
    });

    pitchFragment.appendChild(row);
  });

  pitch.replaceChildren(pitchFragment);
  renderBench(`${elementId}-bench`, team, onMovePlayer);
  addDragAndTapEvents(box, onMovePlayer);
}

function createSlotPlayer(player, slotKey) {
  const slotPlayer = document.createElement("div");
  slotPlayer.className = "slot-player";
  slotPlayer.draggable = true;
  slotPlayer.dataset.playerId = player.id;
  slotPlayer.dataset.slotKey = slotKey;
  slotPlayer.append(
    document.createTextNode(player.overall),
    document.createElement("br"),
    document.createTextNode(player.name)
  );
  return slotPlayer;
}

function createEmptySlot() {
  const empty = document.createElement("div");
  empty.className = "slot-empty";
  empty.textContent = "Empty";
  return empty;
}

function createPlayerCard(player, onDraftPlayer) {
  const card = document.createElement("div");
  card.className = "player";

  const badge = document.createElement("span");
  badge.className = "position-badge";
  badge.textContent = player.position;

  const overall = document.createElement("span");
  overall.className = "overall";
  overall.textContent = player.overall;

  const title = document.createElement("div");
  title.className = "player-title";
  title.textContent = `${player.overall} · ${player.name} (${player.year}) · ${player.position}`;

  const meta = document.createElement("div");
  meta.className = "player-meta";
  meta.textContent = player.club;

  const button = document.createElement("button");
  button.className = "draft-btn";
  button.textContent = "Draft Player";
  button.onclick = () => onDraftPlayer(player);

  card.append(badge, overall, title, meta, button);
  return card;
}

function renderBench(elementId, team, onMovePlayer) {
  const bench = document.getElementById(elementId);
  const benchPlayers = getBenchPlayers(team);

  const title = document.createElement("div");
  title.className = "bench-title";
  title.textContent = "Bench";

  const list = document.createElement("div");
  list.className = "bench-list";

  if (benchPlayers.length === 0) {
    const row = document.createElement("div");
    row.className = "roster-row";
    row.textContent = "No bench players";
    list.appendChild(row);
  } else {
    benchPlayers.forEach(player => {
      const row = document.createElement("div");
      row.className = "bench-player";
      row.draggable = true;
      row.dataset.playerId = player.id;
      row.dataset.slotKey = "BENCH";
      row.textContent = `${player.overall} · ${player.name} (${player.year}) · ${player.position}`;
      list.appendChild(row);
    });
  }

  bench.replaceChildren(title, list);

  bench.ondragover = e => e.preventDefault();

  bench.ondrop = e => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData("text/plain");
    onMovePlayer(playerId, "BENCH");
  };
}

function addDragAndTapEvents(container, onMovePlayer) {
  container.querySelectorAll("[draggable='true']").forEach(item => {
    item.ondragstart = e => {
      e.dataTransfer.setData("text/plain", item.dataset.playerId);
    };

    item.onclick = e => {
      e.stopPropagation();

      const tappedPlayerId = item.dataset.playerId;
      const tappedSlotKey = item.dataset.slotKey;

      if (selectedPlayerId && selectedPlayerId !== tappedPlayerId) {
        onMovePlayer(selectedPlayerId, tappedSlotKey);
        selectedPlayerId = null;
        return;
      }

      document.querySelectorAll(".selected-player").forEach(el => {
        el.classList.remove("selected-player");
      });

      selectedPlayerId = tappedPlayerId;
      item.classList.add("selected-player");
    };
  });
}

function addDropEvents(slot, slotKey, onMovePlayer) {
  slot.ondragover = e => {
    e.preventDefault();
    slot.classList.add("drag-over");
  };

  slot.ondragleave = () => {
    slot.classList.remove("drag-over");
  };

  slot.ondrop = e => {
    e.preventDefault();
    slot.classList.remove("drag-over");

    const playerId = e.dataTransfer.getData("text/plain");
    onMovePlayer(playerId, slotKey);
  };
}

export function renderAITeamsPanel(teams, userIndex, draftOrder) {
  const box = document.getElementById("aiTeamsPanel");
  const grid = document.createElement("div");
  grid.className = "ai-teams-grid";
  const fragment = document.createDocumentFragment();

  draftOrder.forEach(teamIndex => {
    if (teamIndex === userIndex) return;
    fragment.appendChild(createCompactTeamCard(teams[teamIndex]));
  });

  grid.appendChild(fragment);
  box.replaceChildren(grid);
}

function createCompactTeamCard(team) {
  const card = document.createElement("div");
  card.className = "ai-team-card";

  const title = document.createElement("h3");
  title.textContent = team.name;

  const roster = document.createElement("div");
  roster.className = "ai-roster";

  if (team.players.length === 0) {
    const row = document.createElement("div");
    row.className = "roster-row";
    row.textContent = "No picks yet";
    roster.appendChild(row);
  } else {
    team.players.forEach(player => {
      const row = document.createElement("div");
      row.className = "roster-row";
      row.textContent = `${player.overall} · ${player.name} (${player.year}) · ${player.position}`;
      roster.appendChild(row);
    });
  }

  card.append(title, roster);

  return card;
}
