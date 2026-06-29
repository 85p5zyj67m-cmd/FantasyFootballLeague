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
      .map(level => ({ level, match: findBestChainPath(level.traits, placedPlayers) }))
      .filter(item => item.match && Array.isArray(item.match.path) && item.match.path.length === item.level.traits.length);

    if (!matchedLevels.length) return;

    const best = matchedLevels.sort((a, b) => b.level.size - a.level.size || a.match.score - b.match.score)[0];
    const nextLevel = chain.levels.find(level => level.size > best.level.size);

    activeChains.push({
      id: chain.id,
      name: chain.name,
      summary: chain.summary,
      level: best.level.size,
      traits: best.level.traits,
      effect: best.level.effect,
      winChance: best.level.winChance,
      path: best.match.path,
      pathScore: best.match.score,
      nextLevel,
      maxLevel: Math.max(...chain.levels.map(level => level.size)),
      allLevels: chain.levels
    });
  });

  return activeChains.sort((a, b) => b.level - a.level || a.pathScore - b.pathScore || a.name.localeCompare(b.name));
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

function findBestChainPath(requiredTraits, placedPlayers) {
  const normalizedTraits = requiredTraits.map(normalizeTrait);
  const completePaths = [];

  function walk(index, usedPlayerIds, path, score) {
    if (index >= normalizedTraits.length) {
      completePaths.push({ path, score });
      return;
    }

    const requiredTrait = normalizedTraits[index];
    const candidates = placedPlayers
      .filter(item => {
        if (usedPlayerIds.has(item.player.id)) return false;
        if (!item.traits.includes(requiredTrait)) return false;
        if (!path.length) return true;
        return getAdjacencyScore(path[path.length - 1], item) !== null;
      })
      .sort((a, b) => {
        if (!path.length) return a.y - b.y || a.x - b.x;
        return getAdjacencyScore(path[path.length - 1], a) - getAdjacencyScore(path[path.length - 1], b);
      });

    candidates.forEach(candidate => {
      const nextUsed = new Set(usedPlayerIds);
      nextUsed.add(candidate.player.id);
      const linkScore = path.length ? getAdjacencyScore(path[path.length - 1], candidate) : 0;
      walk(index + 1, nextUsed, [...path, candidate], score + linkScore);
    });
  }

  walk(0, new Set(), [], 0);
  return completePaths.sort((a, b) => a.score - b.score)[0] || null;
}

function getAdjacencyScore(a, b) {
  if (!a || !b) return null;

  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const directDistance = Math.sqrt(dx * dx + dy * dy);

  if (directDistance <= 1.18) return directDistance;

  // Same side lane, slightly deeper/higher line connection.
  // This makes LB/LWB connect with LM/LW on the same side, but not with RW/RM.
  if (dx <= 0.42 && dy <= 2.1) return directDistance + 0.25;

  // Central spine: GK-CB-CDM-CM-CAM-ST style chains.
  if (Math.abs(a.x) <= 0.42 && Math.abs(b.x) <= 0.42 && dy <= 2.1) return directDistance + 0.35;

  return null;
}

function normalizeTrait(trait) {
  return String(trait || "").trim().toLowerCase();
}
