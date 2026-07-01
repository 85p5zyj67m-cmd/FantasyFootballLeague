import {
  createSeason as createTacticalSeason,
  continueAfterTactics as continueTacticalAfterTactics,
  simulateNextMatch as simulateTacticalNextMatch,
  getTeamStrength as getTacticalTeamStrength
} from "./seasonEngineTacticalLite.js?v=tactical-chain-engine-3";
import { getActiveTraitChains } from "./traitChainEngine.js?v=balanced-trait-recipes-1";
import { getFormationById } from "./formations.js";
import { getDetailedPositionSystemBoost } from "./detailPositionEngine.js?v=detailed-position-engine-1";

const DEFAULT_TACTICS = {
  attackingPlan: "Balanced Attack",
  pressingPlan: "Mid Block",
  defensiveShape: "Balanced Line",
  buildUpPlan: "Mixed Build Up",
  chanceFocus: "Best Chance",
  riskLevel: "Balanced"
};

const CHAIN_BOOST_CAP = 7.5;
const TACTIC_BOOST_CAP = 6.5;
const SYNERGY_BOOST_CAP = 5.5;
const FORMATION_BONUS_CAP = 2.4;
const FORMATION_PENALTY_CAP = -3.2;

const CHAIN_TO_TACTICS = {
  "crossing-chain": ["Wing Play", "Crosses", "Box Crashes", "Set Pieces"],
  "overlap-crossing-chain": ["Wing Play", "Crosses"],
  "low-cross-chain": ["Cutbacks", "Box Crashes", "Fast Transitions"],
  "cut-inside-chain": ["Cutbacks", "Central Overload"],
  "false-9-chain": ["Central Overload", "Patient Build Up", "Best Chance"],
  "genius-attack-chain": ["Central Overload", "Best Chance", "Brave"],
  "through-ball-chain": ["Through Balls", "Direct Runs", "Direct Build Up"],
  "direct-play-chain": ["Direct Runs", "Direct Build Up", "Fast Transitions"],
  "build-up-chain": ["Short Build Up", "Patient Build Up", "Safe"],
  "possession-chain": ["Short Build Up", "Patient Build Up"],
  "connector-chain": ["Mixed Build Up", "Central Overload", "Patient Build Up"],
  "pressing-attack-chain": ["High Press", "Counter Press", "High Line"],
  "destroyer-chain": ["Mid Block", "Counter Press", "Man Oriented"],
  "engine-chain": ["High Press", "Counter Press", "Brave"],
  "long-shot-chain": ["Long Shot Pressure"],
  "defensive-wall": ["Deep Compact", "Low Block", "Safe"],
  "low-block-chain": ["Deep Compact", "Low Block", "Safe"],
  "high-line-chain": ["High Line", "Balanced Line"],
  "aerial-control-chain": ["Crosses", "Set Pieces", "Deep Compact"],
  "set-piece-chain": ["Set Pieces"],
  "penalty-knockout-chain": ["Safe", "Balanced", "Brave"]
};

export function createSeason(teams, userTeamIndex) {
  return withSystemBalance(teams, () => createTacticalSeason(teams, userTeamIndex));
}

export function continueAfterTactics(season) {
  return withSystemBalance(collectSeasonTeams(season), () => continueTacticalAfterTactics(season));
}

export function simulateNextMatch(season) {
  return withSystemBalance(collectSeasonTeams(season), () => simulateTacticalNextMatch(season));
}

export function getTeamStrength(team) {
  return withSystemBalance([team], () => getTacticalTeamStrength(team));
}

function withSystemBalance(teams, callback) {
  const touched = [];
  Array.from(new Set((teams || []).filter(Boolean))).forEach(team => {
    const boost = systemBoost(team);
    (team.players || []).forEach(player => {
      if (typeof player.overall !== "number") return;
      touched.push([player, player.overall]);
      player.overall = roundOne(player.overall + boost);
    });
  });

  try {
    return callback();
  } finally {
    touched.forEach(([player, originalOverall]) => {
      player.overall = originalOverall;
    });
  }
}

function systemBoost(team) {
  return roundOne(chainBoost(team) + tacticBoost(team) + chainTacticSynergy(team) + formationFit(team) + detailedPositionFit(team));
}

function chainBoost(team) {
  return Math.min(CHAIN_BOOST_CAP, activeChains(team).reduce((sum, chain) => sum + chainLevelValue(chain), 0) * 0.8);
}

function chainLevelValue(chain) {
  if (chain.level <= 2) return 1.15;
  if (chain.level === 3) return 2.15;
  return 3.25;
}

function tacticBoost(team) {
  const tactics = normalizeTactics(team?.tactics);
  const activeChoices = Object.keys(DEFAULT_TACTICS).filter(key => tactics[key] !== DEFAULT_TACTICS[key]).length;
  const riskBonus = tactics.riskLevel === "Brave" ? 0.45 : tactics.riskLevel === "All In" ? 0.65 : 0;
  return Math.min(TACTIC_BOOST_CAP, activeChoices * 0.85 + riskBonus);
}

function chainTacticSynergy(team) {
  const tactics = normalizeTactics(team?.tactics);
  const values = new Set(Object.values(tactics));
  let score = 0;
  activeChains(team).forEach(chain => {
    const compatible = CHAIN_TO_TACTICS[chain.id] || [];
    if (compatible.some(value => values.has(value))) score += 0.85;
  });
  return Math.min(SYNERGY_BOOST_CAP, score);
}

function formationFit(team) {
  const formation = getFormationById(team?.formationId);
  if (!formation?.lines?.length) return 0;

  const required = { ATT: 0, MID: 0, DEF: 0, GK: 0 };
  const actual = { ATT: 0, MID: 0, DEF: 0, GK: 0 };

  formation.lines.flat().forEach(slot => {
    const group = positionGroup(slot);
    if (group) required[group] += 1;
  });

  selectedStarters(team).forEach(player => {
    if (player.position in actual) actual[player.position] += 1;
  });

  const missing = Object.keys(required).reduce((sum, key) => sum + Math.max(0, required[key] - actual[key]), 0);
  const overload = Math.max(0, actual.ATT - required.ATT) * 0.25 + Math.max(0, actual.MID - required.MID) * 0.2 + Math.max(0, actual.DEF - required.DEF) * 0.25;
  const raw = (missing === 0 ? 1.15 : 0) + overload - missing * 1.05 + (actual.GK >= 1 ? 0 : -1.8);
  return clamp(FORMATION_PENALTY_CAP, FORMATION_BONUS_CAP, raw);
}

function detailedPositionFit(team) {
  try {
    return getDetailedPositionSystemBoost(team);
  } catch (error) {
    console.warn("Detailed position boost calculation failed", error);
    return 0;
  }
}

function selectedStarters(team) {
  const players = team?.players || [];
  const selected = players.filter(player => team?.lineup?.[player.id] && team.lineup[player.id] !== "BENCH");
  return (selected.length >= 8 ? selected : [...players].sort((a, b) => b.overall - a.overall)).slice(0, 11);
}

function activeChains(team) {
  try {
    return getActiveTraitChains(team) || [];
  } catch (error) {
    console.warn("Balanced live chain calculation failed", error);
    return [];
  }
}

function normalizeTactics(raw) {
  const source = raw || {};
  const out = { ...DEFAULT_TACTICS };
  if (source.mentality === "Defensive") Object.assign(out, { riskLevel: "Safe", defensiveShape: "Deep Compact" });
  if (source.mentality === "Attacking") Object.assign(out, { riskLevel: "Brave", attackingPlan: "Central Overload" });
  if (source.pressing === "Low Block") out.pressingPlan = "Low Block";
  if (source.pressing === "High Press") out.pressingPlan = "High Press";
  if (source.defensiveLine === "Deep Line") out.defensiveShape = "Deep Compact";
  if (source.defensiveLine === "High Line") out.defensiveShape = "High Line";
  if (source.passing === "Short Passing") out.buildUpPlan = "Short Build Up";
  if (source.passing === "Direct Passing") out.buildUpPlan = "Direct Build Up";
  if (source.tempo === "Fast Tempo") out.buildUpPlan = "Fast Transitions";
  if (source.risk === "Safe Risk") out.riskLevel = "Safe";
  if (source.risk === "High Risk") out.riskLevel = "Brave";
  Object.keys(DEFAULT_TACTICS).forEach(key => {
    if (source[key]) out[key] = source[key];
  });
  return out;
}

function collectSeasonTeams(season) {
  const teams = new Set();
  season?.divisions?.forEach(division => division.teams?.forEach(team => teams.add(team)));
  season?.userTeam && teams.add(season.userTeam);
  season?.nextMatch?.home && teams.add(season.nextMatch.home);
  season?.nextMatch?.away && teams.add(season.nextMatch.away);
  season?.pendingBackgroundMatches?.forEach(match => {
    match.home && teams.add(match.home);
    match.away && teams.add(match.away);
  });
  return Array.from(teams);
}

function positionGroup(slot) {
  if (["ST", "CF", "LW", "RW"].includes(slot)) return "ATT";
  if (["LM", "CM", "CAM", "CDM", "RM"].includes(slot)) return "MID";
  if (["LB", "CB", "RB", "LWB", "RWB"].includes(slot)) return "DEF";
  if (slot === "GK") return "GK";
  return null;
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}
