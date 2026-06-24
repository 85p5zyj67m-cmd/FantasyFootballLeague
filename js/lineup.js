import { getFormationById } from "./formations.js";

export function autoPlacePlayer(team, player) {
  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);

  for (const slot of slots) {
    const slotTaken = Object.values(team.lineup).includes(slot.key);

    if (slot.position === player.position && !slotTaken) {
      team.lineup[player.id] = slot.key;
      return;
    }
  }

  team.lineup[player.id] = "BENCH";
}

export function movePlayer(team, movingPlayerId, targetSlot) {
  const movingPlayer = team.players.find(p => p.id === movingPlayerId);
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
  if (targetSlotData.position !== movingPlayer.position) return false;

  const targetPlayerId = Object.keys(team.lineup).find(
    playerId => team.lineup[playerId] === targetSlot
  );

  if (targetPlayerId && targetPlayerId !== movingPlayerId) {
    const targetPlayer = team.players.find(p => p.id === targetPlayerId);

    if (!targetPlayer) return false;
    if (targetPlayer.position !== movingPlayer.position) return false;

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
  const slots = [];

  formation.lines.forEach((line, lineIndex) => {
    line.forEach((position, slotIndex) => {
      slots.push({
        key: `${lineIndex}-${slotIndex}`,
        position
      });
    });
  });

  return slots;
}

export function getPlayerForSlot(team, slotKey) {
  const playerId = Object.keys(team.lineup).find(id => team.lineup[id] === slotKey);
  return team.players.find(p => p.id === playerId);
}

export function getBenchPlayers(team) {
  return team.players.filter(player => team.lineup[player.id] === "BENCH" || !team.lineup[player.id]);
}