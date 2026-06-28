import { appState, userTeam } from "./linearState.js";
import { miniCard, twoColumnRow } from "./pageUtils.js";

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
