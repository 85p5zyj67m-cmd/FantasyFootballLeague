import { FORMATIONS, getFormationById } from "./formations.js";
import {
  getVisiblePlayers,
  getOrderThisRound,
  getPickInRound,
  getNextUserPickDistances
} from "./draftRules.js";
import {
  getPlayerForSlot,
  getBenchPlayers
} from "./lineup.js";

let selectedPlayerId = null;

export function showScreen(screenId) {
  ["startScreen", "lotteryScreen", "formationScreen", "draftScreen", "tacticsScreen"].forEach(id => {
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
  box.innerHTML = "";

  FORMATIONS.forEach(f => {
    const btn = document.createElement("button");
    btn.textContent = f.name;
    btn.onclick = () => onSelect(f.id);
    box.appendChild(btn);
  });
}

export function renderMainViewTabs(activeView, onChange) {
  const box = document.getElementById("mainViewTabs");
  box.innerHTML = "";

  ["Player List", "My Team", "AI Teams"].forEach(view => {
    const btn = document.createElement("button");
    btn.className = "main-tab" + (activeView === view ? " active" : "");
    btn.textContent = view;
    btn.onclick = () => onChange(view);
    box.appendChild(btn);
  });

  document.getElementById("playerListView").classList.toggle("hidden", activeView !== "Player List");
  document.getElementById("myTeamView").classList.toggle("hidden", activeView !== "My Team");
  document.getElementById("aiTeamsView").classList.toggle("hidden", activeView !== "AI Teams");
}

export function renderFormationSelect(elementId, selectedId, onChange) {
  const select = document.getElementById(elementId);
  select.innerHTML = "";

  FORMATIONS.forEach(f => {
    const option = document.createElement("option");
    option.value = f.id;
    option.textContent = f.name;
    option.selected = f.id === selectedId;
    select.appendChild(option);
  });

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

  document.getElementById("turnCounter").innerHTML = `
    <div class="counter-pill"><span class="counter-label">NEXT</span><span class="counter-number">${distances.next}</span></div>
    <div class="counter-pill"><span class="counter-label">2ND</span><span class="counter-number">${distances.second}</span></div>
    <div class="counter-pill"><span class="counter-label">3RD</span><span class="counter-number">${distances.third}</span></div>
  `;

  const ticker = document.getElementById("draftOrderTicker");
  ticker.innerHTML = "";

  order.forEach((idx, i) => {
    const chip = document.createElement("div");
    chip.className = "order-chip" + (i === pickInRound ? " active" : "");
    chip.textContent = teams[idx].name;

    if (i === pickInRound) {
      chip.id = "activeDraftChip";
    }

    ticker.appendChild(chip);
  });

  requestAnimationFrame(() => {
    const active = document.getElementById("activeDraftChip");
    if (!active) return;

    ticker.scrollTo({
      left: active.offsetLeft - ticker.clientWidth / 2 + active.clientWidth / 2,
      behavior: "smooth"
    });
  });
}

export function renderLastPick(teamName, player) {
  const box = document.getElementById("lastPick");

  if (!player) {
    box.textContent = "Waiting...";
    return;
  }

  box.innerHTML = `<strong>${teamName}</strong>: ${player.overall} · ${player.name} (${player.year}) · ${player.position}`;
}

export function renderPositionTabs(activePosition, onChange) {
  const tabs = document.getElementById("draftPositionTabs");
  tabs.innerHTML = "";

  ["ALL", "ATT", "MID", "DEF", "GK"].forEach(pos => {
    const btn = document.createElement("button");
    btn.className = "chip" + (activePosition === pos ? " active" : "");
    btn.textContent = pos;
    btn.onclick = () => onChange(pos);
    tabs.appendChild(btn);
  });
}

export function renderAvailablePlayers(availablePlayers, activePosition, onDraftPlayer) {
  const box = document.getElementById("playerList");
  box.innerHTML = "";

  getVisiblePlayers(availablePlayers, activePosition).forEach(player => {
    const card = document.createElement("div");
    card.className = "player";

    card.innerHTML = `
      <span class="position-badge">${player.position}</span>
      <span class="overall">${player.overall}</span>
      <div class="player-title">${player.overall} · ${player.name} (${player.year}) · ${player.position}</div>
      <div class="player-meta">${player.club}</div>
      <button class="draft-btn">Draft Player</button>
    `;

    card.querySelector("button").onclick = () => onDraftPlayer(player);
    box.appendChild(card);
  });
}

export function renderLineup(elementId, team, onMovePlayer) {
  const box = document.getElementById(elementId);
  const formation = getFormationById(team.formationId);

  box.innerHTML = `
    <div class="pitch-wrapper">
      <div class="pitch" id="${elementId}-pitch"></div>
    </div>
    <div class="bench" id="${elementId}-bench"></div>
  `;

  const pitch = document.getElementById(`${elementId}-pitch`);

  formation.lines.forEach((line, lineIndex) => {
    const row = document.createElement("div");
    row.className = "line";

    line.forEach((position, slotIndex) => {
      const slotKey = `${lineIndex}-${slotIndex}`;
      const player = getPlayerForSlot(team, slotKey);

      const slot = document.createElement("div");
      slot.className = "slot";

      slot.innerHTML = `
        <div class="slot-position">${position}</div>
        ${
          player
            ? `<div class="slot-player" draggable="true" data-player-id="${player.id}" data-slot-key="${slotKey}">${player.overall}<br>${player.name}</div>`
            : `<div class="slot-empty">Empty</div>`
        }
      `;

      slot.onclick = () => {
        if (selectedPlayerId) {
          onMovePlayer(selectedPlayerId, slotKey);
          selectedPlayerId = null;
        }
      };

      addDropEvents(slot, slotKey, onMovePlayer);
      row.appendChild(slot);
    });

    pitch.appendChild(row);
  });

  renderBench(`${elementId}-bench`, team, onMovePlayer);
  addDragAndTapEvents(onMovePlayer);
}

function renderBench(elementId, team, onMovePlayer) {
  const bench = document.getElementById(elementId);
  const benchPlayers = getBenchPlayers(team);

  bench.innerHTML = `
    <div class="bench-title">Bench</div>
    <div class="bench-list">
      ${
        benchPlayers.length === 0
          ? `<div class="roster-row">No bench players</div>`
          : benchPlayers.map(player => `
            <div class="bench-player" draggable="true" data-player-id="${player.id}" data-slot-key="BENCH">
              ${player.overall} · ${player.name} (${player.year}) · ${player.position}
            </div>
          `).join("")
      }
    </div>
  `;

  bench.ondragover = e => e.preventDefault();

  bench.ondrop = e => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData("text/plain");
    onMovePlayer(playerId, "BENCH");
  };
}

function addDragAndTapEvents(onMovePlayer) {
  document.querySelectorAll("[draggable='true']").forEach(item => {
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
  box.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "ai-teams-grid";

  draftOrder.forEach(teamIndex => {
    if (teamIndex === userIndex) return;
    grid.appendChild(createCompactTeamCard(teams[teamIndex]));
  });

  box.appendChild(grid);
}

function createCompactTeamCard(team) {
  const card = document.createElement("div");
  card.className = "ai-team-card";

  card.innerHTML = `
    <h3>${team.name}</h3>
    <div class="ai-roster">
      ${
        team.players.map(p =>
          `<div class="roster-row">${p.overall} · ${p.name} (${p.year}) · ${p.position}</div>`
        ).join("") || `<div class="roster-row">No picks yet</div>`
      }
    </div>
  `;

  return card;
}