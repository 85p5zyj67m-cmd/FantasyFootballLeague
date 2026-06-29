import {
  createSeason as createTacticalSeason,
  continueAfterTactics as continueTacticalAfterTactics,
  simulateNextMatch as simulateTacticalNextMatch,
  getTeamStrength as getTacticalTeamStrength
} from "./seasonEngineTacticalLite.js?v=tactical-chain-engine-2";
import { getActiveTraitChains } from "./traitChainEngine.js?v=chain-segments-1";

const QUALITY_ANCHOR = 82;
const QUALITY_FACTOR = 0.5;
const CHAIN_BOOST_PER_POINT = 0.9;
const TACTIC_IDENTITY_BOOST = 0.55;
const CHAIN_TACTIC_SYNERGY_BOOST = 0.9;
const MAX_CHAIN_BOOST = 8;
const MAX_TACTIC_BOOST = 5;
const MAX_SYNERGY_BOOST = 5;

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
  return withEqualWeightBalance(teams, () => createTacticalSeason(teams, userTeamIndex));
}

export function continueAfterTactics(season) {
  return withEqualWeightBalance(collectSeasonTeams(season), () => continueTacticalAfterTactics(season));
}

export function simulateNextMatch(season) {
  return withEqualWeightBalance(collectSeasonTeams(season), () => simulateTacticalNextMatch(season));
}

export function getTeamStrength(team) {
  return withEqualWeightBalance([team], () => getTacticalTeamStrength(team));
}

function withEqualWeightBalance(teams, callback) {
  const touched = [];
  const uniqueTeams = Array.from(new Set((teams || []).filter(Boolean)));

  uniqueTeams.forEach(team => {
    const virtualBoost = calculateSystemBoost(team);
    (team.players || []).forEach(player => {
      if (typeof player.overall !== "number") return;
      touched.push([player, player.overall]);
      player.overall = compressOverall(player.overall) + virtualBoost;
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

function compressOverall(overall) {
  return Math.round((QUALITY_ANCHOR + (overall - QUALITY_ANCHOR) * QUALITY_FACTOR) * 10) / 10;
}

function calculateSystemBoost(team) {
  const chain = calculateChainBoost(team);
  const tactic = calculateTacticIdentityBoost(team);
  const synergy = calculateChainTacticSynergy(team);
  return Math.round((chain + tactic + synergy) * 10) / 10;
}

function calculateChainBoost(team) {
  const score = getChainSystemScore(team);
  return Math.min(MAX_CHAIN_BOOST, score * CHAIN_BOOST_PER_POINT);
}

function calculateTacticIdentityBoost(team) {
  const tactics = normalizeTactics(team?.tactics);
  const activeChoices = Object.keys(DEFAULT_TACTICS).filter(key => tactics[key] !== DEFAULT_TACTICS[key]).length;
  const braveBonus = tactics.riskLevel === "Brave" ? 0.35 : tactics.riskLevel === "All In" ? 0.55 : 0;
  return Math.min(MAX_TACTIC_BOOST, activeChoices * TACTIC_IDENTITY_BOOST + braveBonus);
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
