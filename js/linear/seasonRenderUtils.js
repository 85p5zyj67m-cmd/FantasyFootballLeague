import { appState, userTeam } from "./linearState.js";
import { miniCard, twoColumnRow } from "./pageUtils.js?v=pos-icons-3";
import { getPositionGroup } from "../playerUtils.js";

export function renderStandingsBlock() {
  const wrap = document.createElement("div");
  wrap.className = "linear-grid";
  const season = appState.season;
  if (!season) return wrap;

  Object.keys(season.standings).forEach(groupName => {
    const card = miniCard(groupName);
    season.standings[groupName].forEach((row, index) => {
      const suffix = row.team === userTeam() ? "  (You)" : "";
      card.appendChild(twoColumnRow(`${index + 1}. ${row.team.name}${suffix}`, `${row.points} pts`));
    });
    wrap.appendChild(card);
  });
  return wrap;
}

export function renderHistoryBlock() {
  const card = miniCard("My Match History");
  const season = appState.season;
  if (!season || !season.userMatchHistory.length) {
    card.appendChild(twoColumnRow("No matches yet", "-"));
    return card;
  }

  season.userMatchHistory.forEach(match => {
    card.appendChild(twoColumnRow(match.round, `${match.home.name} ${match.homeGoals} - ${match.awayGoals} ${match.away.name}`));
  });
  return card;
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
  let cleanSheets = 0;

  if (season) {
    season.userMatchHistory.forEach(match => {
      const isHome = match.home === team;
      const goalsAgainst = Number(isHome ? match.awayGoals : match.homeGoals);
      if (goalsAgainst === 0) cleanSheets += 1;

      (match.events || []).forEach(event => {
        if (String(event.type || "").toUpperCase() !== "GOAL") return;
        const text = String(event.text || "");
        if (text.toLowerCase().includes("penalties")) return;

        const side = getEventSide(text, match.home.name, match.away.name);
        if (!side) return;
        const scoringTeam = side === "home" ? match.home : match.away;
        if (scoringTeam !== team) return;

        const scorerName = extractScorerName(text, team.name);
        if (!scorerName) return;

        const player = team.players.find(p => p.name === scorerName)
          || team.players.find(p => scorerName.includes(p.name) || p.name.includes(scorerName));
        if (!player) return;

        goalsByPlayerId.set(player.id, (goalsByPlayerId.get(player.id) || 0) + 1);
      });
    });
  }

  const rows = (team.players || []).map(player => {
    const group = getPositionGroup(player);
    return {
      player,
      goals: goalsByPlayerId.get(player.id) || 0,
      cleanSheets: (group === "GK" || group === "DEF") ? cleanSheets : null
    };
  }).sort((a, b) => b.goals - a.goals || b.player.overall - a.player.overall);

  return { rows, cleanSheets };
}

export function computeSeasonAwards() {
  const team = userTeam();
  const { rows, cleanSheets } = computeSquadSeasonStats();
  const record = computeUserRecord();
  const season = appState.season;

  const topScorerRow = rows.find(row => row.goals > 0);
  const bestPlayer = (team.players || []).slice().sort((a, b) => b.overall - a.overall)[0];
  const bestKeeper = (team.players || []).filter(p => getPositionGroup(p) === "GK").sort((a, b) => b.overall - a.overall)[0];
  const bestMidfielder = (team.players || []).filter(p => getPositionGroup(p) === "MID").sort((a, b) => b.overall - a.overall)[0];

  const isChampion = season?.champion === team;
  const managerNote = isChampion
    ? "Champions. A season to remember."
    : record.wins >= record.losses
      ? "A solid campaign with room to grow next season."
      : "A tough season - back to the drawing board.";

  return {
    bestPlayer: bestPlayer ? { player: bestPlayer, note: `${bestPlayer.overall} OVR - the standout performer of your squad.` } : null,
    topScorer: topScorerRow ? { player: topScorerRow.player, note: `${topScorerRow.goals} goal${topScorerRow.goals === 1 ? "" : "s"} this season.` } : null,
    goldenGlove: bestKeeper ? { player: bestKeeper, note: `${cleanSheets} clean sheet${cleanSheets === 1 ? "" : "s"} behind this defense.` } : null,
    playmaker: bestMidfielder ? { player: bestMidfielder, note: "Pulled the strings through midfield all season." } : null,
    manager: { note: managerNote }
  };
}
