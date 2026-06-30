import { GAME_CONFIG } from "./config.js";
import { getFormationById } from "./formations.js?v=detailed-formations-3";
import { getSlotsFromFormation } from "./lineup.js?v=strict-cdm-1";
import { canPlayPosition } from "./playerUtils.js?v=strict-cdm-1";

const fillCache = new Map();
const CACHE_LIMIT = 1200;

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
  const roster = players || [];
  const cacheKey = createFillCacheKey(roster, formationId);

  if (fillCache.has(cacheKey)) return fillCache.get(cacheKey);

  const match = findMaximumSlotMatching(roster, slots);
  const filled = match.slotToPlayer
    .map((playerIndex, slotIndex) => playerIndex >= 0 ? { slot: slots[slotIndex], player: roster[playerIndex] } : null)
    .filter(Boolean);

  const unfilledSlots = slots.filter((_, slotIndex) => match.slotToPlayer[slotIndex] < 0);
  const result = { filled, unfilledSlots };

  fillCache.set(cacheKey, result);
  if (fillCache.size > CACHE_LIMIT) {
    const firstKey = fillCache.keys().next().value;
    fillCache.delete(firstKey);
  }

  return result;
}

function findMaximumSlotMatching(players, slots) {
  const slotToPlayer = Array(slots.length).fill(-1);
  const candidateSlotsByPlayer = players.map(player =>
    slots
      .map((slot, slotIndex) => canPlayPosition(player, slot.position) ? slotIndex : -1)
      .filter(slotIndex => slotIndex >= 0)
  );

  const playerOrder = players
    .map((_, playerIndex) => playerIndex)
    .sort((a, b) => candidateSlotsByPlayer[a].length - candidateSlotsByPlayer[b].length);

  playerOrder.forEach(playerIndex => {
    const seenSlots = new Set();
    tryAssignPlayer(playerIndex, candidateSlotsByPlayer, slotToPlayer, seenSlots);
  });

  return { slotToPlayer };
}

function tryAssignPlayer(playerIndex, candidateSlotsByPlayer, slotToPlayer, seenSlots) {
  for (const slotIndex of candidateSlotsByPlayer[playerIndex]) {
    if (seenSlots.has(slotIndex)) continue;
    seenSlots.add(slotIndex);

    const currentPlayerIndex = slotToPlayer[slotIndex];
    if (currentPlayerIndex === -1 || tryAssignPlayer(currentPlayerIndex, candidateSlotsByPlayer, slotToPlayer, seenSlots)) {
      slotToPlayer[slotIndex] = playerIndex;
      return true;
    }
  }

  return false;
}

function createFillCacheKey(players, formationId) {
  const playerPart = (players || [])
    .map(player => String(player.id || player.name || ""))
    .sort()
    .join("|");
  return `${formationId || ""}::${playerPart}`;
}
