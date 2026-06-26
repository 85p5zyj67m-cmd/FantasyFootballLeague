import { GAME_CONFIG } from "./config.js";

let visibleBoard = {
  ATT: [],
  MID: [],
  DEF: [],
  GK: []
};

const VISIBLE_LIMITS = {
  ATT: 10,
  MID: 10,
  DEF: 10,
  GK: 5
};

const POOL_TIER_WEIGHTS = {
  GOAT: 0.04,
  WORLD_CLASS: 0.14,
  ELITE: 0.30,
  GOOD: 0.37,
  ROLE_PLAYER: 0.15
};

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

  for (let i = 0; i <= GAME_CONFIG.totalTeams * 8; i++) {
    if (getTeamOnClock(currentPick + i, draftOrder) === GAME_CONFIG.userTeamIndex) {
      result.push(i);
      if (result.length === 4) break;
    }
  }

  return {
    next: result[0] ?? "-",
    second: result[1] ?? "-",
    third: result[2] ?? "-",
    fourth: result[3] ?? "-"
  };
}

export function selectDraftPool(players) {
  resetVisibleBoard();

  const uniqueVersions = chooseOneVersionPerPlayer(players).map((player, index) => ({
    ...player,
    id: `${player.name}-${player.year}-${player.club}-${index}`,
    duplicateKey: normalizeName(player.name),
    tier: getTier(player.overall)
  }));

  const attackers = buildPositionPool(uniqueVersions, "ATT", GAME_CONFIG.draftPool.ATT);
  const midfielders = buildPositionPool(uniqueVersions, "MID", GAME_CONFIG.draftPool.MID);
  const defenders = buildPositionPool(uniqueVersions, "DEF", GAME_CONFIG.draftPool.DEF);
  const goalkeepers = buildPositionPool(uniqueVersions, "GK", GAME_CONFIG.draftPool.GK);

  return shuffle([
    ...attackers,
    ...midfielders,
    ...defenders,
    ...goalkeepers
  ]);
}

function chooseOneVersionPerPlayer(players) {
  const groups = {};

  players.forEach(player => {
    const key = normalizeName(player.name);
    if (!groups[key]) groups[key] = [];
    groups[key].push(player);
  });

  return Object.values(groups).map(versions => weightedVersionChoice(versions));
}

function weightedVersionChoice(versions) {
  const shuffledVersions = shuffle(versions);

  const weights = shuffledVersions.map(player => {
    if (player.overall >= 95) return 1;
    if (player.overall >= 90) return 3;
    if (player.overall >= 84) return 5;
    return 4;
  });

  return weightedPick(shuffledVersions, weights);
}

function buildPositionPool(players, position, targetAmount) {
  const positionPlayers = players.filter(player => player.position === position);

  const tiers = {
    GOAT: positionPlayers.filter(player => player.tier === "GOAT"),
    WORLD_CLASS: positionPlayers.filter(player => player.tier === "WORLD_CLASS"),
    ELITE: positionPlayers.filter(player => player.tier === "ELITE"),
    GOOD: positionPlayers.filter(player => player.tier === "GOOD"),
    ROLE_PLAYER: positionPlayers.filter(player => player.tier === "ROLE_PLAYER")
  };

  let result = [];

  Object.keys(POOL_TIER_WEIGHTS).forEach(tier => {
    const amount = Math.round(targetAmount * POOL_TIER_WEIGHTS[tier]);
    result.push(...shuffle(tiers[tier]).slice(0, amount));
  });

  if (result.length < targetAmount) {
    const usedIds = new Set(result.map(player => player.id));
    const remaining = shuffle(positionPlayers.filter(player => !usedIds.has(player.id)));
    result.push(...remaining.slice(0, targetAmount - result.length));
  }

  return shuffle(result).slice(0, targetAmount);
}

function getTier(overall) {
  if (overall >= 96) return "GOAT";
  if (overall >= 91) return "WORLD_CLASS";
  if (overall >= 86) return "ELITE";
  if (overall >= 80) return "GOOD";
  return "ROLE_PLAYER";
}

export function getVisiblePlayers(availablePlayers, activePosition) {
  cleanVisibleBoard(availablePlayers);
  refillVisibleBoard(availablePlayers);

  if (activePosition !== "ALL") {
    return [...visibleBoard[activePosition]].sort((a, b) => b.overall - a.overall);
  }

  return ["ATT", "MID", "DEF", "GK"].flatMap(position =>
    [...visibleBoard[position]].sort((a, b) => b.overall - a.overall)
  );
}

function cleanVisibleBoard(availablePlayers) {
  const availableIds = new Set(availablePlayers.map(player => player.id));

  ["ATT", "MID", "DEF", "GK"].forEach(position => {
    visibleBoard[position] = visibleBoard[position].filter(player =>
      availableIds.has(player.id)
    );
  });
}

function refillVisibleBoard(availablePlayers) {
  ["ATT", "MID", "DEF", "GK"].forEach(position => {
    while (visibleBoard[position].length < VISIBLE_LIMITS[position]) {
      const nextPlayer = drawNextVisiblePlayer(availablePlayers, position);
      if (!nextPlayer) break;
      visibleBoard[position].push(nextPlayer);
    }
  });
}

function drawNextVisiblePlayer(availablePlayers, position) {
  const alreadyVisibleIds = new Set(
    Object.values(visibleBoard).flat().map(player => player.id)
  );

  const candidates = availablePlayers.filter(player =>
    player.position === position &&
    !alreadyVisibleIds.has(player.id)
  );

  if (!candidates.length) return null;

  const goat = candidates.filter(player => player.tier === "GOAT");
  const worldClass = candidates.filter(player => player.tier === "WORLD_CLASS");
  const elite = candidates.filter(player => player.tier === "ELITE");
  const good = candidates.filter(player => player.tier === "GOOD");
  const role = candidates.filter(player => player.tier === "ROLE_PLAYER");

  const roll = Math.random();

  if (roll < 0.04 && goat.length) return randomItem(goat);
  if (roll < 0.18 && worldClass.length) return randomItem(worldClass);
  if (roll < 0.50 && elite.length) return randomItem(elite);
  if (roll < 0.85 && good.length) return randomItem(good);
  if (role.length) return randomItem(role);

  return randomItem(candidates);
}

export function draftPlayer(team, player, availablePlayers) {
  if (!player) return availablePlayers;
  if (team.players.some(p => p.id === player.id)) return availablePlayers;

  team.players.push(player);

  removePlayerFromVisibleBoard(player);

  return availablePlayers.filter(p => p.id !== player.id);
}

function removePlayerFromVisibleBoard(player) {
  if (!player || !player.position) return;

  visibleBoard[player.position] = visibleBoard[player.position].filter(
    visiblePlayer => visiblePlayer.id !== player.id
  );
}

export function isDraftComplete(currentPick, availablePlayers) {
  return currentPick >= GAME_CONFIG.totalTeams * GAME_CONFIG.totalRounds || availablePlayers.length === 0;
}

function resetVisibleBoard() {
  visibleBoard = {
    ATT: [],
    MID: [],
    DEF: [],
    GK: []
  };
}

function weightedPick(items, weights) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * total;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];

    if (random <= 0) {
      return items[i];
    }
  }

  return items[0];
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function normalizeName(name) {
  return name.toLowerCase().trim();
}

export function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}