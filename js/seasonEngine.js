export function simulateSeason(teams) {
  const conferences = createConferences(teams);
  const groupResults = simulateGroupStage(conferences);
  const playoffTeams = getPlayoffTeams(groupResults);
  const powerRanking = createPowerRanking(playoffTeams);
  const playoffs = simulatePlayoffs(powerRanking);

  return {
    conferences,
    groupResults,
    powerRanking,
    playoffs,
    champion: playoffs.final.winner
  };
}

function createConferences(teams) {
  const names = ["North", "West", "East", "South"];
  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  return names.map((name, index) => ({
    name,
    teams: shuffled.slice(index * 5, index * 5 + 5)
  }));
}

function simulateGroupStage(conferences) {
  return conferences.map(conference => {
    const standings = conference.teams.map(team => ({
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    }));

    for (let i = 0; i < conference.teams.length; i++) {
      for (let j = i + 1; j < conference.teams.length; j++) {
        playGroupMatch(conference.teams[i], conference.teams[j], standings);
        playGroupMatch(conference.teams[j], conference.teams[i], standings);
      }
    }

    standings.sort((a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor
    );

    return {
      name: conference.name,
      standings
    };
  });
}

function playGroupMatch(home, away, standings) {
  const result = simulateMatch(home, away);

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
  } else if (result.homeGoals < result.awayGoals) {
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

function getPlayoffTeams(groupResults) {
  return groupResults.flatMap(group => group.standings.slice(0, 2));
}

function createPowerRanking(playoffTeams) {
  return playoffTeams.sort((a, b) =>
    b.points - a.points ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
    getTeamPower(b.team) - getTeamPower(a.team)
  );
}

function simulatePlayoffs(powerRanking) {
  const seeds = powerRanking.map(row => row.team);

  const quarterfinals = [
    simulateTwoLegTie(seeds[0], seeds[7]),
    simulateTwoLegTie(seeds[1], seeds[6]),
    simulateTwoLegTie(seeds[2], seeds[5]),
    simulateTwoLegTie(seeds[3], seeds[4])
  ];

  const semifinals = [
    simulateTwoLegTie(quarterfinals[0].winner, quarterfinals[3].winner),
    simulateTwoLegTie(quarterfinals[1].winner, quarterfinals[2].winner)
  ];

  const final = simulateFinal(semifinals[0].winner, semifinals[1].winner);

  return {
    quarterfinals,
    semifinals,
    final
  };
}

function simulateTwoLegTie(teamA, teamB) {
  const leg1 = simulateMatch(teamA, teamB);
  const leg2 = simulateMatch(teamB, teamA);

  const teamAGoals = leg1.homeGoals + leg2.awayGoals;
  const teamBGoals = leg1.awayGoals + leg2.homeGoals;

  let winner;

  if (teamAGoals > teamBGoals) {
    winner = teamA;
  } else if (teamBGoals > teamAGoals) {
    winner = teamB;
  } else {
    winner = getTeamPower(teamA) >= getTeamPower(teamB) ? teamA : teamB;
  }

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

function simulateFinal(teamA, teamB) {
  let match = simulateMatch(teamA, teamB);

  if (match.homeGoals === match.awayGoals) {
    const stronger = getTeamPower(teamA) >= getTeamPower(teamB) ? teamA : teamB;

    if (stronger === teamA) {
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

export function simulateMatch(home, away) {
  const homePower = getTeamPower(home) + 2;
  const awayPower = getTeamPower(away);

  const homeExpected = Math.max(0.2, homePower / 45);
  const awayExpected = Math.max(0.2, awayPower / 48);

  const homeGoals = generateGoals(homeExpected);
  const awayGoals = generateGoals(awayExpected);

  return {
    home,
    away,
    homeGoals,
    awayGoals
  };
}

function generateGoals(expected) {
  let goals = 0;

  for (let i = 0; i < 6; i++) {
    if (Math.random() < expected / 6) {
      goals++;
    }
  }

  return goals;
}

function getTeamPower(team) {
  if (!team.players || team.players.length === 0) return 60;

  const sorted = [...team.players].sort((a, b) => b.overall - a.overall);
  const starters = sorted.slice(0, 11);
  const bench = sorted.slice(11, 16);

  const starterAvg = average(starters.map(p => p.overall));
  const benchAvg = average(bench.map(p => p.overall));

  const chemistryBonus = getChemistryBonus(team);
  const tacticBonus = getTacticBonus(team);

  return starterAvg * 0.82 + benchAvg * 0.08 + chemistryBonus + tacticBonus;
}

function average(numbers) {
  if (!numbers.length) return 60;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function getChemistryBonus(team) {
  const clubs = {};
  const nations = {};

  team.players.forEach(player => {
    clubs[player.club] = (clubs[player.club] || 0) + 1;
    nations[player.nationality] = (nations[player.nationality] || 0) + 1;
  });

  const bestClubStack = Math.max(...Object.values(clubs));
  const bestNationStack = Math.max(...Object.values(nations));

  return Math.min(4, bestClubStack * 0.5) + Math.min(3, bestNationStack * 0.4);
}

function getTacticBonus(team) {
  const style = team.playStyle || "Balanced";

  if (style === "Possession") return 2;
  if (style === "Counter Attack") return 1.8;
  if (style === "High Press") return 1.5;
  if (style === "Defensive Block") return 1.4;

  return 1;
}