import { GAME_CONFIG } from "./config.js";
import { getFormationById } from "./formations.js?v=detailed-formations-3";
import { getSlotsFromFormation } from "./lineup.js?v=strict-cdm-1";
import { canPlayPosition, getPlayerPositions } from "./playerUtils.js?v=strict-cdm-1";

export function getUserDraftPicksRemaining(team, extraPlayers = 0) {
  const picked = (team?.players?.length || 0) + extraPlayers;
  return Math.max(0, GAME_CONFIG.totalRounds - picked);
}

export function canPlayerBeDraftedForFormation(team, player, formationId = team?.formationId) {
  if (!team || !player) return false;
  if ((team.players || []).some(item => item.id === player.id)) return false;

  const playersAfterPick = [...(team.players || []), player];
  const futurePicksAfterPick = getUserDraftPicksRemaining(team, 1);
  return canCompleteFormationWithRoster(playersAfterPick, formationId, futurePicksAfterPick);
}

export function canSelectFormationDuringDraft(team, formationId) {
  if (!team || !formationId) return false;
  const futurePicks = getUserDraftPicksRemaining(team, 0);
  return canCompleteFormationWithRoster(team.players || [], formationId, futurePicks);
}

export function getDraftFormationStatus(team, formationId = team?.formationId) {
  const players = team?.players || [];
  const remaining = getUserDraftPicksRemaining(team, 0);
  const fill = getBestFormationFill(players, formationId);
  const missing = fill.unfilledSlots;
  const locked = remaining <= missing.length;

  return {
    drafted: players.length,
    remaining,
    missingSlots: missing.map(slot => slot.position),
    missingCount: missing.length,
    locked,
    complete: missing.length === 0,
    fillable: missing.length <= remaining
  };
}

export function getMissingPositionSummary(team, formationId = team?.formationId) {
  const status = getDraftFormationStatus(team, formationId);
  if (!status.missingSlots.length) return "Start XI already fillable.";

  const counts = status.missingSlots.reduce((acc, position) => {
    acc[position] = (acc[position] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([position, count]) => count > 1 ? `${count}x ${position}` : position)
    .join(", ");
}

export function canCompleteFormationWithRoster(players, formationId, futurePicks = 0) {
  const fill = getBestFormationFill(players, formationId);
  return fill.unfilledSlots.length <= futurePicks;
}

export function getBestFormationFill(players, formationId) {
  const formation = getFormationById(formationId);
  const slots = getSlotsFromFormation(formation);
  const items = (players || []).map(player => ({
    player,
    positions: getPlayerPositions(player)
  }));

  let best = { filled: [], unfilledSlots: slots };

  function walk(slotIndex, usedPlayerIds, filled) {
    if (slotIndex >= slots.length) {
      if (filled.length > best.filled.length) {
        const filledSlotKeys = new Set(filled.map(item => item.slot.key));
        best = {
          filled,
          unfilledSlots: slots.filter(slot => !filledSlotKeys.has(slot.key))
        };
      }
      return;
    }

    if (filled.length + (slots.length - slotIndex) <= best.filled.length) return;

    const slot = slots[slotIndex];
    const candidates = items.filter(item =>
      !usedPlayerIds.has(item.player.id) && canPlayPosition(item.player, slot.position)
    );

    for (const candidate of candidates) {
      const nextUsed = new Set(usedPlayerIds);
      nextUsed.add(candidate.player.id);
      walk(slotIndex + 1, nextUsed, [...filled, { slot, player: candidate.player }]);
    }

    walk(slotIndex + 1, usedPlayerIds, filled);
  }

  walk(0, new Set(), []);
  return best;
}
