const STYLE_PLANS = {
  Balanced: {
    early: ["ATT", "MID", "DEF"],
    mid: ["MID", "DEF", "ATT"],
    late: ["GK", "DEF", "MID", "ATT"]
  },

  Attacking: {
    early: ["ATT", "ATT", "MID"],
    mid: ["ATT", "MID", "DEF"],
    late: ["GK", "DEF", "MID", "ATT"]
  },

  "Midfield Control": {
    early: ["MID", "MID", "ATT"],
    mid: ["MID", "DEF", "ATT"],
    late: ["GK", "DEF", "ATT", "MID"]
  },

  "Defensive Wall": {
    early: ["DEF", "DEF", "MID"],
    mid: ["DEF", "GK", "MID"],
    late: ["ATT", "MID", "DEF", "GK"]
  },

  "Star Hunter": {
    early: ["BEST"],
    mid: ["BEST"],
    late: ["BEST"]
  },

  "Goalkeeper Early": {
    early: ["GK", "ATT", "MID"],
    mid: ["DEF", "MID", "ATT"],
    late: ["DEF", "MID", "ATT", "GK"]
  }
};

const MAX_BY_POSITION = {
  GK: 2,
  DEF: 6,
  MID: 6,
  ATT: 5
};

export function chooseAIPlayer(team, availablePlayers) {
  if (!availablePlayers.length) return null;

  const pickNumber = team.players.length + 1;
  const phase = getDraftPhase(pickNumber);
  const style = STYLE_PLANS[team.playStyle] || STYLE_PLANS.Balanced;
  const plan = style[phase];

  if (plan.includes("BEST")) {
    return chooseBestWithRosterLimit(team, availablePlayers);
  }

  const wantedPosition = choosePlannedPosition(team, plan);

  let candidates = availablePlayers.filter(player =>
    player.position === wantedPosition &&
    canStillUsePosition(team, player.position)
  );

  if (candidates.length === 0) {
    candidates = availablePlayers.filter(player =>
      canStillUsePosition(team, player.position)
    );
  }

  if (candidates.length === 0) {
    candidates = availablePlayers;
  }

  candidates.sort((a, b) => b.overall - a.overall);

  return weightedRandom(candidates.slice(0, 5));
}

function getDraftPhase(pickNumber) {
  if (pickNumber <= 5) return "early";
  if (pickNumber <= 11) return "mid";
  return "late";
}

function choosePlannedPosition(team, plan) {
  const counts = countPositions(team);

  const usablePlan = plan.filter(position =>
    canStillUsePosition(team, position)
  );

  const finalPlan = usablePlan.length > 0 ? usablePlan : plan;

  const weighted = [];

  finalPlan.forEach((position, index) => {
    const baseWeight = finalPlan.length - index;
    const needBonus = Math.max(0, 3 - counts[position]);

    for (let i = 0; i < baseWeight + needBonus; i++) {
      weighted.push(position);
    }
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
}

function chooseBestWithRosterLimit(team, availablePlayers) {
  const candidates = availablePlayers
    .filter(player => canStillUsePosition(team, player.position))
    .sort((a, b) => b.overall - a.overall);

  return candidates[0] || availablePlayers.sort((a, b) => b.overall - a.overall)[0];
}

function canStillUsePosition(team, position) {
  const counts = countPositions(team);
  return counts[position] < MAX_BY_POSITION[position];
}

function countPositions(team) {
  const counts = {
    GK: 0,
    DEF: 0,
    MID: 0,
    ATT: 0
  };

  team.players.forEach(player => {
    counts[player.position]++;
  });

  return counts;
}

function weightedRandom(players) {
  if (players.length <= 1) return players[0];

  const weights = [45, 25, 15, 10, 5];
  const total = weights.slice(0, players.length).reduce((sum, weight) => sum + weight, 0);

  let random = Math.random() * total;

  for (let i = 0; i < players.length; i++) {
    random -= weights[i];

    if (random <= 0) {
      return players[i];
    }
  }

  return players[0];
}