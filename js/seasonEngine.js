export function createSeason(teams, userTeamIndex) {
  const conferences = createConferences(teams);
  const standings = createInitialStandings(conferences);
  const groupMatches = createGroupSchedule(conferences);

  return {
    userTeamIndex,
    phase: "GROUP_FIRST_HALF",
    conferences,
    standings,
    matchQueue: groupMatches.firstHalf,
    secondHalfQueue: groupMatches.secondHalf,
    playoffSeeds: [],
    playoffRounds: [],
    currentMatch: null,
    matchHistory: [],
    champion: null,
    waitingForTactics: false
  };
}

export function simulateNextMatch(season) {
  if (season.waitingForTactics || season.phase === "COMPLETE") return season;

  if (season.matchQueue.length === 0) {
    advancePhase(season);
    return season;
  }

  const match = season.matchQueue.shift();
  const result = simulateMatchWithEvents(match.home, match.away);

  const fullMatch = {
    ...match,
    ...result
  };

  season.currentMatch = fullMatch;
  season.matchHistory.push(fullMatch);

  if (match.type === "GROUP") {
    updateStandings(season.standings[match.conference], match.home, match.away, result);
    sortAllStandings(season);
  }

  if (match.type === "FINAL") {
    season.champion = result.homeGoals > result.awayGoals ? match.home : match.away;
    season.phase = "COMPLETE";
  }

  if (season.matchQueue.length === 0 && season.phase !== "COMPLETE") {
    season.waitingForTactics = true;
  }

  return season;
}

export function continueAfterTactics(season) {
  season.waitingForTactics = false;
  advancePhase(season);
}

function advancePhase(season) {
  if (season.phase === "GROUP_FIRST_HALF") {
    season.phase = "GROUP_SECOND_HALF";
    season.matchQueue = season.secondHalfQueue;
    return;
  }

  if (season.phase === "GROUP_SECOND_HALF") {
    season.playoffSeeds = createPowerRanking(season).slice(0, 16);
    season.phase = "ROUND_OF_16";
    season.matchQueue = createTwoLegRoundQueue("Round of 16", season.playoffSeeds);
    return;
  }

  if (season.phase === "ROUND_OF_16") {
    const winners = getTwoLegWinners(season, "Round of 16");
    season.playoffRounds.push({ name: "Round of 16", winners });
    season.phase = "QUARTERFINALS";
    season.matchQueue = createTwoLegRoundQueue("Quarterfinals", winners);
    return;
  }

  if (season.phase === "QUARTERFINALS") {
    const winners = getTwoLegWinners(season, "Quarterfinals");
    season.playoffRounds.push({ name: "Quarterfinals", winners });
    season.phase = "SEMIFINALS";
    season.matchQueue = createTwoLegRoundQueue("Semifinals", winners);
    return;
  }

  if (season.phase === "SEMIFINALS") {
    const winners = getTwoLegWinners(season, "Semifinals");
    season.playoffRounds.push({ name: "Semifinals", winners });
    season.phase = "FINAL";
    season.matchQueue = [{
      type: "FINAL",
      round: "Final",
      leg: "Final",
      home: winners[0],
      away: winners[1]
    }];
  }
}

function createConferences(teams) {
  const names = ["North", "West", "East", "South"];
  const shuffled = shuffle(teams);

  return names.map((name, index) => ({
    name,
    teams: shuffled.slice(index * 5, index * 5 + 5)
  }));
}

function createGroupSchedule(conferences) {
  const matches = [];

  conferences.forEach(conference => {
    for (let i = 0; i < conference.teams.length; i++) {
      for (let j = i + 1; j < conference.teams.length; j++) {
        matches.push({
          type: "GROUP",
          round: "Group Stage",
          conference: conference.name,
          home: conference.teams[i],
          away: conference.teams[j]
        });

        matches.push({
          type: "GROUP",
          round: "Group Stage",
          conference: conference.name,
          home: conference.teams[j],
          away: conference.teams[i]
        });
      }
    }
  });

  const shuffled = shuffle(matches);
  const middle = Math.ceil(shuffled.length / 2);

  return {
    firstHalf: shuffled.slice(0, middle),
    secondHalf: shuffled.slice(middle)
  };
}

function createInitialStandings(conferences) {
  const standings = {};

  conferences.forEach(conference => {
    standings[conference.name] = conference.teams.map(team => ({
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
  } else if (result.awayGoals > result.homeGoals) {
    awayRow.wins++;
    homeRow.losses++;
    awayRow.points += 3;
  } else {
    homeRow.draws++;
    awayRow.draws++;
    homeRow.points++;
    awayRow.points++;
  }
}

function sortAllStandings(season) {
  Object.keys(season.standings).forEach(group => {
    season.standings[group].sort(sortStandings);
  });
}

function createPowerRanking(season) {
  return Object.values(season.standings)
    .flatMap(group => group.slice(0, 4))
    .sort(sortStandings)
    .map(row => row.team);
}

function createTwoLegRoundQueue(roundName, teams) {
  const pairs = [];

  for (let i = 0; i < teams.length / 2; i++) {
    pairs.push([teams[i], teams[teams.length - 1 - i]]);
  }

  return pairs.flatMap(([teamA, teamB]) => [
    {
      type: "PLAYOFF",
      round: roundName,
      leg: "Leg 1",
      home: teamA,
      away: teamB,
      tieKey: `${roundName}-${teamA.name}-${teamB.name}`,
      teamA,
      teamB
    },
    {
      type: "PLAYOFF",
      round: roundName,
      leg: "Leg 2",
      home: teamB,
      away: teamA,
      tieKey: `${roundName}-${teamA.name}-${teamB.name}`,
      teamA,
      teamB
    }
  ]);
}

function getTwoLegWinners(season, roundName) {
  const matches = season.matchHistory.filter(match => match.round === roundName);
  const ties = {};

  matches.forEach(match => {
    if (!ties[match.tieKey]) {
      ties[match.tieKey] = {
        teamA: match.teamA,
        teamB: match.teamB,
        teamAGoals: 0,
        teamBGoals: 0
      };
    }

    if (match.home === match.teamA) {
      ties[match.tieKey].teamAGoals += match.homeGoals;
      ties[match.tieKey].teamBGoals += match.awayGoals;
    } else {
      ties[match.tieKey].teamAGoals += match.awayGoals;
      ties[match.tieKey].teamBGoals += match.homeGoals;
    }
  });

  return Object.values(ties).map(tie => {
    if (tie.teamAGoals > tie.teamBGoals) return tie.teamA;
    if (tie.teamBGoals > tie.teamAGoals) return tie.teamB;
    return getTeamPower(tie.teamA) >= getTeamPower(tie.teamB) ? tie.teamA : tie.teamB;
  });
}

function simulateMatchWithEvents(home, away) {
  const homePower = getTeamPower(home) + 2;
  const awayPower = getTeamPower(away);

  let homeGoals = 0;
  let awayGoals = 0;
  const events = [];

  for (let minute = 1; minute <= 90; minute++) {
    const chanceRoll = Math.random();

    if (chanceRoll < 0.055) {
      const homeChance = homePower / (homePower + awayPower);
      const attackingTeam = Math.random() < homeChance ? home : away;
      const isHome = attackingTeam === home;
      const quality = isHome ? homePower : awayPower;
      const goalChance = Math.min(0.42, quality / 240);

      if (Math.random() < goalChance) {
        if (isHome) homeGoals++;
        else awayGoals++;

        events.push({
          minute,
          type: "GOAL",
          text: `${minute}' GOAL! ${attackingTeam.name} scores.`
        });
      } else {
        events.push({
          minute,
          type: "CHANCE",
          text: `${minute}' Big chance for ${attackingTeam.name}, but no goal.`
        });
      }
    }

    if (minute === 45) {
      events.push({
        minute,
        type: "INFO",
        text: `45' Half-time: ${home.name} ${homeGoals} - ${awayGoals} ${away.name}`
      });
    }
  }

  events.push({
    minute: 90,
    type: "INFO",
    text: `90' Full-time: ${home.name} ${homeGoals} - ${awayGoals} ${away.name}`
  });

  return {
    homeGoals,
    awayGoals,
    events
  };
}

function getTeamPower(team) {
  if (!team.players || team.players.length === 0) return 60;

  const sorted = [...team.players].sort((a, b) => b.overall - a.overall);
  const starters = sorted.slice(0, 11);
  const bench = sorted.slice(11, 16);

  const starterAvg = average(starters.map(p => p.overall));
  const benchAvg = average(bench.map(p => p.overall));

  const tacticBonus =
    team.playStyle === "Possession" ? 2 :
    team.playStyle === "Counter Attack" ? 1.8 :
    team.playStyle === "High Press" ? 1.6 :
    team.playStyle === "Defensive Block" ? 1.5 :
    1;

  const balanceBonus = getBalanceBonus(team);

  return starterAvg * 0.84 + benchAvg * 0.08 + tacticBonus + balanceBonus;
}

function getBalanceBonus(team) {
  const counts = { GK: 0, DEF: 0, MID: 0, ATT: 0 };

  team.players.forEach(player => {
    if (counts[player.position] !== undefined) {
      counts[player.position]++;
    }
  });

  let bonus = 0;
  if (counts.GK >= 1) bonus += 1;
  if (counts.DEF >= 4) bonus += 1;
  if (counts.MID >= 3) bonus += 1;
  if (counts.ATT >= 2) bonus += 1;

  return bonus;
}

function average(numbers) {
  if (!numbers.length) return 60;
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

function sortStandings(a, b) {
  return b.points - a.points ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
    b.goalsFor - a.goalsFor;
}
