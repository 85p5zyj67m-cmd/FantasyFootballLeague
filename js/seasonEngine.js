import { getFormationById } from "./formations.js";

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

const GROUP_PHASES = {
  FIRST_HALF: "First Half",
  SECOND_HALF: "Second Half"
};

const STYLE_PROFILES = {
  Balanced: { attack: 0, control: 0, defense: 0, tempo: 0, risk: 0 },
  Possession: { attack: 0.5, control: 4.5, defense: 1, tempo: -0.5, risk: -0.5 },
  "Counter Attack": { attack: 3, control: -1, defense: 1.5, tempo: 2, risk: 1.5 },
  "High Press": { attack: 2.5, control: 1.5, defense: -0.5, tempo: 4, risk: 2 },
  "Defensive Block": { attack: -1.5, control: -1, defense: 5, tempo: -2, risk: -2 },
  Attacking: { attack: 3, control: 0, defense: -1, tempo: 2, risk: 2 },
  "Midfield Control": { attack: 1, control: 4, defense: 0.5, tempo: 0, risk: 0 },
  "Defensive Wall": { attack: -1.5, control: -0.5, defense: 4.5, tempo: -1.5, risk: -1.5 },
  "Star Hunter": { attack: 2, control: 0.5, defense: 0, tempo: 1, risk: 1 },
  "Goalkeeper Early": { attack: -0.5, control: 0, defense: 2.5, tempo: -0.5, risk: -1 }
};

export function createSeason(teams, userTeamIndex) {
  const divisions = createCompassDivisions(teams);
  const standings = createInitialStandings(divisions);
  const groupRounds = createGroupRounds(divisions);
  const userTeam = teams[userTeamIndex];

  const season = {
    userTeamIndex,
    userTeam,
    divisions,
    standings,
    groupRounds,
    groupRoundIndex: {
      FIRST_HALF: 0,
      SECOND_HALF: 0
    },
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
  if (!season || season.waitingForTactics || season.phase === "COMPLETE") {
    return season;
  }

  if (!season.nextMatch) {
    prepareNextUserMatch(season);
  }

  if (!season.nextMatch || season.waitingForTactics || season.phase === "COMPLETE") {
    return season;
  }

  simulateBackgroundMatches(season, season.pendingBackgroundMatches);
  season.pendingBackgroundMatches = [];

  const match = season.nextMatch;
  const result = simulateMatchWithEvents(match.home, match.away, {
    knockout: match.type === "KNOCKOUT"
  });

  const fullMatch = {
    ...match,
    ...result,
    userMatch: true
  };

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
  if (!season || season.phase === "COMPLETE") {
    return season;
  }

  season.waitingForTactics = false;
  season.tacticsMoment = null;
  prepareNextUserMatch(season);

  return season;
}

export function getTeamStrength(team) {
  const profile = getTeamProfile(team);
  return Math.round((profile.attack + profile.control + profile.defense) / 3);
}

function prepareNextUserMatch(season) {
  if (season.waitingForTactics || season.phase === "COMPLETE") {
    return;
  }

  if (season.phase === "FIRST_HALF" || season.phase === "SECOND_HALF") {
    prepareNextGroupMatch(season);
    return;
  }
}

function prepareNextGroupMatch(season) {
  const rounds = season.groupRounds[season.phase];
  let index = season.groupRoundIndex[season.phase];

  while (index < rounds.length) {
    const round = rounds[index];
    const userMatch = round.matches.find(match => involvesUser(season, match));
    const backgroundMatches = round.matches.filter(match => !involvesUser(season, match));

    if (userMatch) {
      season.nextMatch = {
        ...userMatch,
        round: `${GROUP_PHASES[season.phase]} - Matchday ${round.number}`,
        roundIndex: index,
        phase: season.phase
      };
      season.pendingBackgroundMatches = backgroundMatches.map(match => ({
        ...match,
        round: `${GROUP_PHASES[season.phase]} - Matchday ${round.number}`,
        roundIndex: index,
        phase: season.phase
      }));
      return;
    }

    simulateBackgroundMatches(season, backgroundMatches.map(match => ({
      ...match,
      round: `${GROUP_PHASES[season.phase]} - Matchday ${round.number}`,
      roundIndex: index,
      phase: season.phase
    })));
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

  const seeds = Object.values(season.standings)
    .flatMap(rows => rows.slice(0, 4))
    .sort(sortStandings)
    .map(row => row.team);

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

  const roundRecord = {
    key: round.key,
    label: round.label,
    fixtures,
    results: Array(fixtures.length).fill(null),
    winners: Array(fixtures.length).fill(null)
  };

  season.knockoutRounds.push(roundRecord);

  fixtures.forEach((fixture, fixtureIndex) => {
    if (fixtureIndex === userFixtureIndex) {
      return;
    }

    const result = simulateMatchWithEvents(fixture.home, fixture.away, { knockout: true });
    const fullMatch = {
      ...fixture,
      ...result,
      fixtureIndex,
      userMatch: false
    };

    roundRecord.results[fixtureIndex] = fullMatch;
    roundRecord.winners[fixtureIndex] = fullMatch.winner;
    registerMatchResult(season, fullMatch, false);
  });

  if (userFixtureIndex === -1) {
    finishRemainingKnockouts(
      season,
      roundRecord.winners.filter(Boolean),
      roundIndex + 1
    );
    return;
  }

  const userFixture = {
    ...fixtures[userFixtureIndex],
    fixtureIndex: userFixtureIndex
  };

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
    finishRemainingKnockouts(
      season,
      roundRecord.winners.filter(Boolean),
      season.knockoutRoundIndex + 1
    );
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

  startKnockoutRound(
    season,
    season.knockoutRoundIndex + 1,
    roundRecord.winners.filter(Boolean)
  );
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
      const result = simulateMatchWithEvents(fixture.home, fixture.away, { knockout: true });
      const fullMatch = {
        ...fixture,
        ...result,
        fixtureIndex,
        userMatch: false
      };

      winners.push(fullMatch.winner);
      results.push(fullMatch);
      registerMatchResult(season, fullMatch, false);
    });

    season.knockoutRounds.push({
      key: round.key,
      label: round.label,
      fixtures,
      results,
      winners
    });

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
    const result = simulateMatchWithEvents(match.home, match.away, {
      knockout: match.type === "KNOCKOUT"
    });
    const fullMatch = {
      ...match,
      ...result,
      events: [],
      userMatch: false
    };

    registerMatchResult(season, fullMatch, false);
  });
}

function registerMatchResult(season, match, isUserMatch) {
  season.allResults.push(match);

  if (!isUserMatch) {
    season.opponentResults.unshift(match);
    season.opponentResults = season.opponentResults.slice(0, 16);
  }

  if (match.type === "GROUP") {
    updateStandings(season.standings[match.division], match.home, match.away, match);
    sortAllStandings(season);
  }

  if (isUserMatch) {
    updateUserSchedule(season, match);
  }
}

function createCompassDivisions(teams) {
  const shuffled = shuffle(teams);

  return DIVISION_ORDER.map((division, index) => ({
    ...division,
    teams: shuffled.slice(index * 5, index * 5 + 5)
  }));
}

function createGroupRounds(divisions) {
  const divisionSchedules = divisions.map(division => ({
    division,
    firstHalf: createDivisionRoundRobin(division, false),
    secondHalf: createDivisionRoundRobin(division, true)
  }));

  return {
    FIRST_HALF: createGlobalRounds(divisionSchedules, "firstHalf", "FIRST_HALF"),
    SECOND_HALF: createGlobalRounds(divisionSchedules, "secondHalf", "SECOND_HALF")
  };
}

function createGlobalRounds(divisionSchedules, key, phase) {
  const totalRounds = Math.max(...divisionSchedules.map(schedule => schedule[key].length));

  return Array.from({ length: totalRounds }, (_, roundIndex) => ({
    number: roundIndex + 1,
    matches: divisionSchedules.flatMap(schedule =>
      schedule[key][roundIndex].map((match, matchIndex) => ({
        ...match,
        id: `${phase}-${schedule.division.id}-${roundIndex}-${matchIndex}`,
        type: "GROUP",
        division: schedule.division.name
      }))
    )
  }));
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
  return ["FIRST_HALF", "SECOND_HALF"].flatMap(phase =>
    groupRounds[phase].flatMap(round =>
      round.matches
        .filter(match => match.home === userTeam || match.away === userTeam)
        .map(match => ({
          ...match,
          phase,
          label: `${GROUP_PHASES[phase]} - Matchday ${round.number}`,
          status: "scheduled",
          knockout: false
        }))
    )
  );
}

function addUserScheduleMatch(season, match) {
  if (season.userSchedule.some(item => item.id === match.id)) {
    return;
  }

  season.userSchedule.push({
    ...match,
    label: match.round,
    phase: match.roundKey,
    status: "scheduled",
    knockout: true
  });
}

function updateUserSchedule(season, match) {
  const scheduleMatch = season.userSchedule.find(item => item.id === match.id);

  if (!scheduleMatch) return;

  scheduleMatch.status = "played";
  scheduleMatch.homeGoals = match.homeGoals;
  scheduleMatch.awayGoals = match.awayGoals;
  scheduleMatch.winner = match.winner;
  scheduleMatch.decidedBy = match.decidedBy;
}

function createSeededFixtures(teams, round) {
  const fixtures = [];

  for (let i = 0; i < teams.length / 2; i++) {
    const highSeed = teams[i];
    const lowSeed = teams[teams.length - 1 - i];
    const home = i % 2 === 0 ? highSeed : lowSeed;
    const away = home === highSeed ? lowSeed : highSeed;

    fixtures.push({
      id: `${round.key}-${i}-${highSeed.name}-${lowSeed.name}`,
      type: "KNOCKOUT",
      round: round.label,
      roundKey: round.key,
      home,
      away,
      knockout: true
    });
  }

  return fixtures;
}

function createInitialStandings(divisions) {
  const standings = {};

  divisions.forEach(division => {
    standings[division.name] = division.teams.map(team => ({
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    }));
  });

  return standings;
}

function updateStandings(standings, home, away, result) {
  const homeRow = standings.find(row => row.team === home);
  const awayRow = standings.find(row => row.team === away);

  if (!homeRow || !awayRow) return;

  homeRow.played++;
  awayRow.played++;
  homeRow.goalsFor += result.homeGoals;
  homeRow.goalsAgainst += result.awayGoals;
  awayRow.goalsFor += result.awayGoals;
  awayRow.goalsAgainst += result.homeGoals;

  if (result.homeGoals > result.awayGoals) {
    homeRow.wins++;
    awayRow.losses++;
    homeRow.points += 3;
    return;
  }

  if (result.awayGoals > result.homeGoals) {
    awayRow.wins++;
    homeRow.losses++;
    awayRow.points += 3;
    return;
  }

  homeRow.draws++;
  awayRow.draws++;
  homeRow.points++;
  awayRow.points++;
}

function sortAllStandings(season) {
  Object.keys(season.standings).forEach(group => {
    season.standings[group].sort(sortStandings);
  });
}

function simulateMatchWithEvents(home, away, options = {}) {
  const homeProfile = getTeamProfile(home);
  const awayProfile = getTeamProfile(away);
  const homeSwing = randomBetween(-4.5, 5.5) + randomBetween(-2.2, 2.2);
  const awaySwing = randomBetween(-4.5, 5.5) + randomBetween(-2.2, 2.2);
  const homeRating = homeProfile.total + 2.2 + homeSwing;
  const awayRating = awayProfile.total + awaySwing;
  const events = [];
  const stats = {
    homeXg: 0,
    awayXg: 0,
    homeShots: 0,
    awayShots: 0,
    homeMomentum: Math.round(homeRating),
    awayMomentum: Math.round(awayRating)
  };

  let homeGoals = 0;
  let awayGoals = 0;

  events.push({
    minute: 1,
    type: "INFO",
    text: `1' Kickoff. ${home.name} and ${away.name} are underway.`
  });

  const regulation = playMinutes({
    from: 2,
    to: 90,
    home,
    away,
    homeProfile,
    awayProfile,
    homeRating,
    awayRating,
    stats,
    events,
    goals: { home: homeGoals, away: awayGoals }
  });

  homeGoals = regulation.home;
  awayGoals = regulation.away;

  let winner = null;
  let decidedBy = "90";
  let penaltyScore = null;

  if (options.knockout && homeGoals === awayGoals) {
    events.push({
      minute: 91,
      type: "INFO",
      text: "91' Extra time begins. One mistake can decide the tie now."
    });

    const extraTime = playMinutes({
      from: 91,
      to: 120,
      home,
      away,
      homeProfile,
      awayProfile,
      homeRating: homeRating - 1.2,
      awayRating: awayRating - 1.2,
      stats,
      events,
      goals: { home: homeGoals, away: awayGoals },
      chanceScale: 0.72
    });

    homeGoals = extraTime.home;
    awayGoals = extraTime.away;
    decidedBy = "ET";

    if (homeGoals === awayGoals) {
      const penalties = simulatePenaltyShootout(home, away, homeProfile, awayProfile);
      winner = penalties.winner;
      penaltyScore = penalties.score;
      decidedBy = "PEN";
      events.push({
        minute: 121,
        type: "GOAL",
        text: `Penalties: ${penalties.score}. ${winner.name} survive the shootout.`
      });
    }
  }

  if (!winner) {
    winner = homeGoals > awayGoals ? home : awayGoals > homeGoals ? away : null;
  }

  events.push({
    minute: options.knockout && decidedBy !== "90" ? 120 : 90,
    type: "INFO",
    text: `Full-time: ${home.name} ${homeGoals} - ${awayGoals} ${away.name}`
  });

  events.sort((a, b) => a.minute - b.minute || eventPriority(a.type) - eventPriority(b.type));

  return {
    homeGoals,
    awayGoals,
    winner,
    decidedBy,
    penaltyScore,
    stats,
    events
  };
}

function playMinutes(context) {
  const chanceScale = context.chanceScale ?? 1;
  const goals = { ...context.goals };

  for (let minute = context.from; minute <= context.to; minute++) {
    const tempo = (context.homeProfile.tempo + context.awayProfile.tempo) / 190;
    const chanceRate = clamp(0.035, 0.12, (0.058 + tempo * 0.025) * chanceScale);
    const hasChance = Math.random() <= chanceRate;

    if (!hasChance) {
      pushHalfTimeEvent(context, goals, minute);
      continue;
    }

    const homeChanceEdge =
      context.homeProfile.attack +
      context.homeProfile.control * 0.28 +
      context.homeRating * 0.16 -
      context.awayProfile.defense -
      context.awayProfile.control * 0.12;

    const awayChanceEdge =
      context.awayProfile.attack +
      context.awayProfile.control * 0.28 +
      context.awayRating * 0.16 -
      context.homeProfile.defense -
      context.homeProfile.control * 0.12;

    const homeChance = clamp(0.24, 0.76, 0.5 + (homeChanceEdge - awayChanceEdge) / 90);
    const isHomeChance = Math.random() < homeChance;
    const attackingTeam = isHomeChance ? context.home : context.away;
    const defendingTeam = isHomeChance ? context.away : context.home;
    const attackerProfile = isHomeChance ? context.homeProfile : context.awayProfile;
    const defenderProfile = isHomeChance ? context.awayProfile : context.homeProfile;
    const pressure =
      attackerProfile.attack * 0.62 +
      attackerProfile.control * 0.24 +
      attackerProfile.risk * 0.18 -
      defenderProfile.defense * 0.54 -
      defenderProfile.goalkeeping * 0.22;
    const chanceQuality = clamp(0.05, 0.48, 0.16 + pressure / 240 + Math.random() * 0.16);
    const goalChance = clamp(0.06, 0.52, chanceQuality * 0.92 + pressure / 330);

    if (isHomeChance) {
      context.stats.homeShots++;
      context.stats.homeXg += chanceQuality;
    } else {
      context.stats.awayShots++;
      context.stats.awayXg += chanceQuality;
    }

    if (Math.random() < goalChance) {
      if (isHomeChance) goals.home++;
      else goals.away++;

      const scorer = pickScorer(attackingTeam);
      context.events.push({
        minute,
        type: "GOAL",
        text: `${minute}' GOAL! ${attackingTeam.name} strike through ${scorer}.`
      });
      pushHalfTimeEvent(context, goals, minute);
      continue;
    }

    context.events.push({
      minute,
      type: Math.random() < 0.38 ? "SAVE" : "CHANCE",
      text: createChanceText(minute, attackingTeam, defendingTeam, chanceQuality)
    });

    pushHalfTimeEvent(context, goals, minute);
  }

  return goals;
}

function pushHalfTimeEvent(context, goals, minute) {
  if (minute !== 45) return;

  context.events.push({
    minute,
    type: "INFO",
    text: `45' Half-time: ${context.home.name} ${goals.home} - ${goals.away} ${context.away.name}`
  });
}

function createChanceText(minute, attackingTeam, defendingTeam, quality) {
  if (quality > 0.34) {
    return `${minute}' Huge chance for ${attackingTeam.name}, but ${defendingTeam.name} hang on.`;
  }

  if (quality > 0.22) {
    return `${minute}' ${attackingTeam.name} build pressure and force a sharp save.`;
  }

  return `${minute}' ${attackingTeam.name} flash a half chance wide.`;
}

function simulatePenaltyShootout(home, away, homeProfile, awayProfile) {
  const homeEdge =
    homeProfile.attack * 0.26 +
    homeProfile.goalkeeping * 0.18 -
    awayProfile.attack * 0.22 -
    awayProfile.goalkeeping * 0.14;
  const homeWinChance = clamp(0.36, 0.64, 0.5 + homeEdge / 180 + randomBetween(-0.08, 0.08));
  const winner = Math.random() < homeWinChance ? home : away;
  const loser = winner === home ? away : home;
  const winningPens = 4 + Math.floor(Math.random() * 2);
  const losingPens = Math.max(2, winningPens - 1 - Math.floor(Math.random() * 2));

  return {
    winner,
    score: `${winner.name} ${winningPens} - ${losingPens} ${loser.name}`
  };
}

function getTeamProfile(team) {
  const starters = getStarters(team);
  const bench = getBench(team, starters);
  const style = STYLE_PROFILES[team.playStyle] || STYLE_PROFILES.Balanced;
  const positionAverages = getPositionAverages(starters);
  const starterAverage = average(starters.map(player => player.overall));
  const benchAverage = average(bench.map(player => player.overall), starterAverage - 4);
  const starPower = average(starters.slice(0, 3).map(player => player.overall), starterAverage);
  const balance = getFormationBalance(team, starters);

  const attack =
    positionAverages.ATT * 0.54 +
    positionAverages.MID * 0.25 +
    starPower * 0.12 +
    benchAverage * 0.04 +
    style.attack +
    balance.attack;

  const control =
    positionAverages.MID * 0.5 +
    starterAverage * 0.22 +
    positionAverages.DEF * 0.12 +
    benchAverage * 0.06 +
    style.control +
    balance.control;

  const defense =
    positionAverages.DEF * 0.5 +
    positionAverages.GK * 0.24 +
    positionAverages.MID * 0.12 +
    benchAverage * 0.04 +
    style.defense +
    balance.defense;

  const goalkeeping = positionAverages.GK + balance.goalkeeping;
  const tempo = starterAverage + style.tempo + balance.tempo;
  const risk = 50 + style.risk + balance.risk;
  const total = attack * 0.36 + control * 0.27 + defense * 0.31 + goalkeeping * 0.06;

  return {
    attack,
    control,
    defense,
    goalkeeping,
    tempo,
    risk,
    total
  };
}

function getStarters(team) {
  if (!team.players || team.players.length === 0) {
    return [];
  }

  const lineupStarters = team.players
    .filter(player => team.lineup[player.id] && team.lineup[player.id] !== "BENCH")
    .sort((a, b) => b.overall - a.overall);

  if (lineupStarters.length >= 8) {
    return lineupStarters.slice(0, 11);
  }

  return [...team.players].sort((a, b) => b.overall - a.overall).slice(0, 11);
}

function getBench(team, starters) {
  const starterIds = new Set(starters.map(player => player.id));
  return [...(team.players || [])]
    .filter(player => !starterIds.has(player.id))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 5);
}

function getPositionAverages(players) {
  return {
    ATT: average(players.filter(player => player.position === "ATT").map(player => player.overall)),
    MID: average(players.filter(player => player.position === "MID").map(player => player.overall)),
    DEF: average(players.filter(player => player.position === "DEF").map(player => player.overall)),
    GK: average(players.filter(player => player.position === "GK").map(player => player.overall))
  };
}

function getFormationBalance(team, starters) {
  const formation = getFormationById(team.formationId);
  const required = { ATT: 0, MID: 0, DEF: 0, GK: 0 };
  const actual = { ATT: 0, MID: 0, DEF: 0, GK: 0 };

  formation.lines.flat().forEach(position => {
    required[position]++;
  });

  starters.forEach(player => {
    actual[player.position]++;
  });

  const missing =
    Math.max(0, required.ATT - actual.ATT) +
    Math.max(0, required.MID - actual.MID) +
    Math.max(0, required.DEF - actual.DEF) +
    Math.max(0, required.GK - actual.GK);

  const chemistry = Math.max(-5, 3 - missing * 1.8);

  return {
    attack: chemistry + Math.max(0, actual.ATT - required.ATT) * 0.5,
    control: chemistry + Math.max(0, actual.MID - required.MID) * 0.4,
    defense: chemistry + Math.max(0, actual.DEF - required.DEF) * 0.5,
    goalkeeping: actual.GK >= 1 ? 1.5 : -8,
    tempo: chemistry * 0.35,
    risk: missing * 0.6
  };
}

function pickScorer(team) {
  const starters = getStarters(team);
  const candidates = starters.length ? starters : team.players || [];
  const outfieldPlayers = candidates.filter(player => player.position !== "GK");
  const scoringPool = outfieldPlayers.length ? outfieldPlayers : candidates;
  const weighted = scoringPool.flatMap(player => {
    const positionWeight =
      player.position === "ATT" ? 5 :
      player.position === "MID" ? 3 :
      player.position === "DEF" ? 1.4 :
      0.2;
    const repeat = Math.max(1, Math.round(positionWeight + (player.overall - 70) / 8));
    return Array.from({ length: repeat }, () => player);
  });

  const player = weighted[Math.floor(Math.random() * weighted.length)] || scoringPool[0];
  return player ? player.name : "a late runner";
}

function createTacticsMoment(phase, match = null) {
  const labels = {
    FIRST_HALF: "First Half",
    SECOND_HALF: "Second Half",
    ROUND_OF_16: "Round of 16",
    QUARTERFINALS: "Quarterfinal",
    SEMIFINALS: "Semifinal",
    FINAL: "Final"
  };

  if (!match) {
    return {
      phase,
      title: `${labels[phase]} Tactics`,
      message: "Lock in your shape and play style before this stretch begins.",
      button: phase === "FIRST_HALF" ? "Start Season" : "Lock Tactics"
    };
  }

  return {
    phase,
    title: `${labels[phase]} Tactics`,
    message: `Next up: ${match.home.name} vs ${match.away.name}. Choose the setup you trust.`,
    button: "Lock Tactics"
  };
}

function involvesUser(season, match) {
  return match.home === season.userTeam || match.away === season.userTeam;
}

function sortStandings(a, b) {
  return b.points - a.points ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
    b.goalsFor - a.goalsFor ||
    getTeamStrength(b.team) - getTeamStrength(a.team);
}

function average(numbers, fallback = 60) {
  if (!numbers.length) return fallback;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function shuffle(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function eventPriority(type) {
  if (type === "GOAL") return 0;
  if (type === "CHANCE" || type === "SAVE") return 1;
  return 2;
}
