const SQUAD_TARGETS = {
  GK: 2,
  DEF: 5,
  MID: 5,
  ATT: 4
};

export function chooseAIPlayer(team, availablePlayers) {
  const position = getMostNeededPosition(team);
  let candidates = availablePlayers.filter(p => p.position === position);

  if (candidates.length === 0) {
    candidates = availablePlayers;
  }

  candidates.sort((a, b) => b.overall - a.overall);
  return candidates[0];
}

function getMostNeededPosition(team) {
  const counts = { GK: 0, DEF: 0, MID: 0, ATT: 0 };

  team.players.forEach(p => {
    counts[p.position]++;
  });

  return Object.keys(SQUAD_TARGETS)
    .map(position => ({
      position,
      missing: SQUAD_TARGETS[position] - counts[position]
    }))
    .filter(item => item.missing > 0)
    .sort((a, b) => b.missing - a.missing)[0]?.position || "ATT";
}
