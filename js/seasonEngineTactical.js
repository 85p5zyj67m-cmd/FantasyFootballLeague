import { getFormationById } from "./formations.js";
import { getActiveTraitChains } from "./traitChainEngine.js?v=chain-segments-1";
import { getTraitList } from "./playerUtils.js?v=strict-cdm-1";

export const DIVISION_ORDER = [
  { id: "NORTH", name: "North", compass: "north" },
  { id: "WEST", name: "West", compass: "west" },
  { id: "EAST", name: "East", compass: "east" },
  { id: "SOUTH", name: "South", compass: "south" }
];

export const KNOCKOUT_ROUNDS = [
  { key: "ROUND_OF_16", label: "Round of 16" },
  { key: "QUARTERFINALS", label: "Quarterfinals" },
  { key: "SEMIFINALS", label: "Semifinals" },
  { key: "FINAL", label: "Final" }
];

const GROUP_PHASES = { FIRST_HALF: "First Half", SECOND_HALF: "Second Half" };
const DEFAULT_TACTICS = {
  attackingPlan: "Balanced Attack",
  pressingPlan: "Mid Block",
  defensiveShape: "Balanced Line",
  buildUpPlan: "Mixed Build Up",
  chanceFocus: "Best Chance",
  riskLevel: "Balanced"
};

const BASE_STYLE_PROFILES = {
  Balanced: { attack: 0, control: 0, defense: 0, tempo: 0, risk: 0 },
  Possession: { attack: 0.4, control: 3.2, defense: 0.8, tempo: -0.3, risk: -0.4 },
  "Counter Attack": { attack: 2.0, control: -0.7, defense: 1.0, tempo: 1.6, risk: 0.7 },
  "High Press": { attack: 1.5, control: 1.0, defense: -0.5, tempo: 2.6, risk: 1.3 },
  "Defensive Block": { attack: -1.0, control: -0.8, defense: 3.4, tempo: -1.4, risk: -1.2 },
  Attacking: { attack: 2.0, control: 0, defense: -0.8, tempo: 1.6, risk: 1.3 },
  "Midfield Control": { attack: 0.8, control: 3.2, defense: 0.4, tempo: 0, risk: 0 },
  "Defensive Wall": { attack: -1.2, control: -0.3, defense: 3.2, tempo: -1.2, risk: -1.2 },
  "Star Hunter": { attack: 1.6, control: 0.3, defense: 0, tempo: 0.8, risk: 0.8 },
  "Goalkeeper Early": { attack: -0.3, control: 0, defense: 1.7, tempo: -0.4, risk: -0.8 }
};

const CHAIN_EFFECTS = {
  "crossing-chain": ["aerialChance", "Aerial chance quality"],
  "overlap-crossing-chain": ["crossVolume", "Cross volume"],
  "low-cross-chain": ["boxEntry", "Low box entries"],
  "cut-inside-chain": ["halfSpaceShot", "Half-space shooting"],
  "false-9-chain": ["fluidity", "False-nine fluidity"],
  "genius-attack-chain": ["magicChance", "Creative special actions"],
  "through-ball-chain": ["throughBall", "Runs behind"],
  "direct-play-chain": ["transitionSpeed", "Direct transition speed"],
  "build-up-chain": ["buildupSecurity", "Build-up security"],
  "possession-chain": ["possessionControl", "Possession control"],
  "connector-chain": ["linkPlay", "Line connection"],
  "pressing-attack-chain": ["highRecovery", "High recoveries"],
  "destroyer-chain": ["secondBalls", "Second-ball control"],
  "engine-chain": ["staminaPressure", "Sustained intensity"],
  "long-shot-chain": ["longShotThreat", "Long-shot threat"],
  "defensive-wall": ["boxDefense", "Box defense"],
  "low-block-chain": ["compactness", "Deep compactness"],
  "high-line-chain": ["counterCover", "High-line cover"],
  "aerial-control-chain": ["aerialControl", "Aerial control"],
  "set-piece-chain": ["setPieceThreat", "Set-piece threat"],
  "penalty-knockout-chain": ["clutch", "Knockout clutch"]
};

const TACTIC_PROFILES = {
  attackingPlan: {
    "Wing Play": { crossVolume: 1.8, wideOverload: 1.2, centralControl: -0.4 },
    "Central Overload": { centralControl: 1.9, linkPlay: 1.1, wideOverload: -0.5 },
    "Direct Runs": { transitionSpeed: 1.7, throughBall: 1.1, buildupSecurity: -0.7 },
    "Patient Build Up": { possessionControl: 1.8, buildupSecurity: 1.1, tempo: -0.8 },
    "Long Shot Pressure": { longShotThreat: 2.0, boxEntry: -0.5 }
  },
  pressingPlan: {
    "Low Block": { compactness: 1.8, boxDefense: 0.8, highRecovery: -1.4, tempo: -0.8 },
    "Mid Block": { secondBalls: 0.7, compactness: 0.4 },
    "High Press": { highRecovery: 2.1, staminaPressure: 0.8, counterCover: -0.9, risk: 0.9 },
    "Counter Press": { highRecovery: 1.5, secondBalls: 1.2, staminaPressure: 0.9, risk: 1.0 }
  },
  defensiveShape: {
    "Deep Compact": { compactness: 2.0, boxDefense: 1.3, counterCover: -0.5, possessionControl: -0.5 },
    "Balanced Line": { compactness: 0.6, counterCover: 0.5 },
    "High Line": { counterCover: 1.1, highRecovery: 0.8, compactness: -0.8, risk: 0.8 },
    "Man Oriented": { secondBalls: 1.0, boxDefense: 0.5, fluidityDefense: -0.7 }
  },
  buildUpPlan: {
    "Short Build Up": { buildupSecurity: 1.8, possessionControl: 1.1, transitionSpeed: -0.8 },
    "Mixed Build Up": { linkPlay: 0.5 },
    "Direct Build Up": { transitionSpeed: 1.7, throughBall: 0.7, possessionControl: -0.8 },
    "Fast Transitions": { transitionSpeed: 2.0, boxEntry: 0.8, buildupSecurity: -1.0, risk: 0.8 }
  },
  chanceFocus: {
    Crosses: { crossVolume: 1.6, aerialChance: 0.8, longShotThreat: -0.5 },
    "Through Balls": { throughBall: 1.8, transitionSpeed: 0.6, crossVolume: -0.4 },
    Cutbacks: { boxEntry: 1.7, halfSpaceShot: 0.9, aerialChance: -0.5 },
    "Set Pieces": { setPieceThreat: 2.1, tempo: -0.4 },
    "Box Crashes": { boxEntry: 1.2, aerialChance: 1.0, risk: 0.6 }
  },
  riskLevel: {
    Safe: { risk: -1.8, defense: 1.0, attack: -0.7, tempo: -0.4 },
    Brave: { risk: 1.5, attack: 1.0, tempo: 0.6, defense: -0.6 },
    "All In": { risk: 2.7, attack: 1.8, tempo: 1.1, defense: -1.4, counterCover: -0.8 }
  }
};

const LEGACY_MAP = {
  mentality: { Defensive: { riskLevel: "Safe", defensiveShape: "Deep Compact" }, Attacking: { riskLevel: "Brave", attackingPlan: "Central Overload" } },
  pressing: { "Low Block": { pressingPlan: "Low Block" }, "High Press": { pressingPlan: "High Press" } },
  defensiveLine: { "Deep Line": { defensiveShape: "Deep Compact" }, "High Line": { defensiveShape: "High Line" } },
  passing: { "Short Passing": { buildUpPlan: "Short Build Up" }, "Direct Passing": { buildUpPlan: "Direct Build Up" } },
  tempo: { "Fast Tempo": { buildUpPlan: "Fast Transitions" } },
  risk: { "Safe Risk": { riskLevel: "Safe" }, "High Risk": { riskLevel: "Brave" } }
};

export function createSeason(teams, userTeamIndex) {
  teams.forEach(ensureTacticalSetup);
  const divisions = createCompassDivisions(teams);
  const groupRounds = createGroupRounds(divisions);
  const userTeam = teams[userTeamIndex];
  const season = {
    userTeamIndex,
    userTeam,
    divisions,
    standings: createInitialStandings(divisions),
    groupRounds,
    groupRoundIndex: { FIRST_HALF: 0, SECOND_HALF: 0 },
    phase: "FIRST_HALF",
    waitingForTactics: true,
    tacticsMoment: createTacticsMoment("FIRST_HALF"),
    pendingBackgroundMatches: [],
    nextMatch: null,
    currentMatch: null,
    userSchedule: [],
    userMatchHistory: [],
    opponentResults: [],
    allResults: [],
    playoffSeeds: [],
    knockoutRounds: [],
    knockoutRoundIndex: -1,
    champion: null,
    userEliminated: false,
    eliminationReason: ""
  };
  season.userSchedule = extractUserGroupSchedule(groupRounds, userTeam);
  sortAllStandings(season);
  return season;
}

export function simulateNextMatch(season) {
  if (!season || season.waitingForTactics || season.phase === "COMPLETE") return season;
  if (!season.nextMatch) prepareNextUserMatch(season);
  if (!season.nextMatch || season.waitingForTactics || season.phase === "COMPLETE") return season;
  simulateBackgroundMatches(season, season.pendingBackgroundMatches);
  season.pendingBackgroundMatches = [];
  const match = season.nextMatch;
  const result = simulateMatchWithEvents(match.home, match.away, { knockout: match.type === "KNOCKOUT" });
  const fullMatch = { ...match, ...result, userMatch: true };
  registerMatchResult(season, fullMatch, true);
  season.currentMatch = fullMatch;
  season.userMatchHistory.push(fullMatch);
  season.nextMatch = null;
  if (match.type === "GROUP") {
    season.groupRoundIndex[season.phase] = match.roundIndex + 1;
    prepareNextUserMatch(season);
    return season;
  }
  resolveUserKnockoutMatch(season, fullMatch);
  return season;
}

export function continueAfterTactics(season) {
  if (!season || season.phase === "COMPLETE") return season;
  ensureTacticalSetup(season.userTeam);
  season.waitingForTactics = false;
  season.tacticsMoment = null;
  prepareNextUserMatch(season);
  return season;
}

export function getTeamStrength(team) {
  const profile = getTeamProfile(team, null);
  return Math.round((profile.attack + profile.control + profile.defense + profile.goalkeeping * 0.25) / 3.25);
}

function prepareNextUserMatch(season) {
  if (season.waitingForTactics || season.phase === "COMPLETE") return;
  if (season.phase === "FIRST_HALF" || season.phase === "SECOND_HALF") prepareNextGroupMatch(season);
}

function prepareNextGroupMatch(season) {
  const rounds = season.groupRounds[season.phase];
  let index = season.groupRoundIndex[season.phase];
  while (index < rounds.length) {
    const round = rounds[index];
    const userMatch = round.matches.find(match => involvesUser(season, match));
    const backgroundMatches = round.matches.filter(match => !involvesUser(season, match));
    if (userMatch) {
      season.nextMatch = { ...userMatch, round: `${GROUP_PHASES[season.phase]} - Matchday ${round.number}`, roundIndex: index, phase: season.phase };
      season.pendingBackgroundMatches = backgroundMatches.map(match => ({ ...match, round: `${GROUP_PHASES[season.phase]} - Matchday ${round.number}`, roundIndex: index, phase: season.phase }));
      return;
    }
    simulateBackgroundMatches(season, backgroundMatches.map(match => ({ ...match, round: `${GROUP_PHASES[season.phase]} - Matchday ${round.number}`, roundIndex: index, phase: season.phase })));
    index++;
    season.groupRoundIndex[season.phase] = index;
  }
  if (season.phase === "FIRST_HALF") {
    season.phase = "SECOND_HALF";
    season.waitingForTactics = true;
    season.tacticsMoment = createTacticsMoment("SECOND_HALF");
    season.nextMatch = null;
    season.pendingBackgroundMatches = [];
    return;
  }
  enterKnockouts(season);
}

function enterKnockouts(season) {
  sortAllStandings(season);
  const seeds = Object.values(season.standings).flatMap(rows => rows.slice(0, 4)).sort(sortStandings).map(row => row.team);
  season.playoffSeeds = seeds;
  if (!seeds.includes(season.userTeam)) {
    season.userEliminated = true;
    season.eliminationReason = "You missed the knockout places.";
    finishRemainingKnockouts(season, seeds, 0);
    return;
  }
  startKnockoutRound(season, 0, seeds);
}

function startKnockoutRound(season, roundIndex, entrants) {
  const round = KNOCKOUT_ROUNDS[roundIndex];
  const fixtures = createSeededFixtures(entrants, round);
  const userFixtureIndex = fixtures.findIndex(match => involvesUser(season, match));
  season.phase = round.key;
  season.knockoutRoundIndex = roundIndex;
  const roundRecord = { key: round.key, label: round.label, fixtures, results: Array(fixtures.length).fill(null), winners: Array(fixtures.length).fill(null) };
  season.knockoutRounds.push(roundRecord);
  fixtures.forEach((fixture, fixtureIndex) => {
    if (fixtureIndex === userFixtureIndex) return;
    const fullMatch = { ...fixture, ...simulateMatchWithEvents(fixture.home, fixture.away, { knockout: true }), fixtureIndex, userMatch: false };
    roundRecord.results[fixtureIndex] = fullMatch;
    roundRecord.winners[fixtureIndex] = fullMatch.winner;
    registerMatchResult(season, fullMatch, false);
  });
  if (userFixtureIndex === -1) {
    finishRemainingKnockouts(season, roundRecord.winners.filter(Boolean), roundIndex + 1);
    return;
  }
  const userFixture = { ...fixtures[userFixtureIndex], fixtureIndex: userFixtureIndex };
  season.nextMatch = userFixture;
  season.waitingForTactics = true;
  season.tacticsMoment = createTacticsMoment(round.key, userFixture);
  season.pendingBackgroundMatches = [];
  addUserScheduleMatch(season, userFixture);
}

function resolveUserKnockoutMatch(season, match) {
  const roundRecord = season.knockoutRounds[season.knockoutRounds.length - 1];
  roundRecord.results[match.fixtureIndex] = match;
  roundRecord.winners[match.fixtureIndex] = match.winner;
  if (match.winner !== season.userTeam) {
    season.userEliminated = true;
    season.eliminationReason = `Eliminated in the ${roundRecord.label}.`;
    finishRemainingKnockouts(season, roundRecord.winners.filter(Boolean), season.knockoutRoundIndex + 1);
    return;
  }
  if (season.phase === "FINAL") {
    season.champion = season.userTeam;
    season.phase = "COMPLETE";
    season.waitingForTactics = false;
    season.tacticsMoment = null;
    season.nextMatch = null;
    return;
  }
  startKnockoutRound(season, season.knockoutRoundIndex + 1, roundRecord.winners.filter(Boolean));
}

function finishRemainingKnockouts(season, entrants, startRoundIndex) {
  let teams = entrants;
  for (let roundIndex = startRoundIndex; roundIndex < KNOCKOUT_ROUNDS.length; roundIndex++) {
    if (teams.length <= 1) break;
    const round = KNOCKOUT_ROUNDS[roundIndex];
    const fixtures = createSeededFixtures(teams, round);
    const winners = [];
    const results = [];
    fixtures.forEach((fixture, fixtureIndex) => {
      const fullMatch = { ...fixture, ...simulateMatchWithEvents(fixture.home, fixture.away, { knockout: true }), fixtureIndex, userMatch: false };
      winners.push(fullMatch.winner);
      results.push(fullMatch);
      registerMatchResult(season, fullMatch, false);
    });
    season.knockoutRounds.push({ key: round.key, label: round.label, fixtures, results, winners });
    teams = winners;
  }
  season.champion = teams[0] || season.champion;
  season.phase = "COMPLETE";
  season.waitingForTactics = false;
  season.tacticsMoment = null;
  season.nextMatch = null;
  season.pendingBackgroundMatches = [];
}

function simulateBackgroundMatches(season, matches) {
  matches.forEach(match => {
    const fullMatch = { ...match, ...simulateMatchWithEvents(match.home, match.away, { knockout: match.type === "KNOCKOUT" }), events: [], userMatch: false };
    registerMatchResult(season, fullMatch, false);
  });
}

function simulateMatchWithEvents(home, away, options = {}) {
  ensureTacticalSetup(home);
  ensureTacticalSetup(away);
  const homeProfile = getTeamProfile(home, away);
  const awayProfile = getTeamProfile(away, home);
  applyCounters(homeProfile, awayProfile);
  applyCounters(awayProfile, homeProfile);
  const homeRating = homeProfile.total + 1.4 + randomBetween(-4.6, 5.2);
  const awayRating = awayProfile.total + randomBetween(-4.6, 5.2);
  const stats = { homeXg: 0, awayXg: 0, homeShots: 0, awayShots: 0, homeMomentum: Math.round(homeRating + homeProfile.momentumBias), awayMomentum: Math.round(awayRating + awayProfile.momentumBias) };
  const events = [
    { minute: 1, type: "INFO", text: `1' Kickoff. ${home.name} and ${away.name} are underway.` },
    { minute: 7, type: "INFO", text: `7' Tactical setup: ${home.name} use ${describePlan(homeProfile)}; ${away.name} answer with ${describePlan(awayProfile)}.` }
  ];
  pushChainInfo(events, home, away, homeProfile, awayProfile);
  const goals = playMinutes({ from: 2, to: 90, home, away, homeProfile, awayProfile, homeRating, awayRating, stats, events, goals: { home: 0, away: 0 } });
  let winner = null;
  let decidedBy = "90";
  let penaltyScore = null;
  if (options.knockout && goals.home === goals.away) {
    events.push({ minute: 91, type: "INFO", text: "91' Extra time begins. Tactical discipline matters now." });
    const extra = playMinutes({ from: 91, to: 120, home, away, homeProfile, awayProfile, homeRating: homeRating - 1.1, awayRating: awayRating - 1.1, stats, events, goals, chanceScale: 0.72 });
    goals.home = extra.home;
    goals.away = extra.away;
    decidedBy = "ET";
    if (goals.home === goals.away) {
      const penalties = simulatePenaltyShootout(home, away, homeProfile, awayProfile);
      winner = penalties.winner;
      penaltyScore = penalties.score;
      decidedBy = "PEN";
      events.push({ minute: 121, type: "GOAL", text: `Penalties: ${penalties.score}. ${winner.name} survive the shootout.` });
    }
  }
  if (!winner) winner = goals.home > goals.away ? home : goals.away > goals.home ? away : null;
  events.push({ minute: options.knockout && decidedBy !== "90" ? 120 : 90, type: "INFO", text: `Full-time: ${home.name} ${goals.home} - ${goals.away} ${away.name}` });
  events.sort((a, b) => a.minute - b.minute || eventPriority(a.type) - eventPriority(b.type));
  stats.homeXg = roundStat(stats.homeXg);
  stats.awayXg = roundStat(stats.awayXg);
  stats.homeChainScore = roundStat(homeProfile.chainScore);
  stats.awayChainScore = roundStat(awayProfile.chainScore);
  stats.homeTacticEdge = roundStat(homeProfile.tacticEdge);
  stats.awayTacticEdge = roundStat(awayProfile.tacticEdge);
  return { homeGoals: goals.home, awayGoals: goals.away, winner, decidedBy, penaltyScore, stats, events };
}

function playMinutes(context) {
  const goals = { ...context.goals };
  const chanceScale = context.chanceScale ?? 1;
  for (let minute = context.from; minute <= context.to; minute++) {
    const tempo = (context.homeProfile.tempo + context.awayProfile.tempo) / 200;
    const risk = (context.homeProfile.risk + context.awayProfile.risk) / 240;
    const chanceRate = clamp(0.034, 0.135, (0.055 + tempo * 0.028 + risk * 0.022) * chanceScale);
    if (Math.random() > chanceRate) {
      pushHalfTimeEvent(context, goals, minute);
      continue;
    }
    const homeEdge = chanceEdge(context.homeProfile, context.awayProfile, context.homeRating);
    const awayEdge = chanceEdge(context.awayProfile, context.homeProfile, context.awayRating);
    const isHomeChance = Math.random() < clamp(0.22, 0.78, 0.5 + (homeEdge - awayEdge) / 94);
    const attackingTeam = isHomeChance ? context.home : context.away;
    const defendingTeam = isHomeChance ? context.away : context.home;
    const attacker = isHomeChance ? context.homeProfile : context.awayProfile;
    const defender = isHomeChance ? context.awayProfile : context.homeProfile;
    const chanceType = chooseChanceType(attacker, defender);
    const pressure = chancePressure(attacker, defender, chanceType);
    const quality = chanceQuality(attacker, chanceType, pressure);
    const goalChance = clamp(0.045, 0.49, quality * 0.84 + pressure / 360 + attacker.clutch * 0.005);
    if (isHomeChance) {
      context.stats.homeShots++;
      context.stats.homeXg += quality;
    } else {
      context.stats.awayShots++;
      context.stats.awayXg += quality;
    }
    if (Math.random() < goalChance) {
      if (isHomeChance) goals.home++;
      else goals.away++;
      const scorer = pickScorer(attackingTeam, chanceType);
      context.events.push({ minute, type: "GOAL", text: createGoalText(minute, attackingTeam, scorer, chanceType, attacker) });
    } else {
      context.events.push({ minute, type: Math.random() < 0.4 ? "SAVE" : "CHANCE", text: createChanceText(minute, attackingTeam, defendingTeam, quality, chanceType) });
    }
    pushHalfTimeEvent(context, goals, minute);
  }
  return goals;
}

function getTeamProfile(team, opponent) {
  ensureTacticalSetup(team);
  const starters = getStarters(team);
  const bench = getBench(team, starters);
  const positions = getPositionAverages(starters);
  const starterAverage = average(starters.map(player => player.overall));
  const benchAverage = average(bench.map(player => player.overall), starterAverage - 4);
  const starPower = average(starters.slice(0, 3).map(player => player.overall), starterAverage);
  const style = BASE_STYLE_PROFILES[team.playStyle] || BASE_STYLE_PROFILES.Balanced;
  const balance = getFormationBalance(team, starters);
  const tactical = buildTacticalModifiers(team);
  const chain = buildChainModifiers(team);
  const vars = mergeVariables(chain.variables, tactical.variables);
  const attack = positions.ATT * 0.52 + positions.MID * 0.23 + starPower * 0.13 + benchAverage * 0.04 + style.attack + balance.attack + tactical.attack + chain.attack;
  const control = positions.MID * 0.49 + starterAverage * 0.2 + positions.DEF * 0.12 + benchAverage * 0.06 + style.control + balance.control + tactical.control + chain.control;
  const defense = positions.DEF * 0.49 + positions.GK * 0.22 + positions.MID * 0.12 + benchAverage * 0.04 + style.defense + balance.defense + tactical.defense + chain.defense;
  const goalkeeping = positions.GK + balance.goalkeeping + chain.goalkeeping;
  const tempo = starterAverage + style.tempo + balance.tempo + tactical.tempo + chain.tempo;
  const risk = 50 + style.risk + balance.risk + tactical.risk + chain.risk;
  const total = attack * 0.35 + control * 0.25 + defense * 0.3 + goalkeeping * 0.06 + tactical.totalEdge + chain.totalEdge;
  return { team, opponent, tactics: normalizeTactics(team.tactics), chainLabels: chain.labels, chainScore: chain.score, tacticEdge: 0, attack, control, defense, goalkeeping, tempo, risk, total, momentumBias: tactical.momentumBias + chain.momentumBias, ...vars };
}

function buildTacticalModifiers(team) {
  const tactics = normalizeTactics(team.tactics);
  const out = bucket();
  Object.entries(tactics).forEach(([key, value]) => applyProfile(out, TACTIC_PROFILES[key]?.[value] || {}));
  out.totalEdge += out.variables.possessionControl * 0.08 + out.variables.buildupSecurity * 0.06 + out.variables.compactness * 0.05;
  out.momentumBias += out.variables.highRecovery * 0.28 + out.variables.possessionControl * 0.18;
  return out;
}

function buildChainModifiers(team) {
  const out = bucket();
  const chains = safeGetActiveTraitChains(team);
  chains.forEach(chain => {
    const effect = CHAIN_EFFECTS[chain.id];
    if (!effect) return;
    const [variable, label] = effect;
    const bonus = chainLevelBonus(chain.level);
    out.variables[variable] += bonus;
    out.score += bonus;
    out.labels.push(`${chain.name}: ${label} +${bonus.toFixed(1)}`);
  });
  out.attack += out.variables.boxEntry * 0.18 + out.variables.throughBall * 0.14 + out.variables.magicChance * 0.2 + out.variables.setPieceThreat * 0.08;
  out.control += out.variables.possessionControl * 0.22 + out.variables.linkPlay * 0.2 + out.variables.buildupSecurity * 0.16 + out.variables.fluidity * 0.18;
  out.defense += out.variables.boxDefense * 0.22 + out.variables.compactness * 0.18 + out.variables.aerialControl * 0.16 + out.variables.counterCover * 0.14;
  out.goalkeeping += out.variables.aerialControl * 0.1 + out.variables.boxDefense * 0.05;
  out.tempo += out.variables.transitionSpeed * 0.14 + out.variables.staminaPressure * 0.1;
  out.risk -= out.variables.buildupSecurity * 0.08 + out.variables.counterCover * 0.06;
  out.totalEdge += out.score * 0.1;
  out.momentumBias += out.variables.highRecovery * 0.26 + out.variables.staminaPressure * 0.18 + out.variables.secondBalls * 0.16;
  return out;
}

function bucket() {
  return { attack: 0, control: 0, defense: 0, goalkeeping: 0, tempo: 0, risk: 0, totalEdge: 0, momentumBias: 0, score: 0, labels: [], variables: baseVariables() };
}

function baseVariables() {
  return { aerialChance: 0, crossVolume: 0, wideOverload: 0, centralControl: 0, boxEntry: 0, halfSpaceShot: 0, fluidity: 0, magicChance: 0, throughBall: 0, transitionSpeed: 0, buildupSecurity: 0, possessionControl: 0, linkPlay: 0, highRecovery: 0, secondBalls: 0, staminaPressure: 0, longShotThreat: 0, boxDefense: 0, compactness: 0, counterCover: 0, aerialControl: 0, setPieceThreat: 0, clutch: 0, fluidityDefense: 0 };
}

function mergeVariables(a, b) {
  const merged = baseVariables();
  Object.keys(merged).forEach(key => merged[key] = (a[key] || 0) + (b[key] || 0));
  return merged;
}

function applyCounters(profile, opponent) {
  const t = profile.tactics;
  const o = opponent.tactics;
  let edge = 0;
  edge += matchup(t.attackingPlan, o.defensiveShape, { "Wing Play|Deep Compact": 1.3, "Wing Play|High Line": 0.7, "Wing Play|Man Oriented": -0.8, "Central Overload|Man Oriented": 1.1, "Central Overload|Deep Compact": -0.9, "Direct Runs|High Line": 1.5, "Direct Runs|Deep Compact": -1.2, "Patient Build Up|High Line": 0.8, "Patient Build Up|Deep Compact": 0.5, "Long Shot Pressure|Deep Compact": 1.2, "Long Shot Pressure|High Line": -0.7 });
  edge += matchup(t.pressingPlan, o.buildUpPlan, { "High Press|Short Build Up": 1.4, "High Press|Direct Build Up": -1.0, "High Press|Fast Transitions": -1.1, "Counter Press|Fast Transitions": 1.2, "Counter Press|Short Build Up": 0.6, "Counter Press|Direct Build Up": -0.7, "Low Block|Direct Build Up": 0.9, "Low Block|Short Build Up": -0.6, "Mid Block|Mixed Build Up": 0.5 });
  edge += matchup(t.chanceFocus, o.defensiveShape, { "Crosses|Deep Compact": 0.6, "Crosses|Man Oriented": 0.7, "Through Balls|High Line": 1.1, "Through Balls|Deep Compact": -1.0, "Cutbacks|Man Oriented": 0.9, "Set Pieces|Deep Compact": 0.8, "Box Crashes|High Line": 0.5, "Box Crashes|Deep Compact": -0.6 });
  edge += matchup(t.riskLevel, o.pressingPlan, { "Safe|High Press": 0.7, "Safe|Low Block": -0.5, "Brave|Low Block": 0.7, "Brave|Counter Press": -0.6, "All In|Low Block": 1.0, "All In|High Press": -0.9, "All In|Counter Press": -1.2 });
  profile.tacticEdge += edge;
  profile.attack += edge * 0.42;
  profile.control += edge * 0.28;
  profile.defense += Math.max(-1.2, edge * 0.12);
  profile.total += edge * 0.55;
  profile.momentumBias += edge * 0.65;
}

function chanceEdge(attacker, defender, rating) {
  return attacker.attack + attacker.control * 0.27 + rating * 0.15 + attacker.highRecovery * 0.36 + attacker.possessionControl * 0.22 + attacker.secondBalls * 0.18 - defender.defense - defender.control * 0.11 - defender.compactness * 0.46 - defender.boxDefense * 0.32;
}

function chancePressure(attacker, defender, type) {
  let pressure = attacker.attack * 0.58 + attacker.control * 0.21 + attacker.risk * 0.14 - defender.defense * 0.5 - defender.goalkeeping * 0.2 + attacker.linkPlay * 0.55 + attacker.fluidity * 0.45 + attacker.magicChance * 0.62 - defender.compactness * 0.45 - defender.boxDefense * 0.52;
  if (type === "cross") pressure += attacker.crossVolume * 0.58 + attacker.aerialChance * 0.52 - defender.aerialControl * 0.64;
  if (type === "through") pressure += attacker.throughBall * 0.72 + attacker.transitionSpeed * 0.33 - defender.counterCover * 0.72;
  if (type === "cutback") pressure += attacker.boxEntry * 0.62 + attacker.halfSpaceShot * 0.44 - defender.compactness * 0.42;
  if (type === "setPiece") pressure += attacker.setPieceThreat * 0.78 + attacker.aerialChance * 0.24 - defender.aerialControl * 0.42;
  if (type === "longShot") pressure += attacker.longShotThreat * 0.84 - defender.boxDefense * 0.14;
  if (type === "transition") pressure += attacker.transitionSpeed * 0.62 + attacker.highRecovery * 0.35 - defender.counterCover * 0.58;
  if (type === "magic") pressure += attacker.magicChance * 0.9 + attacker.fluidity * 0.35;
  return pressure;
}

function chanceQuality(attacker, type, pressure) {
  const base = type === "longShot" ? 0.085 : type === "setPiece" ? 0.13 : 0.145;
  const cap = type === "longShot" ? 0.26 : type === "setPiece" ? 0.36 : type === "magic" ? 0.5 : 0.46;
  return clamp(0.04, cap, base + pressure / 250 + Math.random() * 0.15 + attacker.clutch * 0.006);
}

function chooseChanceType(attacker, defender) {
  const items = [
    ["cross", 1.3 + attacker.crossVolume + Math.max(0, attacker.aerialChance - defender.aerialControl * 0.35)],
    ["through", 1.3 + attacker.throughBall + Math.max(0, attacker.transitionSpeed - defender.counterCover * 0.28)],
    ["cutback", 1.3 + attacker.boxEntry + attacker.halfSpaceShot * 0.6],
    ["setPiece", 1.2 + attacker.setPieceThreat],
    ["longShot", 1.1 + attacker.longShotThreat],
    ["transition", 1.2 + attacker.transitionSpeed + attacker.highRecovery * 0.35],
    ["magic", 0.9 + attacker.magicChance + attacker.fluidity * 0.35],
    ["normal", 5 + attacker.linkPlay * 0.2]
  ].map(([key, weight]) => ({ key, weight: Math.max(0.1, weight) }));
  let roll = Math.random() * items.reduce((sum, item) => sum + item.weight, 0);
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.key;
  }
  return "normal";
}

function createGoalText(minute, team, scorer, type, profile) {
  const suffix = profile.chainLabels.length && Math.random() < 0.5 ? " The active chain makes the difference." : "";
  const texts = {
    cross: `${minute}' GOAL! ${team.name} finish a dangerous cross through ${scorer}.${suffix}`,
    through: `${minute}' GOAL! ${team.name} break the line with a through ball and ${scorer} scores.${suffix}`,
    cutback: `${minute}' GOAL! ${team.name} create a cutback and ${scorer} converts.${suffix}`,
    setPiece: `${minute}' GOAL! ${team.name} punish the set piece. ${scorer} gets the final touch.${suffix}`,
    longShot: `${minute}' GOAL! ${scorer} fires in from distance for ${team.name}.${suffix}`,
    transition: `${minute}' GOAL! ${team.name} explode in transition and ${scorer} finishes.${suffix}`,
    magic: `${minute}' GOAL! A moment of genius from ${team.name}, finished by ${scorer}.${suffix}`,
    normal: `${minute}' GOAL! ${team.name} strike through ${scorer}.${suffix}`
  };
  return texts[type] || texts.normal;
}

function createChanceText(minute, team, opponent, quality, type) {
  const size = quality > 0.32 ? "huge" : quality > 0.2 ? "good" : "half";
  if (type === "cross") return `${minute}' ${team.name} create a ${size} crossing chance, but ${opponent.name} survive.`;
  if (type === "through") return `${minute}' ${team.name} get in behind with a through ball, but the finish is missing.`;
  if (type === "cutback") return `${minute}' ${team.name} work a cutback into the box and force a sharp save.`;
  if (type === "setPiece") return `${minute}' Set-piece danger for ${team.name}, ${opponent.name} clear under pressure.`;
  if (type === "longShot") return `${minute}' ${team.name} test the keeper from distance.`;
  if (type === "transition") return `${minute}' ${team.name} counter quickly and almost punish the space.`;
  if (type === "magic") return `${minute}' ${team.name} open the game with a creative spark, but it stays out.`;
  return `${minute}' ${team.name} build pressure and force a save.`;
}

function pushChainInfo(events, home, away, homeProfile, awayProfile) {
  const first = [...homeProfile.chainLabels.map(label => ({ team: home, label })), ...awayProfile.chainLabels.map(label => ({ team: away, label }))][0];
  if (first) events.push({ minute: 14, type: "INFO", text: `14' Chain boost visible: ${first.team.name} activate ${first.label}.` });
}

function pushHalfTimeEvent(context, goals, minute) {
  if (minute === 45) context.events.push({ minute, type: "INFO", text: `45' Half-time: ${context.home.name} ${goals.home} - ${goals.away} ${context.away.name}` });
}

function simulatePenaltyShootout(home, away, homeProfile, awayProfile) {
  const edge = homeProfile.attack * 0.2 + homeProfile.goalkeeping * 0.16 + homeProfile.clutch * 1.4 - awayProfile.attack * 0.18 - awayProfile.goalkeeping * 0.13 - awayProfile.clutch * 1.1;
  const winner = Math.random() < clamp(0.34, 0.66, 0.5 + edge / 170 + randomBetween(-0.07, 0.07)) ? home : away;
  const loser = winner === home ? away : home;
  const winningPens = 4 + Math.floor(Math.random() * 2);
  const losingPens = Math.max(2, winningPens - 1 - Math.floor(Math.random() * 2));
  return { winner, score: `${winner.name} ${winningPens} - ${losingPens} ${loser.name}` };
}

function createCompassDivisions(teams) {
  const shuffled = shuffle(teams);
  return DIVISION_ORDER.map((division, index) => ({ ...division, teams: shuffled.slice(index * 5, index * 5 + 5) }));
}

function createGroupRounds(divisions) {
  const schedules = divisions.map(division => ({ division, firstHalf: createDivisionRoundRobin(division, false), secondHalf: createDivisionRoundRobin(division, true) }));
  return { FIRST_HALF: createGlobalRounds(schedules, "firstHalf", "FIRST_HALF"), SECOND_HALF: createGlobalRounds(schedules, "secondHalf", "SECOND_HALF") };
}

function createGlobalRounds(schedules, key, phase) {
  const totalRounds = Math.max(...schedules.map(schedule => schedule[key].length));
  return Array.from({ length: totalRounds }, (_, roundIndex) => ({ number: roundIndex + 1, matches: schedules.flatMap(schedule => schedule[key][roundIndex].map((match, matchIndex) => ({ ...match, id: `${phase}-${schedule.division.id}-${roundIndex}-${matchIndex}`, type: "GROUP", division: schedule.division.name }))) }));
}

function createDivisionRoundRobin(division, reverse) {
  const teams = [...division.teams, null];
  const rounds = [];
  for (let roundIndex = 0; roundIndex < teams.length - 1; roundIndex++) {
    const matches = [];
    for (let i = 0; i < teams.length / 2; i++) {
      const left = teams[i];
      const right = teams[teams.length - 1 - i];
      if (!left || !right) continue;
      const shouldSwap = (roundIndex + i) % 2 === 1;
      const home = shouldSwap ? right : left;
      const away = shouldSwap ? left : right;
      matches.push(reverse ? { home: away, away: home } : { home, away });
    }
    rounds.push(matches);
    teams.splice(1, 0, teams.pop());
  }
  return rounds;
}

function extractUserGroupSchedule(groupRounds, userTeam) {
  return ["FIRST_HALF", "SECOND_HALF"].flatMap(phase => groupRounds[phase].flatMap(round => round.matches.filter(match => match.home === userTeam || match.away === userTeam).map(match => ({ ...match, phase, label: `${GROUP_PHASES[phase]} - Matchday ${round.number}`, status: "scheduled", knockout: false }))));
}

function addUserScheduleMatch(season, match) {
  if (!season.userSchedule.some(item => item.id === match.id)) season.userSchedule.push({ ...match, label: match.round, phase: match.roundKey, status: "scheduled", knockout: true });
}

function updateUserSchedule(season, match) {
  const item = season.userSchedule.find(entry => entry.id === match.id);
  if (!item) return;
  item.status = "played";
  item.homeGoals = match.homeGoals;
  item.awayGoals = match.awayGoals;
  item.winner = match.winner;
  item.decidedBy = match.decidedBy;
}

function createSeededFixtures(teams, round) {
  const fixtures = [];
  for (let i = 0; i < teams.length / 2; i++) {
    const highSeed = teams[i];
    const lowSeed = teams[teams.length - 1 - i];
    const home = i % 2 === 0 ? highSeed : lowSeed;
    const away = home === highSeed ? lowSeed : highSeed;
    fixtures.push({ id: `${round.key}-${i}-${highSeed.name}-${lowSeed.name}`, type: "KNOCKOUT", round: round.label, roundKey: round.key, home, away, knockout: true });
  }
  return fixtures;
}

function createInitialStandings(divisions) {
  const standings = {};
  divisions.forEach(division => standings[division.name] = division.teams.map(team => ({ team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 })));
  return standings;
}

function updateStandings(standings, home, away, result) {
  const h = standings.find(row => row.team === home);
  const a = standings.find(row => row.team === away);
  if (!h || !a) return;
  h.played++;
  a.played++;
  h.goalsFor += result.homeGoals;
  h.goalsAgainst += result.awayGoals;
  a.goalsFor += result.awayGoals;
  a.goalsAgainst += result.homeGoals;
  if (result.homeGoals > result.awayGoals) { h.wins++; a.losses++; h.points += 3; return; }
  if (result.awayGoals > result.homeGoals) { a.wins++; h.losses++; a.points += 3; return; }
  h.draws++; a.draws++; h.points++; a.points++;
}

function sortAllStandings(season) {
  Object.keys(season.standings).forEach(group => season.standings[group].sort(sortStandings));
}

function getStarters(team) {
  if (!team.players?.length) return [];
  const lineup = team.players.filter(player => team.lineup?.[player.id] && team.lineup[player.id] !== "BENCH").sort((a, b) => b.overall - a.overall);
  return (lineup.length >= 8 ? lineup : [...team.players].sort((a, b) => b.overall - a.overall)).slice(0, 11);
}

function getBench(team, starters) {
  const starterIds = new Set(starters.map(player => player.id));
  return [...(team.players || [])].filter(player => !starterIds.has(player.id)).sort((a, b) => b.overall - a.overall).slice(0, 5);
}

function getPositionAverages(players) {
  return { ATT: average(players.filter(player => player.position === "ATT").map(player => player.overall)), MID: average(players.filter(player => player.position === "MID").map(player => player.overall)), DEF: average(players.filter(player => player.position === "DEF").map(player => player.overall)), GK: average(players.filter(player => player.position === "GK").map(player => player.overall)) };
}

function getFormationBalance(team, starters) {
  const formation = getFormationById(team.formationId);
  const required = { ATT: 0, MID: 0, DEF: 0, GK: 0 };
  const actual = { ATT: 0, MID: 0, DEF: 0, GK: 0 };
  formation.lines.flat().forEach(position => required[position]++);
  starters.forEach(player => actual[player.position]++);
  const missing = Math.max(0, required.ATT - actual.ATT) + Math.max(0, required.MID - actual.MID) + Math.max(0, required.DEF - actual.DEF) + Math.max(0, required.GK - actual.GK);
  const chemistry = Math.max(-5, 3 - missing * 1.8);
  return { attack: chemistry + Math.max(0, actual.ATT - required.ATT) * 0.5, control: chemistry + Math.max(0, actual.MID - required.MID) * 0.4, defense: chemistry + Math.max(0, actual.DEF - required.DEF) * 0.5, goalkeeping: actual.GK >= 1 ? 1.5 : -8, tempo: chemistry * 0.35, risk: missing * 0.6 };
}

function pickScorer(team, type = "normal") {
  const candidates = getStarters(team).filter(player => player.position !== "GK");
  const pool = candidates.length ? candidates : team.players || [];
  const weighted = pool.flatMap(player => {
    const traits = getTraitList(player).map(item => String(item).toLowerCase());
    let weight = player.position === "ATT" ? 5 : player.position === "MID" ? 3 : player.position === "DEF" ? 1.2 : 0.2;
    if ((type === "cross" || type === "setPiece") && (traits.includes("target man") || traits.includes("aerial monster"))) weight += 2.8;
    if ((type === "through" || type === "transition") && (traits.includes("speedster") || traits.includes("poacher"))) weight += 2.5;
    if ((type === "cutback" || type === "magic") && (traits.includes("clinical finisher") || traits.includes("inside forward"))) weight += 2.2;
    if (type === "longShot" && traits.includes("long shot specialist")) weight += 3;
    return Array.from({ length: Math.max(1, Math.round(weight + (player.overall - 70) / 8)) }, () => player);
  });
  const player = weighted[Math.floor(Math.random() * weighted.length)] || pool[0];
  return player ? player.name : "a late runner";
}

function createTacticsMoment(phase, match = null) {
  const labels = { FIRST_HALF: "First Half", SECOND_HALF: "Second Half", ROUND_OF_16: "Round of 16", QUARTERFINALS: "Quarterfinal", SEMIFINALS: "Semifinal", FINAL: "Final" };
  if (!match) return { phase, title: `${labels[phase]} Tactics`, message: "Lock in your tactical counters, chance focus and chain-friendly plan before this stretch begins.", button: phase === "FIRST_HALF" ? "Start Season" : "Lock Tactics" };
  return { phase, title: `${labels[phase]} Tactics`, message: `Next up: ${match.home.name} vs ${match.away.name}. Choose the setup that counters the opponent.`, button: "Lock Tactics" };
}

function normalizeTactics(raw) {
  const source = typeof raw === "string" ? { playStyle: raw } : { ...(raw || {}) };
  const out = { ...DEFAULT_TACTICS };
  Object.entries(LEGACY_MAP).forEach(([key, map]) => { if (source[key] && map[source[key]]) Object.assign(out, map[source[key]]); });
  Object.keys(DEFAULT_TACTICS).forEach(key => { if (source[key]) out[key] = source[key]; });
  if (source.playStyle) out.playStyle = source.playStyle;
  return out;
}

function ensureTacticalSetup(team) {
  if (!team) return;
  team.tactics = normalizeTactics(team.tactics || team.playStyle);
  if (!team.playStyle) team.playStyle = team.tactics.playStyle || "Balanced";
}

function applyProfile(out, profile) {
  Object.entries(profile).forEach(([key, value]) => {
    if (key in out) out[key] += value;
    else out.variables[key] += value;
  });
}

function chainLevelBonus(level) {
  return level <= 2 ? 1.15 : level === 3 ? 2.15 : 3.25;
}

function safeGetActiveTraitChains(team) {
  try { return getActiveTraitChains(team) || []; } catch (error) { console.warn("Trait chain calculation failed", error); return []; }
}

function matchup(a, b, table) { return table[`${a}|${b}`] || 0; }
function describePlan(profile) { const t = profile.tactics; return `${t.attackingPlan}, ${t.pressingPlan}, ${t.chanceFocus}`; }
function involvesUser(season, match) { return match.home === season.userTeam || match.away === season.userTeam; }
function sortStandings(a, b) { return b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || getTeamStrength(b.team) - getTeamStrength(a.team); }
function average(numbers, fallback = 60) { return numbers.length ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : fallback; }
function randomBetween(min, max) { return min + Math.random() * (max - min); }
function clamp(min, max, value) { return Math.max(min, Math.min(max, value)); }
function roundStat(value) { return Math.round(value * 100) / 100; }
function eventPriority(type) { return type === "GOAL" ? 0 : type === "CHANCE" || type === "SAVE" ? 1 : 2; }
function shuffle(items) { const list = [...items]; for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; }
