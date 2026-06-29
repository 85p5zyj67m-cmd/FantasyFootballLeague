import { getFormationById } from "./formations.js?v=detailed-formations-2";
import { getSlotsFromFormation } from "./lineup.js?v=detailed-formations-2";
import { getTraitList } from "./playerUtils.js?v=chain-engine-1";
import { TRAIT_CHAINS } from "./traitChains.js?v=chain-engine-1";

const X_BY_LINE_LENGTH = {
  1: [0],
  2: [-0.5, 0.5],
  3: [-1, 0, 1],
  4: [-1, -0.34, 0.34, 1],
  5: [-1, -0.5, 0, 0.5, 1]
};

export function getActiveTraitChains(team) {
  const placedPlayers = getPlacedStarterPlayers(team);
  const activeChains = [];

  TRAIT_CHAINS.forEach(chain => {
    const matchedLevels = chain.levels
      .map(level => ({ level, path: findChainPath(level.traits, placedPlayers) }))
      .filter(match => Array.isArray(match.path) && match.path.length === match.level.traits.length);

    if (!matchedLevels.length) return;

    const best = matchedLevels.sort((a, b) => b.level.size - a.level.size)[0];
    const nextLevel = chain.levels.find(level => level.size > best.level.size);

    activeChains.push({
      id: chain.id,
      name: chain.name,
      summary: chain.summary,
      level: best.level.size,
      traits: best.level.traits,
      effect: best.level.effect,
      winChance: best.level.winChance,
      path: best.path,
      nextLevel,
      maxLevel: Math.max(...chain.levels.map(level => level.size)),
      allLevels: chain.levels
    });
  });

  return activeChains.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
}

export function getTraitChainScore(team) {
  return getActiveTraitChains(team).reduce((sum, chain) => sum + chain.level, 0);
}

function getPlacedStarterPlayers(team) {
  if (!team?.players?.length) return [];

  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);
  const slotsByKey = new Map(slots.map(slot => [slot.key, slot]));
  const playersById = new Map(team.players.map(player => [player.id, player]));

  return Object.entries(team.lineup || {})
    .filter(([, slotKey]) => slotKey && slotKey !== "BENCH")
    .map(([playerId, slotKey]) => {
      const player = playersById.get(playerId);
      const slot = slotsByKey.get(slotKey);
      if (!player || !slot) return null;
      const [lineIndexText, slotIndexText] = slot.key.split("-");
      const lineIndex = Number(lineIndexText);
      const slotIndex = Number(slotIndexText);
      const lineLength = formation.lines[lineIndex]?.length || 1;
      const x = X_BY_LINE_LENGTH[lineLength]?.[slotIndex] ?? 0;
      const y = lineIndex;

      return {
        player,
        slot,
        x,
        y,
        traits: getTraitList(player).map(normalizeTrait)
      };
    })
    .filter(Boolean);
}

function findChainPath(requiredTraits, placedPlayers) {
  const normalizedTraits = requiredTraits.map(normalizeTrait);

  function walk(index, usedPlayerIds, path) {
    if (index >= normalizedTraits.length) return path;

    const requiredTrait = normalizedTraits[index];
    const candidates = placedPlayers.filter(item => {
      if (usedPlayerIds.has(item.player.id)) return false;
      if (!item.traits.includes(requiredTrait)) return false;
      if (!path.length) return true;
      return areChainAdjacent(path[path.length - 1], item);
    });

    for (const candidate of candidates) {
      const nextUsed = new Set(usedPlayerIds);
      nextUsed.add(candidate.player.id);
      const result = walk(index + 1, nextUsed, [...path, candidate]);
      if (result) return result;
    }

    return null;
  }

  return walk(0, new Set(), []);
}

function areChainAdjacent(a, b) {
  if (!a || !b) return false;

  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const directDistance = Math.sqrt(dx * dx + dy * dy);

  if (directDistance <= 1.18) return true;

  // Same lane, slightly deeper/higher line connection.
  // This makes LB/LWB connect with LM/LW on the same side, but not with RW/RM.
  if (dx <= 0.42 && dy <= 2.1) return true;

  // Central spine: GK-CB-CDM-CM-CAM-ST style chains.
  if (Math.abs(a.x) <= 0.42 && Math.abs(b.x) <= 0.42 && dy <= 2.1) return true;

  return false;
}

function normalizeTrait(trait) {
  return String(trait || "").trim().toLowerCase();
}
