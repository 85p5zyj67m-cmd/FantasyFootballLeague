import { GAME_CONFIG } from "./config.js";

export function createTeams() {
  return [...Array(GAME_CONFIG.totalTeams)].map((_, i) => ({
    name: i === GAME_CONFIG.userTeamIndex ? "Your Team" : "AI Team " + i,
    players: [],
    formationId: "4-3-3",
    lineup: {},
    playStyle: "Balanced"
  }));
}

export function createDraftOrder() {
  return shuffle([...Array(GAME_CONFIG.totalTeams).keys()]);
}

export function getRound(currentPick) {
  return Math.floor(currentPick / GAME_CONFIG.totalTeams) + 1;
}

export function getPickInRound(currentPick) {
  return currentPick % GAME_CONFIG.totalTeams;
}

export function getOrderThisRound(currentPick, draftOrder) {
  const round = getRound(currentPick);
  return round % 2 === 1 ? draftOrder : [...draftOrder].reverse();
}

export function getTeamOnClock(currentPick, draftOrder) {
  return getOrderThisRound(currentPick, draftOrder)[getPickInRound(currentPick)];
}

export function getUserDraftPosition(draftOrder) {
  return draftOrder.indexOf(GAME_CONFIG.userTeamIndex) + 1;
}

export function getNextUserPickDistances(currentPick, draftOrder) {
  const result = [];

  for (let i = 0; i <= GAME_CONFIG.totalTeams * 6; i++) {
    const team = getTeamOnClock(currentPick + i, draftOrder);

    if (team === GAME_CONFIG.userTeamIndex) {
      result.push(i);
      if (result.length === 3) break;
    }
  }

  return {
    next: result[0] ?? "-",
    second: result[1] ?? "-",
    third: result[2] ?? "-"
  };
}

export function selectDraftPool(players) {
  const attackers = shuffle(players.filter(p => p.position === "ATT")).slice(0, GAME_CONFIG.draftPool.ATT);
  const midfielders = shuffle(players.filter(p => p.position === "MID")).slice(0, GAME_CONFIG.draftPool.MID);
  const defenders = shuffle(players.filter(p => p.position === "DEF")).slice(0, GAME_CONFIG.draftPool.DEF);
  const goalkeepers = shuffle(players.filter(p => p.position === "GK")).slice(0, GAME_CONFIG.draftPool.GK);

  return addUniqueIds(shuffle([...attackers, ...midfielders, ...defenders, ...goalkeepers]));
}

function addUniqueIds(players) {
  return players.map((p, index) => ({
    ...p,
    id: `${p.name}-${p.year}-${p.club}-${index}`
  }));
}

export function getVisiblePlayers(availablePlayers, activePosition) {
  if (activePosition !== "ALL") {
    return availablePlayers
      .filter(p => p.position === activePosition)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, GAME_CONFIG.visiblePlayersPerPosition);
  }

  return ["ATT", "MID", "DEF", "GK"].flatMap(pos =>
    availablePlayers
      .filter(p => p.position === pos)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, GAME_CONFIG.visiblePlayersPerPosition)
  );
}

export function draftPlayer(team, player, availablePlayers) {
  if (!player) return availablePlayers;
  if (team.players.some(p => p.id === player.id)) return availablePlayers;

  team.players.push(player);
  return availablePlayers.filter(p => p.id !== player.id);
}

export function isDraftComplete(currentPick, availablePlayers) {
  return currentPick >= GAME_CONFIG.totalTeams * GAME_CONFIG.totalRounds || availablePlayers.length === 0;
}

export function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
