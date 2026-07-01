import { getFormationById } from "./formations.js?v=detailed-formations-3";
import { getSlotsFromFormation } from "./lineup.js?v=strict-cdm-1";
import { getPlayerPositions } from "./playerUtils.js?v=strict-cdm-1";

const DETAIL_BOOST_CAP = 4.5;
const DETAIL_PENALTY_CAP = -3.5;

const ROLE_WEIGHTS = {
  GK: { defense: 0.18, goalkeeping: 0.34, spine: 0.22 },
  CB: { defense: 0.34, boxDefense: 0.24, aerial: 0.2, spine: 0.18 },
  LB: { defense: 0.18, wide: 0.24, cross: 0.16 },
  RB: { defense: 0.18, wide: 0.24, cross: 0.16 },
  LWB: { defense: 0.12, wide: 0.34, cross: 0.22, tempo: 0.1 },
  RWB: { defense: 0.12, wide: 0.34, cross: 0.22, tempo: 0.1 },
  CDM: { defense: 0.24, control: 0.22, buildup: 0.18, spine: 0.18 },
  CM: { control: 0.34, buildup: 0.18, tempo: 0.14, spine: 0.12 },
  CAM: { attack: 0.2, control: 0.22, creativity: 0.3, halfSpace: 0.16 },
  LM: { wide: 0.3, cross: 0.2, tempo: 0.12, control: 0.08 },
  RM: { wide: 0.3, cross: 0.2, tempo: 0.12, control: 0.08 },
  LW: { attack: 0.26, wide: 0.26, halfSpace: 0.2, tempo: 0.12 },
  RW: { attack: 0.26, wide: 0.26, halfSpace: 0.2, tempo: 0.12 },
  CF: { attack: 0.26, creativity: 0.22, link: 0.22, spine: 0.12 },
  ST: { attack: 0.38, finishing: 0.3, aerial: 0.1, spine: 0.14 }
};

export function getDetailedPositionSystemBoost(team) {
  const placed = getPlacedStarters(team);
  if (!placed.length) return 0;

  const fit = detailedSlotFit(placed);
  const role = roleQualityScore(placed);
  const structure = structureScore(placed);

  return roundOne(clamp(DETAIL_PENALTY_CAP, DETAIL_BOOST_CAP, fit + role + structure));
}

function getPlacedStarters(team) {
  if (!team?.players?.length) return [];

  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);
  const slotsByKey = new Map(slots.map(slot => [slot.key, slot]));
  const playersById = new Map(team.players.map(player => [player.id, player]));

  const placed = Object.entries(team.lineup || {})
    .filter(([, slotKey]) => slotKey && slotKey !== "BENCH")
    .map(([playerId, slotKey]) => {
      const player = playersById.get(playerId);
      const slot = slotsByKey.get(slotKey);
      if (!player || !slot) return null;
      return { player, slotPosition: String(slot.position || "").toUpperCase(), positions: getPlayerPositions(player) };
    })
    .filter(Boolean);

  if (placed.length >= 8) return placed.slice(0, 11);

  return [...team.players]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 11)
    .map(player => {
      const positions = getPlayerPositions(player);
      return { player, slotPosition: positions[0] || String(player.position || "MID").toUpperCase(), positions };
    });
}

function detailedSlotFit(placed) {
  const total = placed.reduce((sum, item) => {
    const primary = item.positions[0];
    if (primary === item.slotPosition) return sum + 0.2;
    if (item.positions.includes(item.slotPosition)) return sum + 0.08;
    return sum - 0.55;
  }, 0);

  return total / Math.max(1, placed.length) * 6.2;
}

function roleQualityScore(placed) {
  const teamAvg = average(placed.map(item => item.player.overall), 80);
  let score = 0;

  placed.forEach(item => {
    const role = ROLE_WEIGHTS[item.slotPosition] || {};
    const qualityEdge = clamp(-0.28, 0.34, (Number(item.player.overall || teamAvg) - teamAvg) / 42);
    const roleImportance = Object.values(role).reduce((sum, value) => sum + value, 0);
    score += qualityEdge * roleImportance;
  });

  return score;
}

function structureScore(placed) {
  const bySlot = new Map();
  placed.forEach(item => bySlot.set(item.slotPosition, (bySlot.get(item.slotPosition) || 0) + Number(item.player.overall || 0)));

  const has = (...positions) => positions.some(position => bySlot.has(position));
  const wideAttack = countSlots(placed, ["LW", "RW", "LM", "RM"]);
  const wideDefense = countSlots(placed, ["LB", "RB", "LWB", "RWB"]);
  const centralCreators = countSlots(placed, ["CAM", "CF", "CM"]);
  const holders = countSlots(placed, ["CDM", "CM"]);
  const centerBacks = countSlots(placed, ["CB"]);

  let score = 0;
  if (wideAttack >= 2 && wideDefense >= 2) score += 0.35;
  if (centralCreators >= 2 && has("ST", "CF")) score += 0.32;
  if (holders >= 2 && centerBacks >= 2) score += 0.28;
  if (has("GK") && centerBacks >= 2 && holders >= 1 && has("ST", "CF")) score += 0.35;
  if (wideAttack === 0 && wideDefense >= 2) score -= 0.28;
  if (centerBacks < 2 && !has("GK")) score -= 0.45;

  return score;
}

function countSlots(placed, slots) {
  const wanted = new Set(slots);
  return placed.filter(item => wanted.has(item.slotPosition)).length;
}

function average(values, fallback = 0) {
  const nums = values.filter(value => Number.isFinite(Number(value)));
  return nums.length ? nums.reduce((sum, value) => sum + Number(value), 0) / nums.length : fallback;
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}
