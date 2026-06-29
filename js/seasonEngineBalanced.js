import {
  createSeason as createTacticalSeason,
  continueAfterTactics as continueTacticalAfterTactics,
  simulateNextMatch as simulateTacticalNextMatch,
  getTeamStrength as getTacticalTeamStrength
} from "./seasonEngineTacticalLite.js?v=tactical-chain-engine-2";
import { getActiveTraitChains } from "./traitChainEngine.js?v=chain-segments-1";
import { getFormationById } from "./formations.js";

const CHAIN_BOOST_PER_POINT = 0.8;
const TACTIC_IDENTITY_BOOST = 0.85;
const CHAIN_TACTIC_SYNERGY_BOOST = 0.85;
const MAX_CHAIN_BOOST = 7.5;
const MAX_TACTIC_BOOST = 6.5;
const MAX_SYNERGY_BOOST = 5.5;
const MAX_FORMATION_BOOST = 2.4;
const MAX_FORMATION_PENALTY = -3.2;

const DEFAULT_TACTICS = {
  attackingPlan: "Balanced Attack",
  pressingPlan: "Mid Block",
  defensiveShape: "Balanced Line",
  buildUpPlan: "Mixed Build Up",
  chanceFocus: "Best Chance",
  riskLevel: "Balanced"
};

const CHAIN_VARIABLES = {
  "crossing-chain": "aerialChance",
  "overlap-crossing-chain": "crossVolume",
  "low-cross-chain": "boxEntry",
  "cut-inside-chain": "halfSpaceShot",
  "false-9-chain": "fluidity",
  "genius-attack-chain": "magicChance",
  "through-ball-chain": "throughBall",
  "direct-play-chain": "transitionSpeed",
  "build-up-chain": "buildupSecurity",
  "possession-chain": "possessionControl",
  "connector-chain": "linkPlay",
  "pressing-attack-chain": "highRecovery",
  "destroyer-chain": "secondBalls",
  "engine-chain": "staminaPressure",
  "long-shot-chain": "longShotThreat",
  "defensive-wall": "boxDefense",
  "low-block-chain": "compactness",
  "high-line-chain": "counterCover",
  "aerial-control-chain": "aerialControl",
  "set-piece-chain": "setPieceThreat",
  "penalty-knockout-chain": "clutch"
};

const TACTIC_SYNERGIES = {
  aerialChance: ["Crosses", "Box Crashes", "Wing Play", "Set Pieces"],
  crossVolume: ["Crosses", "Wing Play"],
  boxEntry: ["Cutbacks", "Box Crashes", "Fast Transitions"],
  halfSpaceShot: ["Cutbacks", "Central Overload"],
  fluidity: ["Central Overload", "Patient Build Up", "Best Chance"],
  magicChance: ["Central Overload", "Best Chance", "Brave"],
  throughBall: ["Through Balls", "Direct Runs", "Direct Build Up"],
  transitionSpeed: ["Direct Runs", "Direct Build Up", "Fast Transitions"],
  buildupSecurity: ["Short Build Up", "Patient Build Up", "Safe"],
  possessionControl: ["Short Build Up", "Patient Build Up"],
  linkPlay: ["Mixed Build Up", "Central Overload", "Patient Build Up"],
  highRecovery: ["High Press", "Counter Press", "High Line"],
  secondBalls: ["Mid Block", "Counter Press", "Man Oriented"],
  staminaPressure: ["High Press", "Counter Press", "Brave"],
  longShotThreat: ["Long Shot Pressure"],
  boxDefense: ["Deep Compact", "Low Block", "Safe"],
  compactness: ["Deep Compact", "Low Block", "Safe"],
  counterCover: ["High Line", "Balanced Line"],
  aerialControl: ["Crosses", "Set Pieces", "Deep Compact"],
  setPieceThreat: ["Set Pieces"],
  clutch: ["Safe", "Balanced", "Brave"]
};

export function createSeason(teams, userTeamIndex) {
  return withBalancedSystemInfluence(teams, () => createTacticalSeason(teams, userTeamIndex));
}

export function continueAfterTactics(season) {
  return withBalancedSystemInfluence(collectSeasonTeams(season), () => continueTacticalAfterTactics(season));
}

export function simulateNextMatch(season) {
  return withBalancedSystemInfluence(collectSeasonTeams(season), () => simulateTacticalNextMatch(season));
}

export function getTeamStrength(team) {
  return withBalancedSystemInfluence([team], () => getTacticalTeamStrength(team));
}

function withBalancedSystemInfluence(teams, callback) {
  const touched = [];
  const uniqueTeams = Array.from(new Set((teams || []).filter(Boolean)));

  uniqueTeams.forEach(team => {
    const systemBoost = calculateSystemBoost(team);
    (team.players || []).forEach(player => {
      if (typeof player.overall !== "number") return;
      touched.push([player, player.overall]);
      player.overall = roundOne(player.overall + systemBoost);
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

function calculateSystemBoost(team) {
  const chain = calculateChainBoost(team);
  const tactic = calculateTacticIdentityBoost(team);
  const synergy = calculateChainTacticSynergy(team);
  const formation = calculateFormationFitBoost(team);
  return roundOne(chain + tactic + synergy + formation);
}

function calculateChainBoost(team) {
  const score = getChainSystemScore(team);
  return Math.min(MAX_CHAIN_BOOST, score * CHAIN_BOOST_PER_POINT);
}

function calculateTacticIdentityBoost(team) {
  const tactics = normalizeTactics(team?.tactics);
  const activeChoices = Object.keys(DEFAULT_TACTICS).filter(key => tactics[key] !== DEFAULT_TACTICS[key]).length;
  const riskBonus = tactics.riskLevel === "Brave" ? 0.45 : tactics.riskLevel === "All In" ? 0.65 : 0;
  return Math.min(MAX_TACTIC_BOOST, activeChoices * TACTIC_IDENTITY_BOOST + riskBonus);
}

function calculateChainTacticSynergy(team) {
  const tactics = normalizeTactics(team?.tactics);
  const tacticValues = new Set(Object.values(tactics));
  const activeVariables = getActiveChainVariables(team);
  let score = 0;

  activeVariables.forEach(variable => {
    const matchingValues = TACTIC_SYNERGIES[variable] || [];
    if (matchingValues.some(value => tacticValues.has(value))) {
      score += CHAIN_TACTIC_SYNERGY_BOOST;
    }
  });

  return Math.min(MAX_SYNERGY_BOOST, score);
}

function calculateFormationFitBoost(team) {
  const formation = getFormationById(team?.formationId);
  if (!formation?.lines?.length) return 0;

  const required = { ATT: 0, MID: 0, DEF: 0, GK: 0 };
  const actual = { ATT: 0, MID: 0, DEF: 0, GK: 0 };

  formation.lines.flat().forEach(positionGroup => {
    if (positionGroup in required) required[positionGroup] += 1;
  });

  getSelectedStarters(team).forEach(player => {
    if (player.position in actual) actual[player.position] += 1;
  });

  const missing =
    Math.max(0, required.ATT - actual.ATT) +
    Math.max(0, required.MID - actual.MID) +
    Math.max(0, required.DEF - actual.DEF) +
    Math.max(0, required.GK - actual.GK);

  const overload =
    Math.max(0, actual.ATT - required.ATT) * 0.25 +
    Math.max(0, actual.MID - required.MID) * 0.2 +
    Math.max(0, actual.DEF - required.DEF) * 0.25;

  const fitBonus = missing === 0 ? 1.15 : 0;
  const goalkeeperPenalty = actual.GK >= 1 ? 0 : -1.8;
  const raw = fitBonus + overload - missing * 1.05 + goalkeeperPenalty;

  return clamp(MAX_FORMATION_PENALTY, MAX_FORMATION_BOOST, raw);
}

function getSelectedStarters(team) {
  const players = team?.players || [];
  const selected = players.filter(player => team?.lineup?.[player.id] && team.lineup[player.id] !== "BENCH");
  return (selected.length >= 8 ? selected : [...players].sort((a, b) => b.overall - a.overall)).slice(0, 11);
}

function getChainSystemScore(team) {
  try {
    return getActiveTraitChains(team).reduce((sum, chain) => {
      if (chain.level <= 2) return sum + 1.15;
      if (chain.level === 3) return sum + 2.15;
      return sum + 3.25;
    }, 0);
  } catch (error) {
    console.warn("Balanced chain score failed", error);
    return 0;
  }
}

function getActiveChainVariables(team) {
  try {
    return getActiveTraitChains(team)
      .map(chain => CHAIN_VARIABLES[chain.id])
      .filter(Boolean);
  } catch (error) {
    console.warn("Balanced chain synergy failed", error);
    return [];
  }
}

function normalizeTactics(raw) {
  const source = raw || {};
  return {
    ...DEFAULT_TACTICS,
    attackingPlan: source.attackingPlan || translateAttackingPlan(source) || DEFAULT_TACTICS.attackingPlan,
    pressingPlan: source.pressingPlan || translatePressingPlan(source) || DEFAULT_TACTICS.pressingPlan,
    defensiveShape: source.defensiveShape || translateDefensiveShape(source) || DEFAULT_TACTICS.defensiveShape,
    buildUpPlan: source.buildUpPlan || translateBuildUpPlan(source) || DEFAULT_TACTICS.buildUpPlan,
    chanceFocus: source.chanceFocus || DEFAULT_TACTICS.chanceFocus,
    riskLevel: source.riskLevel || translateRiskLevel(source) || DEFAULT_TACTICS.riskLevel
  };
}

function translateAttackingPlan(source) {
  if (source.mentality === "Attacking") return "Central Overload";
  return null;
}

function translatePressingPlan(source) {
  if (source.pressing === "Low Block") return "Low Block";
  if (source.pressing === "High Press") return "High Press";
  return null;
}

function translateDefensiveShape(source) {
  if (source.defensiveLine === "Deep Line") return "Deep Compact";
  if (source.defensiveLine === "High Line") return "High Line";
  return null;
}

function translateBuildUpPlan(source) {
  if (source.passing === "Short Passing") return "Short Build Up";
  if (source.passing === "Direct Passing") return "Direct Build Up";
  if (source.tempo === "Fast Tempo") return "Fast Transitions";
  return null;
}

function translateRiskLevel(source) {
  if (source.risk === "Safe Risk" || source.mentality === "Defensive") return "Safe";
  if (source.risk === "High Risk" || source.mentality === "Attacking") return "Brave";
  return null;
}

function collectSeasonTeams(season) {
  const teams = new Set();
  season?.divisions?.forEach(division => {
    division.teams?.forEach(team => teams.add(team));
  });
  season?.userTeam && teams.add(season.userTeam);
  season?.nextMatch?.home && teams.add(season.nextMatch.home);
  season?.nextMatch?.away && teams.add(season.nextMatch.away);
  season?.pendingBackgroundMatches?.forEach(match => {
    match.home && teams.add(match.home);
    match.away && teams.add(match.away);
  });
  return Array.from(teams);
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}
