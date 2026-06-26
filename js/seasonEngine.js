export function createSeason(teams) {
  const conferences = createConferences(teams);
  const schedule = createGroupSchedule(conferences);

  return {
    phase: "GROUP_FIRST_HALF",
    conferences,
    schedule,
    playedMatches: [],
    standings: createInitialStandings(conferences),
    playoffSeeds: [],
    playoffRounds: [],
    champion: null
  };
}

export function simulateNextPhase(season) {
  if (season.phase === "GROUP_FIRST_HALF") {
    const firstHalf = season.schedule.slice(0, season.schedule.length / 2);
    simulateMatches(firstHalf, season);
    season.phase = "GROUP_SECOND_HALF";
    return;
  }

  if (season.phase === "GROUP_SECOND_HALF") {
    const secondHalf = season.schedule.slice(season.schedule.length / 2);
    simulateMatches(secondHalf, season);
    season.playoffSeeds = createPowerRanking(season);
    season.phase = "ROUND_OF_16";
    return;
  }

  if (season.phase === "ROUND_OF_16") {
    const pairs = createPairs(season.playoffSeeds);
    season.playoffRounds.push(simulateTwoLegRound("Round of 16", pairs));
    season.phase = "QUARTERFINALS";
    return;
  }

  if (season.phase === "QUARTERFINALS") {
    const previous = getLastWinners(season);
    season.playoffRounds.push(simulateTwoLegRound("Quarterfinals", createPairs(previous)));
    season.phase = "SEMIFINALS";
    return;
  }

  if (season.phase === "SEMIFINALS") {
    const previous = getLastWinners(season);
    season.playoffRounds.push(simulateTwoLegRound("Semifinals", createPairs(previous)));
    season.phase = "FINAL";
    return;
  }

  if (season.phase === "FINAL") {
    const previous = getLastWinners(season);
    const final = simulateSingleFinal(previous[0], previous[1]);
    season.playoffRounds.push({
      name: "Final",
      ties: [final]
    });
    season.champion = final.winner;
    season.phase = "COMPLETE";
  }
}

function createConferences(teams) {
  const names = ["North", "West", "East", "South"];
  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  return names.map((name, index) => ({
    name,
    teams: shuffled.slice(index * 5, index * 5 + 5)
  }));
}

function createGroupSchedule(conferences) {
  const matches = [];

  conferences.forEach(conference => {
    const teams = conference.teams;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          phase: "Group Stage",
          conference: conference.name,
          home: teams[i],
          away: teams[j]
        });

        matches.push({
          phase: "Group Stage",
          conference: conference.name,
          home: teams[j],
          away: teams[i]
        });
      }
    }
  });

  return matches;
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

function simulateMatches(matches, season) {
  matches.forEach(match => {
    const result = simulateMatch(match.home, match.away);

    season.playedMatches.push({
      ...match,
      ...result
    });

    updateStandings(season.standings[match.conference], match.home, match.away, result);
  });

  Object.keys(season.standings).forEach(name => {
    season.standings[name].sort(sortStandings);
  });
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

function createPowerRanking(season) {
  return Object.values(season.standings)
    .flatMap(group => group.slice(0, 4))
    .sort(sortStandings)
    .map(row => row.team)
    .slice(0, 16);
}

function createPairs(seeds) {
  const pairs = [];

  for (let i = 0; i < seeds.length / 2; i++) {
    pairs.push([seeds[i], seeds[seeds.length - 1 - i]]);
  }

  return pairs;
}

function simulateTwoLegRound(name, pairs) {
  return {
    name,
    ties: pairs.map(([teamA, teamB]) => simulateTwoLegTie(teamA, teamB))
  };
}

function simulateTwoLegTie(teamA, teamB) {
  const leg1 = simulateMatch(teamA, teamB);
  const leg2 = simulateMatch(teamB, teamA);

  const teamAGoals = leg1.homeGoals + leg2.awayGoals;
  const teamBGoals = leg1.awayGoals + leg2.homeGoals;

  const winner =
    teamAGoals > teamBGoals ? teamA :
    teamBGoals > teamAGoals ? teamB :
    getTeamPower(teamA) >= getTeamPower(teamB) ? teamA : teamB;

  return {
    teamA,
    teamB,
    leg1,
    leg2,
    teamAGoals,
    teamBGoals,
    winner
  };
}

function simulateSingleFinal(teamA, teamB) {
  const match = simulateMatch(teamA, teamB);

  if (match.homeGoals === match.awayGoals) {
    if (getTeamPower(teamA) >= getTeamPower(teamB)) {
      match.homeGoals++;
    } else {
      match.awayGoals++;
    }
  }

  return {
    teamA,
    teamB,
    match,
    winner: match.homeGoals > match.awayGoals ? teamA : teamB
  };
}

function getLastWinners(season) {
  return season.playoffRounds[season.playoffRounds.length - 1].ties.map(tie => tie.winner);
}

function simulateMatch(home, away) {
  const homePower = getTeamPower(home) + 2;
  const awayPower = getTeamPower(away);

  return {
    homeGoals: generateGoals(homePower / 42),
    awayGoals: generateGoals(awayPower / 46)
  };
}

function generateGoals(expected) {
  let goals = 0;

  for (let i = 0; i < 7; i++) {
    if (Math.random() < expected / 7) goals++;
  }

  return goals;
}

function getTeamPower(team) {
  const players = [...team.players].sort((a, b) => b.overall - a.overall);
  const starters = players.slice(0, 11);
  const bench = players.slice(11, 16);

  const starterAvg = average(starters.map(p => p.overall));
  const benchAvg = average(bench.map(p => p.overall));

  const tacticBonus =
    team.playStyle === "Possession" ? 2 :
    team.playStyle === "Counter Attack" ? 1.8 :
    team.playStyle === "High Press" ? 1.6 :
    team.playStyle === "Defensive Block" ? 1.5 :
    1;

  return starterAvg * 0.85 + benchAvg * 0.08 + tacticBonus;
}

function average(numbers) {
  if (!numbers.length) return 60;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function sortStandings(a, b) {
  return b.points - a.points ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
    b.goalsFor - a.goalsFor;
}