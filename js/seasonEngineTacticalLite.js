import { getFormationById } from "./formations.js";
import { getActiveTraitChains } from "./traitChainEngine.js?v=chain-segments-1";
import { getTraitList } from "./playerUtils.js?v=strict-cdm-1";

export const DIVISION_ORDER = [{ id: "NORTH", name: "North", compass: "north" }, { id: "WEST", name: "West", compass: "west" }, { id: "EAST", name: "East", compass: "east" }, { id: "SOUTH", name: "South", compass: "south" }];
export const KNOCKOUT_ROUNDS = [{ key: "ROUND_OF_16", label: "Round of 16" }, { key: "QUARTERFINALS", label: "Quarterfinals" }, { key: "SEMIFINALS", label: "Semifinals" }, { key: "FINAL", label: "Final" }];

const DEFAULT_TACTICS = { attackingPlan: "Balanced Attack", pressingPlan: "Mid Block", defensiveShape: "Balanced Line", buildUpPlan: "Mixed Build Up", chanceFocus: "Best Chance", riskLevel: "Balanced" };
const GROUP_PHASES = { FIRST_HALF: "First Half", SECOND_HALF: "Second Half" };
const CHAIN_VAR = {
  "crossing-chain": "aerialChance", "overlap-crossing-chain": "crossVolume", "low-cross-chain": "boxEntry", "cut-inside-chain": "halfSpaceShot", "false-9-chain": "fluidity", "genius-attack-chain": "magicChance", "through-ball-chain": "throughBall", "direct-play-chain": "transitionSpeed", "build-up-chain": "buildupSecurity", "possession-chain": "possessionControl", "connector-chain": "linkPlay", "pressing-attack-chain": "highRecovery", "destroyer-chain": "secondBalls", "engine-chain": "staminaPressure", "long-shot-chain": "longShotThreat", "defensive-wall": "boxDefense", "low-block-chain": "compactness", "high-line-chain": "counterCover", "aerial-control-chain": "aerialControl", "set-piece-chain": "setPieceThreat", "penalty-knockout-chain": "clutch"
};
const VAR_LABEL = { aerialChance: "Aerial chance quality", crossVolume: "Cross volume", boxEntry: "Low box entries", halfSpaceShot: "Half-space shooting", fluidity: "False-nine fluidity", magicChance: "Creative special actions", throughBall: "Runs behind", transitionSpeed: "Direct transition speed", buildupSecurity: "Build-up security", possessionControl: "Possession control", linkPlay: "Line connection", highRecovery: "High recoveries", secondBalls: "Second-ball control", staminaPressure: "Sustained intensity", longShotThreat: "Long-shot threat", boxDefense: "Box defense", compactness: "Deep compactness", counterCover: "High-line cover", aerialControl: "Aerial control", setPieceThreat: "Set-piece threat", clutch: "Knockout clutch" };
const VARS = Object.keys(VAR_LABEL).concat(["centralControl", "wideOverload"]);

const BASE_STYLE_PROFILES = {
  Balanced: { attack: 0, control: 0, defense: 0, tempo: 0, risk: 0 },
  Possession: { attack: -0.4, control: 2.2, defense: 0.5, tempo: -0.8, risk: -1.2 },
  "Counter Attack": { attack: 0.8, control: -0.8, defense: 0.7, tempo: 1.4, risk: 0.7 },
  "High Press": { attack: 0.7, control: 0.9, defense: -0.4, tempo: 1.7, risk: 1.3 },
  "Defensive Block": { attack: -1.1, control: -0.5, defense: 2.2, tempo: -1, risk: -1.4 }
};

const TACTIC_PROFILES = {
  attackingPlan: {
    "Balanced Attack": {},
    "Wing Play": { crossVolume: 1.2, aerialChance: 0.45, wideOverload: 0.9, centralControl: -0.25, attack: 0.3 },
    "Central Overload": { centralControl: 1.2, linkPlay: 0.55, fluidity: 0.35, wideOverload: -0.35, control: 0.5 },
    "Direct Runs": { transitionSpeed: 1.15, throughBall: 0.8, buildupSecurity: -0.45, tempo: 0.8, risk: 0.35 },
    "Patient Build Up": { possessionControl: 1.15, buildupSecurity: 0.75, tempo: -0.75, control: 0.5 },
    "Long Shot Pressure": { longShotThreat: 1.35, boxEntry: -0.25, attack: 0.25 }
  },
  pressingPlan: {
    "Low Block": { compactness: 1.1, boxDefense: 0.8, highRecovery: -0.65, tempo: -0.35, defense: 0.4, risk: -0.5 },
    "Mid Block": { secondBalls: 0.7, compactness: 0.45, defense: 0.15 },
    "High Press": { highRecovery: 1.2, staminaPressure: 0.65, counterCover: -0.35, tempo: 0.7, risk: 0.8 },
    "Counter Press": { highRecovery: 0.85, secondBalls: 0.9, staminaPressure: 0.55, risk: 0.7 }
  },
  defensiveShape: {
    "Deep Compact": { compactness: 1.1, boxDefense: 0.9, counterCover: -0.5, possessionControl: -0.35, defense: 0.4, risk: -0.35 },
    "Balanced Line": { compactness: 0.25, counterCover: 0.25 },
    "High Line": { counterCover: 0.95, highRecovery: 0.45, compactness: -0.45, tempo: 0.35, risk: 0.65 },
    "Man Oriented": { secondBalls: 0.75, boxDefense: 0.35, fluidity: -0.2, risk: 0.25 }
  },
  buildUpPlan: {
    "Short Build Up": { buildupSecurity: 1.15, possessionControl: 0.75, transitionSpeed: -0.45, control: 0.35 },
    "Mixed Build Up": { linkPlay: 0.45, buildupSecurity: 0.25 },
    "Direct Build Up": { transitionSpeed: 1.05, throughBall: 0.65, possessionControl: -0.5, tempo: 0.5, risk: 0.25 },
    "Fast Transitions": { transitionSpeed: 1.2, boxEntry: 0.55, buildupSecurity: -0.45, tempo: 0.8, risk: 0.5 }
  },
  chanceFocus: {
    "Best Chance": {},
    Crosses: { crossVolume: 1.15, aerialChance: 0.85, longShotThreat: -0.25 },
    "Through Balls": { throughBall: 1.2, transitionSpeed: 0.35, crossVolume: -0.25 },
    Cutbacks: { boxEntry: 1.1, halfSpaceShot: 0.75, aerialChance: -0.3 },
    "Set Pieces": { setPieceThreat: 1.25, tempo: -0.15 },
    "Box Crashes": { boxEntry: 0.85, aerialChance: 0.55, risk: 0.35 }
  },
  riskLevel: {
    Safe: { risk: -1.4, defense: 0.5, attack: -0.5, tempo: -0.4 },
    Balanced: {},
    Brave: { risk: 1.1, attack: 0.65, tempo: 0.35, defense: -0.35 },
    "All In": { risk: 2.1, attack: 1.2, tempo: 0.7, defense: -1.1, counterCover: -0.6 }
  }
};

export function createSeason(teams, userTeamIndex) {
  teams.forEach(ensureTactics);
  const divisions = createCompassDivisions(teams);
  const groupRounds = createGroupRounds(divisions);
  const season = { userTeamIndex, userTeam: teams[userTeamIndex], divisions, standings: createInitialStandings(divisions), groupRounds, groupRoundIndex: { FIRST_HALF: 0, SECOND_HALF: 0 }, phase: "FIRST_HALF", waitingForTactics: true, tacticsMoment: createTacticsMoment("FIRST_HALF"), pendingBackgroundMatches: [], nextMatch: null, currentMatch: null, userSchedule: [], userMatchHistory: [], opponentResults: [], allResults: [], playoffSeeds: [], knockoutRounds: [], knockoutRoundIndex: -1, champion: null, userEliminated: false, eliminationReason: "" };
  season.userSchedule = extractUserGroupSchedule(groupRounds, season.userTeam);
  sortAllStandings(season);
  return season;
}

export function continueAfterTactics(season) {
  if (!season || season.phase === "COMPLETE") return season;
  ensureTactics(season.userTeam);
  season.waitingForTactics = false;
  season.tacticsMoment = null;
  prepareNextUserMatch(season);
  return season;
}

export function simulateNextMatch(season) {
  if (!season || season.waitingForTactics || season.phase === "COMPLETE") return season;
  if (!season.nextMatch) prepareNextUserMatch(season);
  if (!season.nextMatch) return season;
  simulateBackgroundMatches(season, season.pendingBackgroundMatches);
  season.pendingBackgroundMatches = [];
  const m = season.nextMatch;
  const full = { ...m, ...simulateMatchWithEvents(m.home, m.away, { knockout: m.type === "KNOCKOUT" }), userMatch: true };
  registerMatchResult(season, full, true);
  season.currentMatch = full;
  season.userMatchHistory.push(full);
  season.nextMatch = null;
  if (m.type === "GROUP") { season.groupRoundIndex[season.phase] = m.roundIndex + 1; prepareNextUserMatch(season); return season; }
  resolveUserKnockoutMatch(season, full);
  return season;
}

export function getTeamStrength(team) {
  const p = teamProfile(team, null);
  return Math.round((p.attack + p.control + p.defense + p.goalkeeping * 0.25) / 3.25);
}

function prepareNextUserMatch(season) {
  if (season.waitingForTactics || season.phase === "COMPLETE") return;
  if (season.phase !== "FIRST_HALF" && season.phase !== "SECOND_HALF") return;
  const rounds = season.groupRounds[season.phase];
  let index = season.groupRoundIndex[season.phase];
  while (index < rounds.length) {
    const r = rounds[index];
    const userMatch = r.matches.find(m => involvesUser(season, m));
    const bg = r.matches.filter(m => !involvesUser(season, m));
    if (userMatch) {
      season.nextMatch = { ...userMatch, round: `${GROUP_PHASES[season.phase]} - Matchday ${r.number}`, roundIndex: index, phase: season.phase };
      season.pendingBackgroundMatches = bg.map(m => ({ ...m, round: `${GROUP_PHASES[season.phase]} - Matchday ${r.number}`, roundIndex: index, phase: season.phase }));
      return;
    }
    simulateBackgroundMatches(season, bg);
    index += 1;
    season.groupRoundIndex[season.phase] = index;
  }
  if (season.phase === "FIRST_HALF") { season.phase = "SECOND_HALF"; season.waitingForTactics = true; season.tacticsMoment = createTacticsMoment("SECOND_HALF"); return; }
  enterKnockouts(season);
}

function enterKnockouts(season) {
  sortAllStandings(season);
  const seeds = Object.values(season.standings).flatMap(rows => rows.slice(0, 4)).sort(sortStandings).map(r => r.team);
  season.playoffSeeds = seeds;
  if (!seeds.includes(season.userTeam)) { season.userEliminated = true; season.eliminationReason = "You missed the knockout places."; finishRemainingKnockouts(season, seeds, 0); return; }
  startKnockoutRound(season, 0, seeds);
}

function startKnockoutRound(season, roundIndex, entrants) {
  const round = KNOCKOUT_ROUNDS[roundIndex];
  const fixtures = createSeededFixtures(entrants, round);
  const userIndex = fixtures.findIndex(m => involvesUser(season, m));
  const rec = { key: round.key, label: round.label, fixtures, results: Array(fixtures.length).fill(null), winners: Array(fixtures.length).fill(null) };
  season.phase = round.key; season.knockoutRoundIndex = roundIndex; season.knockoutRounds.push(rec);
  fixtures.forEach((m, i) => { if (i === userIndex) return; const full = { ...m, ...simulateMatchWithEvents(m.home, m.away, { knockout: true }), fixtureIndex: i, userMatch: false }; rec.results[i] = full; rec.winners[i] = full.winner; registerMatchResult(season, full, false); });
  if (userIndex < 0) { finishRemainingKnockouts(season, rec.winners.filter(Boolean), roundIndex + 1); return; }
  season.nextMatch = { ...fixtures[userIndex], fixtureIndex: userIndex };
  season.waitingForTactics = true;
  season.tacticsMoment = createTacticsMoment(round.key, season.nextMatch);
  addUserScheduleMatch(season, season.nextMatch);
}

function resolveUserKnockoutMatch(season, match) {
  const rec = season.knockoutRounds[season.knockoutRounds.length - 1];
  rec.results[match.fixtureIndex] = match; rec.winners[match.fixtureIndex] = match.winner;
  if (match.winner !== season.userTeam) { season.userEliminated = true; season.eliminationReason = `Eliminated in the ${rec.label}.`; finishRemainingKnockouts(season, rec.winners.filter(Boolean), season.knockoutRoundIndex + 1); return; }
  if (season.phase === "FINAL") { season.champion = season.userTeam; season.phase = "COMPLETE"; season.waitingForTactics = false; season.nextMatch = null; return; }
  startKnockoutRound(season, season.knockoutRoundIndex + 1, rec.winners.filter(Boolean));
}

function finishRemainingKnockouts(season, entrants, startRoundIndex) {
  let teams = entrants;
  for (let i = startRoundIndex; i < KNOCKOUT_ROUNDS.length && teams.length > 1; i++) {
    const round = KNOCKOUT_ROUNDS[i], fixtures = createSeededFixtures(teams, round), winners = [], results = [];
    fixtures.forEach((m, idx) => { const full = { ...m, ...simulateMatchWithEvents(m.home, m.away, { knockout: true }), fixtureIndex: idx, userMatch: false }; winners.push(full.winner); results.push(full); registerMatchResult(season, full, false); });
    season.knockoutRounds.push({ key: round.key, label: round.label, fixtures, results, winners });
    teams = winners;
  }
  season.champion = teams[0] || season.champion; season.phase = "COMPLETE"; season.waitingForTactics = false; season.nextMatch = null; season.pendingBackgroundMatches = [];
}

function simulateBackgroundMatches(season, matches) {
  matches.forEach(m => registerMatchResult(season, { ...m, ...simulateMatchWithEvents(m.home, m.away, { knockout: m.type === "KNOCKOUT" }), events: [], userMatch: false }, false));
}

function registerMatchResult(season, match, isUserMatch) {
  season.allResults.push(match);
  if (!isUserMatch) { season.opponentResults.unshift(match); season.opponentResults = season.opponentResults.slice(0, 16); }
  if (match.type === "GROUP") { updateStandings(season.standings[match.division], match.home, match.away, match); sortAllStandings(season); }
  if (isUserMatch) updateUserSchedule(season, match);
}

function simulateMatchWithEvents(home, away, options = {}) {
  const hp = teamProfile(home, away), ap = teamProfile(away, home);
  applyCounterEdge(hp, ap); applyCounterEdge(ap, hp);
  const hr = hp.total + 1.4 + randomBetween(-4.6, 5.2), ar = ap.total + randomBetween(-4.6, 5.2);
  const stats = { homeXg: 0, awayXg: 0, homeShots: 0, awayShots: 0, homeMomentum: Math.round(hr + hp.momentumBias), awayMomentum: Math.round(ar + ap.momentumBias) };
  const events = [{ minute: 1, type: "INFO", text: `1' Kickoff. ${home.name} and ${away.name} are underway.` }, { minute: 7, type: "INFO", text: `7' Tactical setup: ${home.name} use ${planText(hp)}; ${away.name} answer with ${planText(ap)}.` }];
  const firstChain = [...hp.chainLabels.map(label => ({ team: home, label })), ...ap.chainLabels.map(label => ({ team: away, label }))][0];
  if (firstChain) events.push({ minute: 14, type: "INFO", text: `14' Chain boost visible: ${firstChain.team.name} activate ${firstChain.label}.` });
  const goals = playMinutes({ from: 2, to: 90, home, away, hp, ap, hr, ar, stats, events, goals: { home: 0, away: 0 } });
  let winner = null, decidedBy = "90", penaltyScore = null;
  if (options.knockout && goals.home === goals.away) {
    events.push({ minute: 91, type: "INFO", text: "91' Extra time begins. Tactical discipline matters now." });
    const extra = playMinutes({ from: 91, to: 120, home, away, hp, ap, hr: hr - 1.1, ar: ar - 1.1, stats, events, goals, chanceScale: 0.72 });
    goals.home = extra.home; goals.away = extra.away; decidedBy = "ET";
    if (goals.home === goals.away) { const p = simulatePenaltyShootout(home, away, hp, ap); winner = p.winner; penaltyScore = p.score; decidedBy = "PEN"; events.push({ minute: 121, type: "GOAL", text: `Penalties: ${p.score}. ${winner.name} survive the shootout.` }); }
  }
  if (!winner) winner = goals.home > goals.away ? home : goals.away > goals.home ? away : null;
  events.push({ minute: options.knockout && decidedBy !== "90" ? 120 : 90, type: "INFO", text: `Full-time: ${home.name} ${goals.home} - ${goals.away} ${away.name}` });
  events.sort((a, b) => a.minute - b.minute || eventPriority(a.type) - eventPriority(b.type));
  stats.homeXg = roundStat(stats.homeXg); stats.awayXg = roundStat(stats.awayXg); stats.homeChainScore = roundStat(hp.chainScore); stats.awayChainScore = roundStat(ap.chainScore); stats.homeTacticEdge = roundStat(hp.tacticEdge); stats.awayTacticEdge = roundStat(ap.tacticEdge);
  return { homeGoals: goals.home, awayGoals: goals.away, winner, decidedBy, penaltyScore, stats, events };
}

function playMinutes(c) {
  const goals = { ...c.goals };
  for (let minute = c.from; minute <= c.to; minute++) {
    const chanceRate = clamp(0.034, 0.135, (0.055 + ((c.hp.tempo + c.ap.tempo) / 200) * 0.028 + ((c.hp.risk + c.ap.risk) / 240) * 0.022) * (c.chanceScale ?? 1));
    if (Math.random() > chanceRate) { if (minute === 45) half(c, goals); continue; }
    const homeEdge = chanceEdge(c.hp, c.ap, c.hr), awayEdge = chanceEdge(c.ap, c.hp, c.ar), isHome = Math.random() < clamp(0.22, 0.78, 0.5 + (homeEdge - awayEdge) / 94);
    const team = isHome ? c.home : c.away, opponent = isHome ? c.away : c.home, attacker = isHome ? c.hp : c.ap, defender = isHome ? c.ap : c.hp;
    const type = chooseType(attacker, defender), pressure = pressureFor(attacker, defender, type), quality = qualityFor(attacker, type, pressure), goalChance = clamp(0.045, 0.49, quality * 0.84 + pressure / 360 + attacker.clutch * 0.005);
    if (isHome) { c.stats.homeShots++; c.stats.homeXg += quality; } else { c.stats.awayShots++; c.stats.awayXg += quality; }
    if (Math.random() < goalChance) { if (isHome) goals.home++; else goals.away++; c.events.push({ minute, type: "GOAL", text: goalText(minute, team, pickScorer(team, type), type, attacker) }); }
    else c.events.push({ minute, type: Math.random() < 0.4 ? "SAVE" : "CHANCE", text: chanceText(minute, team, opponent, quality, type) });
    if (minute === 45) half(c, goals);
  }
  return goals;
}

function teamProfile(team, opponent) {
  ensureTactics(team);
  const starters = getStarters(team), bench = getBench(team, starters), pos = getPositionAverages(starters), avg = average(starters.map(p => p.overall)), benchAvg = average(bench.map(p => p.overall), avg - 4), star = average(starters.slice(0, 3).map(p => p.overall), avg), style = BASE_STYLE_PROFILES[team.playStyle] || BASE_STYLE_PROFILES.Balanced, balance = formationBalance(team, starters), tactical = tacticMods(team), chain = chainMods(team), v = addVars(tactical.v, chain.v);
  const attack = pos.ATT * 0.52 + pos.MID * 0.23 + star * 0.13 + benchAvg * 0.04 + style.attack + balance.attack + tactical.attack + chain.attack;
  const control = pos.MID * 0.49 + avg * 0.2 + pos.DEF * 0.12 + benchAvg * 0.06 + style.control + balance.control + tactical.control + chain.control;
  const defense = pos.DEF * 0.49 + pos.GK * 0.22 + pos.MID * 0.12 + benchAvg * 0.04 + style.defense + balance.defense + tactical.defense + chain.defense;
  const goalkeeping = pos.GK + balance.goalkeeping + chain.goalkeeping;
  const tempo = avg + style.tempo + balance.tempo + tactical.tempo + chain.tempo;
  const risk = 50 + style.risk + balance.risk + tactical.risk + chain.risk;
  return { team, opponent, tactics: normalizeTactics(team.tactics), attack, control, defense, goalkeeping, tempo, risk, total: attack * 0.35 + control * 0.25 + defense * 0.3 + goalkeeping * 0.06 + tactical.total + chain.total, momentumBias: tactical.momentum + chain.momentum, chainLabels: chain.labels, chainScore: chain.score, tacticEdge: 0, ...v };
}

function tacticMods(team) {
  const out = mod(), t = normalizeTactics(team.tactics);
  addTactic(out, t);
  out.total += out.v.possessionControl * 0.08 + out.v.buildupSecurity * 0.06 + out.v.compactness * 0.05;
  out.momentum += out.v.highRecovery * 0.28 + out.v.possessionControl * 0.18;
  return out;
}
function addTactic(out, t) {
  addProfile(out, TACTIC_PROFILES.attackingPlan[t.attackingPlan]); addProfile(out, TACTIC_PROFILES.pressingPlan[t.pressingPlan]); addProfile(out, TACTIC_PROFILES.defensiveShape[t.defensiveShape]); addProfile(out, TACTIC_PROFILES.buildUpPlan[t.buildUpPlan]); addProfile(out, TACTIC_PROFILES.chanceFocus[t.chanceFocus]); addProfile(out, TACTIC_PROFILES.riskLevel[t.riskLevel]);
}
function chainMods(team) {
  const out = mod();
  try { getActiveTraitChains(team).forEach(chain => { const key = CHAIN_VAR[chain.id]; if (!key) return; const b = chain.level <= 2 ? 1.15 : chain.level === 3 ? 2.15 : 3.25; out.v[key] += b; out.score += b; out.labels.push(`${chain.name}: ${VAR_LABEL[key]} +${b.toFixed(1)}`); }); } catch (e) { console.warn("Trait chain calculation failed", e); }
  out.attack += out.v.boxEntry * 0.18 + out.v.throughBall * 0.14 + out.v.magicChance * 0.2 + out.v.setPieceThreat * 0.08;
  out.control += out.v.possessionControl * 0.22 + out.v.linkPlay * 0.2 + out.v.buildupSecurity * 0.16 + out.v.fluidity * 0.18;
  out.defense += out.v.boxDefense * 0.22 + out.v.compactness * 0.18 + out.v.aerialControl * 0.16 + out.v.counterCover * 0.14;
  out.goalkeeping += out.v.aerialControl * 0.1 + out.v.boxDefense * 0.05; out.tempo += out.v.transitionSpeed * 0.14 + out.v.staminaPressure * 0.1; out.risk -= out.v.buildupSecurity * 0.08 + out.v.counterCover * 0.06; out.total += out.score * 0.1; out.momentum += out.v.highRecovery * 0.26 + out.v.staminaPressure * 0.18 + out.v.secondBalls * 0.16;
  return out;
}
function mod() { return { attack: 0, control: 0, defense: 0, goalkeeping: 0, tempo: 0, risk: 0, total: 0, momentum: 0, score: 0, labels: [], v: emptyVars() }; }
function emptyVars() { return Object.fromEntries(VARS.map(k => [k, 0])); }
function addVars(a, b) { const out = emptyVars(); VARS.forEach(k => out[k] = (a[k] || 0) + (b[k] || 0)); return out; }
function addProfile(out, profile = {}) { Object.entries(profile).forEach(([k, v]) => { if (k in out) out[k] += v; else out.v[k] += v; }); }

function applyCounterEdge(p, o) {
  const t = p.tactics, x = o.tactics; let e = 0;
  e += table(`${t.attackingPlan}|${x.defensiveShape}`, { "Wing Play|Deep Compact": 1.3, "Wing Play|Man Oriented": -0.8, "Central Overload|Man Oriented": 1.1, "Central Overload|Deep Compact": -0.9, "Direct Runs|High Line": 1.5, "Direct Runs|Deep Compact": -1.2, "Patient Build Up|High Line": 0.8, "Long Shot Pressure|Deep Compact": 1.2 });
  e += table(`${t.pressingPlan}|${x.buildUpPlan}`, { "High Press|Short Build Up": 1.4, "High Press|Direct Build Up": -1, "High Press|Fast Transitions": -1.1, "Counter Press|Fast Transitions": 1.2, "Low Block|Direct Build Up": 0.9, "Low Block|Short Build Up": -0.6 });
  e += table(`${t.chanceFocus}|${x.defensiveShape}`, { "Crosses|Deep Compact": 0.6, "Crosses|Man Oriented": 0.7, "Through Balls|High Line": 1.1, "Through Balls|Deep Compact": -1, "Cutbacks|Man Oriented": 0.9, "Set Pieces|Deep Compact": 0.8, "Box Crashes|Deep Compact": -0.6 });
  e += table(`${t.riskLevel}|${x.pressingPlan}`, { "Safe|High Press": 0.7, "Brave|Low Block": 0.7, "All In|Low Block": 1, "All In|High Press": -0.9, "All In|Counter Press": -1.2 });
  p.tacticEdge += e; p.attack += e * 0.42; p.control += e * 0.28; p.defense += Math.max(-1.2, e * 0.12); p.total += e * 0.55; p.momentumBias += e * 0.65;
}
function table(key, obj) { return obj[key] || 0; }
function chanceEdge(a, d, r) { return a.attack + a.control * 0.27 + r * 0.15 + a.highRecovery * 0.36 + a.possessionControl * 0.22 + a.secondBalls * 0.18 - d.defense - d.control * 0.11 - d.compactness * 0.46 - d.boxDefense * 0.32; }
function pressureFor(a, d, type) { let p = a.attack * 0.58 + a.control * 0.21 + a.risk * 0.14 - d.defense * 0.5 - d.goalkeeping * 0.2 + a.linkPlay * 0.55 + a.fluidity * 0.45 + a.magicChance * 0.62 - d.compactness * 0.45 - d.boxDefense * 0.52; if (type === "cross") p += a.crossVolume * 0.58 + a.aerialChance * 0.52 - d.aerialControl * 0.64; if (type === "through") p += a.throughBall * 0.72 + a.transitionSpeed * 0.33 - d.counterCover * 0.72; if (type === "cutback") p += a.boxEntry * 0.62 + a.halfSpaceShot * 0.44 - d.compactness * 0.42; if (type === "setPiece") p += a.setPieceThreat * 0.78 + a.aerialChance * 0.24 - d.aerialControl * 0.42; if (type === "longShot") p += a.longShotThreat * 0.84 - d.boxDefense * 0.14; if (type === "transition") p += a.transitionSpeed * 0.62 + a.highRecovery * 0.35 - d.counterCover * 0.58; if (type === "magic") p += a.magicChance * 0.9 + a.fluidity * 0.35; return p; }
function qualityFor(a, type, p) { const base = type === "longShot" ? 0.085 : type === "setPiece" ? 0.13 : 0.145, cap = type === "longShot" ? 0.26 : type === "setPiece" ? 0.36 : type === "magic" ? 0.5 : 0.46; return clamp(0.04, cap, base + p / 250 + Math.random() * 0.15 + a.clutch * 0.006); }
function chooseType(a, d) { const items = [["cross", 1.3 + a.crossVolume + Math.max(0, a.aerialChance - d.aerialControl * 0.35)], ["through", 1.3 + a.throughBall + Math.max(0, a.transitionSpeed - d.counterCover * 0.28)], ["cutback", 1.3 + a.boxEntry + a.halfSpaceShot * 0.6], ["setPiece", 1.2 + a.setPieceThreat], ["longShot", 1.1 + a.longShotThreat], ["transition", 1.2 + a.transitionSpeed + a.highRecovery * 0.35], ["magic", 0.9 + a.magicChance + a.fluidity * 0.35], ["normal", 5 + a.linkPlay * 0.2]].map(([key, w]) => ({ key, w: Math.max(0.1, w) })); let roll = Math.random() * items.reduce((s, i) => s + i.w, 0); for (const i of items) { roll -= i.w; if (roll <= 0) return i.key; } return "normal"; }

function goalText(minute, team, scorer, type, profile) { const s = profile.chainLabels.length && Math.random() < 0.5 ? " The active chain makes the difference." : ""; if (type === "cross") return `${minute}' GOAL! ${team.name} finish a dangerous cross through ${scorer}.${s}`; if (type === "through") return `${minute}' GOAL! ${team.name} break the line with a through ball and ${scorer} scores.${s}`; if (type === "cutback") return `${minute}' GOAL! ${team.name} create a cutback and ${scorer} converts.${s}`; if (type === "setPiece") return `${minute}' GOAL! ${team.name} punish the set piece. ${scorer} gets the final touch.${s}`; if (type === "longShot") return `${minute}' GOAL! ${scorer} fires in from distance for ${team.name}.${s}`; if (type === "transition") return `${minute}' GOAL! ${team.name} explode in transition and ${scorer} finishes.${s}`; if (type === "magic") return `${minute}' GOAL! A moment of genius from ${team.name}, finished by ${scorer}.${s}`; return `${minute}' GOAL! ${team.name} strike through ${scorer}.${s}`; }
function chanceText(minute, team, opp, q, type) { const size = q > 0.32 ? "huge" : q > 0.2 ? "good" : "half"; if (type === "cross") return `${minute}' ${team.name} create a ${size} crossing chance, but ${opp.name} survive.`; if (type === "through") return `${minute}' ${team.name} get in behind with a through ball, but the finish is missing.`; if (type === "cutback") return `${minute}' ${team.name} work a cutback into the box and force a sharp save.`; if (type === "setPiece") return `${minute}' Set-piece danger for ${team.name}, ${opp.name} clear under pressure.`; if (type === "longShot") return `${minute}' ${team.name} test the keeper from distance.`; if (type === "transition") return `${minute}' ${team.name} counter quickly and almost punish the space.`; if (type === "magic") return `${minute}' ${team.name} open the game with a creative spark, but it stays out.`; return `${minute}' ${team.name} build pressure and force a save.`; }
function half(c, goals) { c.events.push({ minute: 45, type: "INFO", text: `45' Half-time: ${c.home.name} ${goals.home} - ${goals.away} ${c.away.name}` }); }
function simulatePenaltyShootout(home, away, hp, ap) { const edge = hp.attack * 0.2 + hp.goalkeeping * 0.16 + hp.clutch * 1.4 - ap.attack * 0.18 - ap.goalkeeping * 0.13 - ap.clutch * 1.1; const winner = Math.random() < clamp(0.34, 0.66, 0.5 + edge / 170 + randomBetween(-0.07, 0.07)) ? home : away; const loser = winner === home ? away : home; const wp = 4 + Math.floor(Math.random() * 2), lp = Math.max(2, wp - 1 - Math.floor(Math.random() * 2)); return { winner, score: `${winner.name} ${wp} - ${lp} ${loser.name}` }; }

function createCompassDivisions(teams) { const s = shuffle(teams); return DIVISION_ORDER.map((d, i) => ({ ...d, teams: s.slice(i * 5, i * 5 + 5) })); }
function createGroupRounds(divisions) { const schedules = divisions.map(d => ({ division: d, firstHalf: roundRobin(d, false), secondHalf: roundRobin(d, true) })); return { FIRST_HALF: globalRounds(schedules, "firstHalf", "FIRST_HALF"), SECOND_HALF: globalRounds(schedules, "secondHalf", "SECOND_HALF") }; }
function globalRounds(schedules, key, phase) { const n = Math.max(...schedules.map(s => s[key].length)); return Array.from({ length: n }, (_, ri) => ({ number: ri + 1, matches: schedules.flatMap(s => s[key][ri].map((m, mi) => ({ ...m, id: `${phase}-${s.division.id}-${ri}-${mi}`, type: "GROUP", division: s.division.name }))) })); }
function roundRobin(division, reverse) { const teams = [...division.teams, null], rounds = []; for (let r = 0; r < teams.length - 1; r++) { const matches = []; for (let i = 0; i < teams.length / 2; i++) { const l = teams[i], rr = teams[teams.length - 1 - i]; if (!l || !rr) continue; const swap = (r + i) % 2 === 1, h = swap ? rr : l, a = swap ? l : rr; matches.push(reverse ? { home: a, away: h } : { home: h, away: a }); } rounds.push(matches); teams.splice(1, 0, teams.pop()); } return rounds; }
function extractUserGroupSchedule(groupRounds, userTeam) { return ["FIRST_HALF", "SECOND_HALF"].flatMap(phase => groupRounds[phase].flatMap(r => r.matches.filter(m => m.home === userTeam || m.away === userTeam).map(m => ({ ...m, phase, label: `${GROUP_PHASES[phase]} - Matchday ${r.number}`, status: "scheduled", knockout: false })))); }
function createSeededFixtures(teams, round) { return Array.from({ length: teams.length / 2 }, (_, i) => { const hi = teams[i], lo = teams[teams.length - 1 - i], home = i % 2 === 0 ? hi : lo, away = home === hi ? lo : hi; return { id: `${round.key}-${i}-${hi.name}-${lo.name}`, type: "KNOCKOUT", round: round.label, roundKey: round.key, home, away, knockout: true }; }); }
function createInitialStandings(divisions) { const s = {}; divisions.forEach(d => s[d.name] = d.teams.map(team => ({ team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }))); return s; }
function updateStandings(rows, h, a, r) { const hr = rows.find(x => x.team === h), ar = rows.find(x => x.team === a); if (!hr || !ar) return; hr.played++; ar.played++; hr.goalsFor += r.homeGoals; hr.goalsAgainst += r.awayGoals; ar.goalsFor += r.awayGoals; ar.goalsAgainst += r.homeGoals; if (r.homeGoals > r.awayGoals) { hr.wins++; ar.losses++; hr.points += 3; } else if (r.awayGoals > r.homeGoals) { ar.wins++; hr.losses++; ar.points += 3; } else { hr.draws++; ar.draws++; hr.points++; ar.points++; } }
function addUserScheduleMatch(season, match) { if (!season.userSchedule.some(x => x.id === match.id)) season.userSchedule.push({ ...match, label: match.round, phase: match.roundKey, status: "scheduled", knockout: true }); }
function updateUserSchedule(season, match) { const x = season.userSchedule.find(i => i.id === match.id); if (!x) return; x.status = "played"; x.homeGoals = match.homeGoals; x.awayGoals = match.awayGoals; x.winner = match.winner; x.decidedBy = match.decidedBy; }
function sortAllStandings(season) { Object.keys(season.standings).forEach(g => season.standings[g].sort(sortStandings)); }

function getStarters(team) { if (!team.players?.length) return []; const lineup = team.players.filter(p => team.lineup?.[p.id] && team.lineup[p.id] !== "BENCH").sort((a, b) => b.overall - a.overall); return (lineup.length >= 8 ? lineup : [...team.players].sort((a, b) => b.overall - a.overall)).slice(0, 11); }
function getBench(team, starters) { const ids = new Set(starters.map(p => p.id)); return [...(team.players || [])].filter(p => !ids.has(p.id)).sort((a, b) => b.overall - a.overall).slice(0, 5); }
function getPositionAverages(players) { return { ATT: average(players.filter(p => p.position === "ATT").map(p => p.overall)), MID: average(players.filter(p => p.position === "MID").map(p => p.overall)), DEF: average(players.filter(p => p.position === "DEF").map(p => p.overall)), GK: average(players.filter(p => p.position === "GK").map(p => p.overall)) }; }
function formationBalance(team, starters) { const f = getFormationById(team.formationId), req = { ATT: 0, MID: 0, DEF: 0, GK: 0 }, act = { ATT: 0, MID: 0, DEF: 0, GK: 0 }; f.lines.flat().forEach(p => req[p]++); starters.forEach(p => act[p.position]++); const miss = Math.max(0, req.ATT - act.ATT) + Math.max(0, req.MID - act.MID) + Math.max(0, req.DEF - act.DEF) + Math.max(0, req.GK - act.GK), chem = Math.max(-5, 3 - miss * 1.8); return { attack: chem + Math.max(0, act.ATT - req.ATT) * 0.5, control: chem + Math.max(0, act.MID - req.MID) * 0.4, defense: chem + Math.max(0, act.DEF - req.DEF) * 0.5, goalkeeping: act.GK >= 1 ? 1.5 : -8, tempo: chem * 0.35, risk: miss * 0.6 }; }
function pickScorer(team, type) { const pool = getStarters(team).filter(p => p.position !== "GK"); const weighted = (pool.length ? pool : team.players || []).flatMap(p => { const traits = getTraitList(p).map(x => String(x).toLowerCase()); let w = p.position === "ATT" ? 5 : p.position === "MID" ? 3 : p.position === "DEF" ? 1.2 : 0.2; if ((type === "cross" || type === "setPiece") && (traits.includes("target man") || traits.includes("aerial monster"))) w += 2.8; if ((type === "through" || type === "transition") && (traits.includes("speedster") || traits.includes("poacher"))) w += 2.5; if ((type === "cutback" || type === "magic") && (traits.includes("clinical finisher") || traits.includes("inside forward"))) w += 2.2; if (type === "longShot" && traits.includes("long shot specialist")) w += 3; return Array.from({ length: Math.max(1, Math.round(w + (p.overall - 70) / 8)) }, () => p); }); const p = weighted[Math.floor(Math.random() * weighted.length)]; return p ? p.name : "a late runner"; }

function createTacticsMoment(phase, match = null) { const labels = { FIRST_HALF: "First Half", SECOND_HALF: "Second Half", ROUND_OF_16: "Round of 16", QUARTERFINALS: "Quarterfinal", SEMIFINALS: "Semifinal", FINAL: "Final" }; return match ? { phase, title: `${labels[phase]} Tactics`, message: `Next up: ${match.home.name} vs ${match.away.name}. Choose the setup that counters the opponent.`, button: "Lock Tactics" } : { phase, title: `${labels[phase]} Tactics`, message: "Lock in your tactical counters, chance focus and chain-friendly plan before this stretch begins.", button: phase === "FIRST_HALF" ? "Start Season" : "Lock Tactics" }; }
function ensureTactics(team) { if (!team) return; team.tactics = normalizeTactics(team.tactics || team.playStyle); if (!team.playStyle) team.playStyle = team.tactics.playStyle || "Balanced"; }
function normalizeTactics(raw) { const s = typeof raw === "string" ? { playStyle: raw } : { ...(raw || {}) }, out = { ...DEFAULT_TACTICS }; if (s.mentality === "Defensive") Object.assign(out, { riskLevel: "Safe", defensiveShape: "Deep Compact" }); if (s.mentality === "Attacking") Object.assign(out, { riskLevel: "Brave", attackingPlan: "Central Overload" }); if (s.pressing === "Low Block") out.pressingPlan = "Low Block"; if (s.pressing === "High Press") out.pressingPlan = "High Press"; if (s.defensiveLine === "Deep Line") out.defensiveShape = "Deep Compact"; if (s.defensiveLine === "High Line") out.defensiveShape = "High Line"; if (s.passing === "Short Passing") out.buildUpPlan = "Short Build Up"; if (s.passing === "Direct Passing") out.buildUpPlan = "Direct Build Up"; if (s.tempo === "Fast Tempo") out.buildUpPlan = "Fast Transitions"; if (s.risk === "Safe Risk") out.riskLevel = "Safe"; if (s.risk === "High Risk") out.riskLevel = "Brave"; Object.keys(DEFAULT_TACTICS).forEach(k => { if (s[k]) out[k] = s[k]; }); if (s.playStyle) out.playStyle = s.playStyle; return out; }
function planText(p) { const t = p.tactics; return `${t.attackingPlan}, ${t.pressingPlan}, ${t.chanceFocus}`; }
function involvesUser(season, m) { return m.home === season.userTeam || m.away === season.userTeam; }
function sortStandings(a, b) { return b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || getTeamStrength(b.team) - getTeamStrength(a.team); }
function average(nums, fallback = 60) { return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : fallback; }
function randomBetween(min, max) { return min + Math.random() * (max - min); }
function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }
function roundStat(v) { return Math.round(v * 100) / 100; }
function eventPriority(t) { return t === "GOAL" ? 0 : t === "CHANCE" || t === "SAVE" ? 1 : 2; }
function shuffle(items) { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
