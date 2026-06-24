const STYLE_TARGETS = {
  Balanced: {
    GK: 2,
    DEF: 5,
    MID: 5,
    ATT: 4,
    priority: ["MID", "ATT", "DEF", "GK"]
  },

  Attacking: {
    GK: 1,
    DEF: 4,
    MID: 5,
    ATT: 6,
    priority: ["ATT", "ATT", "MID", "DEF", "GK"]
  },

  "Midfield Control": {
    GK: 1,
    DEF: 4,
    MID: 7,
    ATT: 4,
    priority: ["MID", "MID", "ATT", "DEF", "GK"]
  },

  "Defensive Wall": {
    GK: 2,
    DEF: 7,
    MID: 4,
    ATT: 3,
    priority: ["DEF", "GK", "MID", "ATT"]
  },

  "Star Hunter": {
    GK: 1,
    DEF: 5,
    MID: 5,
    ATT: 5,
    priority: ["BEST"]
  },

  "Goalkeeper Early": {
    GK: 2,
    DEF: 5,
    MID: 5,
    ATT: 4,
    priority: ["GK", "ATT", "MID", "DEF"]
  }
};

export function chooseAIPlayer(team, availablePlayers) {
  if (!availablePlayers.length) return null;

  const style = STYLE_TARGETS[team.playStyle] || STYLE_TARGETS.Balanced;

  if (style.priority.includes("BEST")) {
    return getBestAvailable(availablePlayers);
  }

  const neededPosition = choosePositionByStyle(team, style);
  let candidates = availablePlayers.filter(player => player.position === neededPosition);

  if (candidates.length === 0) {
    candidates = availablePlayers;
  }

  candidates.sort((a, b) => b.overall - a.overall);

  const topCandidates = candidates.slice(0, 4);
  return weightedRandom(topCandidates);
}

function choosePositionByStyle(team, style) {
  const counts = countPositions(team);

  const needed = style.priority
    .map(position => ({
      position,
      missing: style[position] - counts[position]
    }))
    .filter(item => item.missing > 0);

  if (needed.length === 0) {
    return getLowestCountPosition(counts);
  }

  const weighted = [];

  needed.forEach(item => {
    for (let i = 0; i < item.missing; i++) {
      weighted.push(item.position);
    }
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
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

function getLowestCountPosition(counts) {
  return Object.keys(counts).sort((a, b) => counts[a] - counts[b])[0];
}

function getBestAvailable(players) {
  return [...players].sort((a, b) => b.overall - a.overall)[0];
}

function weightedRandom(players) {
  if (players.length === 1) return players[0];

  const weights = [50, 25, 15, 10];
  const availableWeights = weights.slice(0, players.length);
  const total = availableWeights.reduce((sum, weight) => sum + weight, 0);

  let random = Math.random() * total;

  for (let i = 0; i < players.length; i++) {
    random -= availableWeights[i];

    if (random <= 0) {
      return players[i];
    }
  }

  return players[0];
}