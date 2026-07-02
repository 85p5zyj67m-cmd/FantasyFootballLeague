const ATTACK_POSITIONS = new Set(["ST", "CF", "LW", "RW"]);
const MIDFIELD_POSITIONS = new Set(["CAM", "CM", "CDM", "LM", "RM"]);
const DEFENSE_POSITIONS = new Set(["CB", "LB", "RB", "LWB", "RWB"]);

export function getPositionGroupFromPosition(positionText = "") {
  const positions = splitPositions(positionText);

  if (positions.includes("GK")) return "GK";
  if (positions.some(position => ATTACK_POSITIONS.has(position))) return "ATT";
  if (positions.some(position => DEFENSE_POSITIONS.has(position))) return "DEF";
  if (positions.some(position => MIDFIELD_POSITIONS.has(position))) return "MID";

  return "MID";
}

export function getDisplayPosition(player) {
  return player?.detailedPosition || player?.positionDetail || player?.rawPosition || player?.position || "-";
}

export function getPositionGroup(player) {
  return player?.positionGroup || getPositionGroupFromPosition(player?.position || player?.detailedPosition || "");
}

export function getRatingTier(overall) {
  const rating = Number(overall) || 0;
  if (rating >= 95) return "diamond";
  if (rating >= 90) return "gold";
  if (rating >= 80) return "silver";
  return "bronze";
}

export function getPlayerPositions(player) {
  if (!player) return [];

  const detailed = player.detailedPosition || player.positionDetail || player.rawPosition || "";
  const positions = splitPositions(detailed);

  if (positions.length) return positions;

  const fallback = String(player.position || "").trim().toUpperCase();
  return fallback ? [fallback] : [];
}

export function canPlayPosition(player, slotPosition) {
  const target = String(slotPosition || "").trim().toUpperCase();
  if (!target) return false;

  const positions = getPlayerPositions(player);

  return positions.includes(target);
}

export function getTraitList(player) {
  if (!player) return [];
  if (Array.isArray(player.traits)) {
    return player.traits.filter(Boolean);
  }

  return [player.firstTrait, player.secondTrait, player.thirdTrait]
    .filter(Boolean)
    .map(trait => String(trait).trim())
    .filter(Boolean);
}

export function formatTraits(player) {
  const traits = getTraitList(player);
  return traits.length ? traits.join(" • ") : "No traits";
}

function splitPositions(positionText) {
  return String(positionText || "")
    .split(/[\/,]/)
    .map(position => position.trim().toUpperCase())
    .filter(Boolean);
}
