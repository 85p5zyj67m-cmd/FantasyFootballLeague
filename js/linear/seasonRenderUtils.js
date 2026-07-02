import { appState, userTeam } from "./linearState.js";
import { miniCard, twoColumnRow } from "./pageUtils.js?v=pos-icons-5";
import { getPositionGroup } from "../playerUtils.js";
import { getFormationById } from "../formations.js";
import { getSlotsFromFormation } from "../lineup.js";

export function renderStandingsBlock() {
  installSeasonOverviewStyles();

  const wrap = document.createElement("div");
  wrap.className = "linear-grid season-standings-grid";
  const season = appState.season;
  if (!season) return wrap;

  Object.keys(season.standings).forEach(groupName => {
    const card = document.createElement("div");
    card.className = "linear-mini-card season-standings-card";

    const heading = document.createElement("h3");
    heading.textContent = `${groupName} Division`;
    card.appendChild(heading);

    season.standings[groupName].forEach((row, index) => {
      card.appendChild(createStandingsTeamRow(row, index));
    });

    wrap.appendChild(card);
  });
  return wrap;
}

function createStandingsTeamRow(row, index) {
  const isUser = row.team === userTeam();
  const item = document.createElement("div");
  item.className = isUser ? "season-standings-row own-team" : "season-standings-row";

  const rank = document.createElement("span");
  rank.className = "season-standings-rank";
  rank.textContent = String(index + 1);

  const name = document.createElement("span");
  name.className = "season-standings-name";
  name.textContent = row.team.name;

  const points = document.createElement("span");
  points.className = "season-standings-points";
  points.textContent = `${row.points} pts`;

  item.append(rank, name, points);
  return item;
}

export function renderHistoryBlock() {
  installSeasonOverviewStyles();

  const card = document.createElement("div");
  card.className = "linear-mini-card season-history-card";
  const heading = document.createElement("h3");
  heading.textContent = "My Match History";
  card.appendChild(heading);

  const season = appState.season;
  if (!season || !season.userMatchHistory.length) {
    card.appendChild(twoColumnRow("No matches yet", "-"));
    return card;
  }

  const team = userTeam();
  const phaseCounts = { "First Half": 0, "Second Half": 0 };
  season.userMatchHistory.forEach(match => {
    const isHome = match.home === team;
    const won = isHome ? match.homeGoals > match.awayGoals : match.awayGoals > match.homeGoals;
    const lost = isHome ? match.homeGoals < match.awayGoals : match.awayGoals < match.homeGoals;
    const outcome = match.knockout ? (match.winner === team ? "win" : "loss") : won ? "win" : lost ? "loss" : "draw";

    const row = document.createElement("div");
    row.className = `season-history-row ${outcome}`;

    const round = document.createElement("span");
    round.className = "season-history-round";
    round.textContent = describeMatchRound(match, phaseCounts);

    const score = document.createElement("span");
    score.className = "season-history-score";
    score.textContent = `${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name}`;

    row.append(round, score);
    card.appendChild(row);
  });
  return card;
}

function describeMatchRound(match, phaseCounts) {
  const phaseMatch = String(match.round || "").match(/^(First Half|Second Half) - Matchday \d+$/);
  if (!phaseMatch) return match.round;

  const phase = phaseMatch[1];
  phaseCounts[phase] += 1;
  return `${phase} - Matchday ${phaseCounts[phase]}`;
}

export function renderMatchSummary(match) {
  const wrap = document.createElement("div");
  wrap.className = "linear-match-summary";
  if (!match) return wrap;

  const score = document.createElement("h2");
  score.textContent = `${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name}`;
  wrap.appendChild(score);

  const stats = miniCard("Match Statistics");
  stats.appendChild(twoColumnRow("xG", `${format(match.stats.homeXg)} - ${format(match.stats.awayXg)}`));
  stats.appendChild(twoColumnRow("Shots", `${match.stats.homeShots} - ${match.stats.awayShots}`));
  stats.appendChild(twoColumnRow("Momentum", `${match.stats.homeMomentum} - ${match.stats.awayMomentum}`));
  wrap.appendChild(stats);

  const events = miniCard("Match Events");
  match.events.slice().reverse().forEach(event => {
    events.appendChild(twoColumnRow(event.text, ""));
  });
  wrap.appendChild(events);
  return wrap;
}

export function finalResultText() {
  const season = appState.season;
  if (!season) return "Season finished.";
  if (season.champion === userTeam()) return "Winner. You won the title.";
  return `Loser. ${season.eliminationReason || "Your season is over."}`;
}

function format(value) {
  return Number(value || 0).toFixed(1);
}

const SCORER_PATTERNS = [
  /through ([^.]+?)(?:\.|$)/i,
  /and ([^.]+?) scores/i,
  /and ([^.]+?) converts/i,
  /([A-ZÀ-Ÿ][^.!?]+?) gets the final touch/i,
  /([A-ZÀ-Ÿ][^.!?]+?) fires in from distance/i,
  /and ([^.]+?) finishes/i,
  /finished by ([^.]+?)(?:\.|$)/i,
  /strike through ([^.]+?)(?:\.|$)/i
];

function extractScorerName(text, teamNameValue) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();

  for (const pattern of SCORER_PATTERNS) {
    const match = cleanText.match(pattern);
    if (match?.[1]) return cleanupScorerName(match[1], teamNameValue);
  }

  return null;
}

function cleanupScorerName(value, teamNameValue) {
  const cleaned = String(value || "")
    .replace(teamNameValue, "")
    .replace(/^the\s+/i, "")
    .replace(/\s+for\s+$/i, "")
    .replace(/[.,!]+$/g, "")
    .trim();
  return cleaned || null;
}

function extractAssistName(text) {
  const match = String(text || "").match(/Assist: ([^.]+)\./);
  return match?.[1]?.trim() || null;
}

function findPlayerByName(players, name) {
  if (!name) return null;
  return players.find(p => p.name === name)
    || players.find(p => name.includes(p.name) || p.name.includes(name))
    || null;
}

function getSeasonPlayedPosition(team, player) {
  const slotKey = team?.lineup?.[player.id];
  if (!slotKey || slotKey === "BENCH") return null;

  const formation = getFormationById(team.formationId);
  const slot = getSlotsFromFormation(formation).find(s => s.key === slotKey);
  return slot?.position || null;
}

const POSITION_SORT_ORDER = { GK: 0, DEF: 1, MID: 2, ATT: 3 };

function comparePlayedPosition(a, b) {
  const groupA = POSITION_SORT_ORDER[getPositionGroup(a.player)] ?? 4;
  const groupB = POSITION_SORT_ORDER[getPositionGroup(b.player)] ?? 4;
  return groupA - groupB || b.player.overall - a.player.overall;
}

function getEventSide(text, homeName, awayName) {
  const lower = String(text || "").toLowerCase();
  const home = homeName.toLowerCase();
  const away = awayName.toLowerCase();
  const homeIndex = lower.indexOf(home);
  const awayIndex = lower.indexOf(away);

  if (homeIndex === -1 && awayIndex === -1) return null;
  if (homeIndex !== -1 && awayIndex === -1) return "home";
  if (awayIndex !== -1 && homeIndex === -1) return "away";
  return homeIndex <= awayIndex ? "home" : "away";
}

export function computeUserRecord() {
  const season = appState.season;
  const record = { wins: 0, draws: 0, losses: 0, played: 0 };
  if (!season) return record;

  const team = userTeam();
  season.userMatchHistory.forEach(match => {
    record.played += 1;
    const isHome = match.home === team;

    if (match.knockout) {
      if (match.winner === team) record.wins += 1;
      else record.losses += 1;
      return;
    }

    const goalsFor = Number(isHome ? match.homeGoals : match.awayGoals);
    const goalsAgainst = Number(isHome ? match.awayGoals : match.homeGoals);
    if (goalsFor > goalsAgainst) record.wins += 1;
    else if (goalsFor === goalsAgainst) record.draws += 1;
    else record.losses += 1;
  });

  return record;
}

export function computeSquadSeasonStats() {
  const season = appState.season;
  const team = userTeam();
  const goalsByPlayerId = new Map();
  const assistsByPlayerId = new Map();
  const yellowsByPlayerId = new Map();
  const redsByPlayerId = new Map();
  let cleanSheets = 0;

  if (season) {
    season.userMatchHistory.forEach(match => {
      const isHome = match.home === team;
      const goalsAgainst = Number(isHome ? match.awayGoals : match.homeGoals);
      if (goalsAgainst === 0) cleanSheets += 1;

      (match.events || []).forEach(event => {
        const type = String(event.type || "").toUpperCase();
        const text = String(event.text || "");

        if (type === "GOAL") {
          if (text.toLowerCase().includes("penalties")) return;
          const side = getEventSide(text, match.home.name, match.away.name);
          if (!side) return;
          const scoringTeam = side === "home" ? match.home : match.away;
          if (scoringTeam !== team) return;

          const scorer = findPlayerByName(team.players, extractScorerName(text, team.name));
          if (scorer) goalsByPlayerId.set(scorer.id, (goalsByPlayerId.get(scorer.id) || 0) + 1);

          const assister = findPlayerByName(team.players, extractAssistName(text));
          if (assister) assistsByPlayerId.set(assister.id, (assistsByPlayerId.get(assister.id) || 0) + 1);
          return;
        }

        if (type === "CARD") {
          const cardMatch = text.match(/^\d+' (Yellow|Red) card for ([^(]+) \(([^)]+)\)\.$/);
          if (!cardMatch) return;
          const [, cardType, playerName, teamName] = cardMatch;
          if (teamName.trim() !== team.name) return;
          const player = findPlayerByName(team.players, playerName.trim());
          if (!player) return;
          const target = cardType === "Red" ? redsByPlayerId : yellowsByPlayerId;
          target.set(player.id, (target.get(player.id) || 0) + 1);
        }
      });
    });
  }

  const rows = (team.players || []).map(player => {
    const group = getPositionGroup(player);
    return {
      player,
      goals: goalsByPlayerId.get(player.id) || 0,
      assists: assistsByPlayerId.get(player.id) || 0,
      yellowCards: yellowsByPlayerId.get(player.id) || 0,
      redCards: redsByPlayerId.get(player.id) || 0,
      positionPlayed: getSeasonPlayedPosition(team, player),
      cleanSheets: (group === "GK" || group === "DEF") ? cleanSheets : null
    };
  }).sort(comparePlayedPosition);

  return { rows, cleanSheets };
}

function getAllLeagueTeams() {
  const season = appState.season;
  if (!season?.divisions) return [];
  const teams = new Set();
  season.divisions.forEach(division => division.teams?.forEach(team => teams.add(team)));
  return Array.from(teams);
}

export function computeLeaguePlayerStats() {
  const season = appState.season;
  const teams = getAllLeagueTeams();
  const playersById = new Map();
  const teamByPlayerId = new Map();

  teams.forEach(team => {
    (team.players || []).forEach(player => {
      playersById.set(player.id, player);
      teamByPlayerId.set(player.id, team);
    });
  });

  const goals = new Map();
  const assists = new Map();
  const cleanSheetsByTeam = new Map();

  (season?.allResults || []).forEach(match => {
    if (!match.home?.players || !match.away?.players) return;
    if (Number(match.awayGoals) === 0) cleanSheetsByTeam.set(match.home, (cleanSheetsByTeam.get(match.home) || 0) + 1);
    if (Number(match.homeGoals) === 0) cleanSheetsByTeam.set(match.away, (cleanSheetsByTeam.get(match.away) || 0) + 1);

    (match.events || []).forEach(event => {
      if (String(event.type || "").toUpperCase() !== "GOAL") return;
      const text = String(event.text || "");
      if (text.toLowerCase().includes("penalties")) return;

      const side = getEventSide(text, match.home.name, match.away.name);
      if (!side) return;
      const scoringTeam = side === "home" ? match.home : match.away;

      const scorer = findPlayerByName(scoringTeam.players, extractScorerName(text, scoringTeam.name));
      if (scorer) goals.set(scorer.id, (goals.get(scorer.id) || 0) + 1);

      const assister = findPlayerByName(scoringTeam.players, extractAssistName(text));
      if (assister) assists.set(assister.id, (assists.get(assister.id) || 0) + 1);
    });
  });

  return { playersById, teamByPlayerId, goals, assists, cleanSheetsByTeam };
}

function bestPlayerByStat(stats, group, statMap) {
  let best = null;
  stats.playersById.forEach((player, id) => {
    if (group && getPositionGroup(player) !== group) return;
    const value = statMap.get(id) || 0;
    if (!best || value > best.value || (value === best.value && player.overall > best.player.overall)) {
      best = { player, value, team: stats.teamByPlayerId.get(id) };
    }
  });
  return best;
}

function bestPlayerByOverall(stats, group) {
  let best = null;
  stats.playersById.forEach((player, id) => {
    if (group && getPositionGroup(player) !== group) return;
    if (!best || player.overall > best.player.overall) {
      best = { player, team: stats.teamByPlayerId.get(id) };
    }
  });
  return best;
}

export function computeSeasonAwards() {
  const team = userTeam();
  const season = appState.season;
  const leagueStats = computeLeaguePlayerStats();

  const bestPlayer = bestPlayerByOverall(leagueStats, null);
  const bestAttacker = bestPlayerByOverall(leagueStats, "ATT");
  const bestMidfielder = bestPlayerByOverall(leagueStats, "MID");
  const bestDefender = bestPlayerByOverall(leagueStats, "DEF");
  const topScorer = bestPlayerByStat(leagueStats, null, leagueStats.goals);
  const topAssist = bestPlayerByStat(leagueStats, null, leagueStats.assists);

  let goldenGlove = null;
  leagueStats.playersById.forEach((player, id) => {
    if (getPositionGroup(player) !== "GK") return;
    const gkTeam = leagueStats.teamByPlayerId.get(id);
    const sheets = leagueStats.cleanSheetsByTeam.get(gkTeam) || 0;
    if (!goldenGlove || sheets > goldenGlove.value || (sheets === goldenGlove.value && player.overall > goldenGlove.player.overall)) {
      goldenGlove = { player, team: gkTeam, value: sheets };
    }
  });

  let bestManagerTeam = null;
  let bestManagerPoints = -1;
  Object.values(season?.standings || {}).forEach(rows => {
    rows.forEach(row => {
      if (row.points > bestManagerPoints) {
        bestManagerPoints = row.points;
        bestManagerTeam = row.team;
      }
    });
  });

  return {
    bestPlayer: bestPlayer ? { player: bestPlayer.player, team: bestPlayer.team, note: `${bestPlayer.player.overall} OVR` } : null,
    topScorer: topScorer?.value ? { player: topScorer.player, team: topScorer.team, note: `${topScorer.value} goal${topScorer.value === 1 ? "" : "s"}` } : null,
    topAssist: topAssist?.value ? { player: topAssist.player, team: topAssist.team, note: `${topAssist.value} assist${topAssist.value === 1 ? "" : "s"}` } : null,
    goldenGlove: goldenGlove ? { player: goldenGlove.player, team: goldenGlove.team, note: `${goldenGlove.value} clean sheet${goldenGlove.value === 1 ? "" : "s"}` } : null,
    bestAttacker: bestAttacker ? { player: bestAttacker.player, team: bestAttacker.team, note: `${bestAttacker.player.overall} OVR` } : null,
    bestMidfielder: bestMidfielder ? { player: bestMidfielder.player, team: bestMidfielder.team, note: `${bestMidfielder.player.overall} OVR` } : null,
    bestDefender: bestDefender ? { player: bestDefender.player, team: bestDefender.team, note: `${bestDefender.player.overall} OVR` } : null,
    manager: bestManagerTeam ? { team: bestManagerTeam, note: `${bestManagerPoints} points${bestManagerTeam === team ? " - that's you!" : ""}` } : null
  };
}

function installSeasonOverviewStyles() {
  if (document.getElementById("seasonOverviewStyles")) return;

  const style = document.createElement("style");
  style.id = "seasonOverviewStyles";
  style.textContent = `
    .season-standings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 12px;
    }

    .season-standings-card {
      display: grid;
      gap: 6px;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(209, 179, 110, 0.28);
      background: linear-gradient(180deg, #13251a, #07110d);
    }

    .season-standings-card h3 {
      margin: 0 0 2px;
      color: #f2d68a;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .season-standings-row {
      display: grid;
      grid-template-columns: 22px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .season-standings-row.own-team {
      border-color: rgba(217, 167, 61, .6);
      background: linear-gradient(180deg, rgba(240, 212, 138, .18), rgba(112, 68, 31, .12));
    }

    .season-standings-rank {
      color: #a8c9b3;
      font-size: 11px;
      font-weight: 800;
      text-align: center;
    }

    .season-standings-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #f3ead7;
      font-size: 12.5px;
      font-weight: 700;
    }

    .season-standings-row.own-team .season-standings-name {
      color: #fff2c2;
      font-weight: 800;
    }

    .season-standings-points {
      color: #d1b36e;
      font-size: 11.5px;
      font-weight: 800;
      white-space: nowrap;
    }

    .season-history-card {
      display: grid;
      gap: 6px;
    }

    .season-history-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 10px;
      border-left: 3px solid #71717a;
      background: rgba(255, 255, 255, 0.03);
    }

    .season-history-row.win { border-left-color: #22c55e; }
    .season-history-row.draw { border-left-color: #d1b36e; }
    .season-history-row.loss { border-left-color: #ef4444; }

    .season-history-round {
      color: #a8c9b3;
      font-size: 11px;
      font-weight: 700;
    }

    .season-history-score {
      color: #f3ead7;
      font-size: 12.5px;
      font-weight: 700;
    }

    html body .season-overview-cta.season-overview-cta {
      min-height: 56px !important;
      padding: 0 26px !important;
      font-size: 16px !important;
    }

    @media (max-width: 560px) {
      html body .season-overview-cta.season-overview-cta {
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
}
