import { getFormationById } from "./formations.js";
import { canPlayPosition } from "./playerUtils.js";

const formationSlotsCache = new WeakMap();

export function autoPlacePlayer(team, player) {
  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);
  const occupiedSlots = new Set(Object.values(team.lineup));

  for (const slot of slots) {
    if (canPlayPosition(player, slot.position) && !occupiedSlots.has(slot.key)) {
      team.lineup[player.id] = slot.key;
      return;
    }
  }

  team.lineup[player.id] = "BENCH";
}

export function movePlayer(team, movingPlayerId, targetSlot) {
  const playersById = getPlayersById(team);
  const movingPlayer = playersById.get(movingPlayerId);
  if (!movingPlayer) return false;

  const oldSlot = team.lineup[movingPlayerId] || "BENCH";

  if (targetSlot === "BENCH") {
    team.lineup[movingPlayerId] = "BENCH";
    return true;
  }

  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);
  const targetSlotData = slots.find(s => s.key === targetSlot);

  if (!targetSlotData) return false;
  if (!canPlayPosition(movingPlayer, targetSlotData.position)) return false;

  const targetPlayerId = getPlayerIdBySlot(team, targetSlot);

  if (targetPlayerId && targetPlayerId !== movingPlayerId) {
    const targetPlayer = playersById.get(targetPlayerId);
    if (!targetPlayer) return false;

    if (oldSlot !== "BENCH") {
      const oldSlotData = slots.find(s => s.key === oldSlot);
      if (!oldSlotData) return false;
      if (!canPlayPosition(targetPlayer, oldSlotData.position)) return false;
    }

    team.lineup[targetPlayerId] = oldSlot;
  }

  team.lineup[movingPlayerId] = targetSlot;
  return true;
}

export function resetLineup(team) {
  team.lineup = {};
  team.players.forEach(player => autoPlacePlayer(team, player));
}

export function getSlotsFromFormation(formation) {
  if (formationSlotsCache.has(formation)) {
    return formationSlotsCache.get(formation);
  }

  const slots = [];

  formation.lines.forEach((line, lineIndex) => {
    line.forEach((position, slotIndex) => {
      slots.push({
        key: `${lineIndex}-${slotIndex}`,
        position
      });
    });
  });

  formationSlotsCache.set(formation, slots);
  return slots;
}

export function getBenchPlayers(team) {
  return team.players.filter(player => team.lineup[player.id] === "BENCH" || !team.lineup[player.id]);
}

export function getPlayersBySlot(team) {
  const playersById = getPlayersById(team);
  const playersBySlot = new Map();

  Object.entries(team.lineup).forEach(([playerId, slotKey]) => {
    if (slotKey === "BENCH") return;

    const player = playersById.get(playerId);
    if (player) {
      playersBySlot.set(slotKey, player);
    }
  });

  return playersBySlot;
}

function getPlayersById(team) {
  return new Map(team.players.map(player => [player.id, player]));
}

function getPlayerIdBySlot(team, slotKey) {
  return Object.keys(team.lineup).find(playerId => team.lineup[playerId] === slotKey);
}
