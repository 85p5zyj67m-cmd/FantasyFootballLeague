import {
  createSeason as createTacticalSeason,
  continueAfterTactics as continueTacticalAfterTactics,
  simulateNextMatch as simulateTacticalNextMatch,
  getTeamStrength as getTacticalTeamStrength
} from "./seasonEngineTacticalLite.js?v=tactical-chain-engine-2";

const QUALITY_ANCHOR = 82;
const QUALITY_FACTOR = 0.62;

export function createSeason(teams, userTeamIndex) {
  return withCompressedPlayerQuality(teams, () => createTacticalSeason(teams, userTeamIndex));
}

export function continueAfterTactics(season) {
  return withCompressedSeasonQuality(season, () => continueTacticalAfterTactics(season));
}

export function simulateNextMatch(season) {
  return withCompressedSeasonQuality(season, () => simulateTacticalNextMatch(season));
}

export function getTeamStrength(team) {
  return withCompressedPlayerQuality([team], () => getTacticalTeamStrength(team));
}

function withCompressedSeasonQuality(season, callback) {
  const teams = collectSeasonTeams(season);
  return withCompressedPlayerQuality(teams, callback);
}

function withCompressedPlayerQuality(teams, callback) {
  const touched = [];

  teams.forEach(team => {
    (team?.players || []).forEach(player => {
      if (typeof player.overall !== "number") return;
      touched.push([player, player.overall]);
      player.overall = compressOverall(player.overall);
    });
  });

  try {
    return callback();
  } finally {
    touched.forEach(([player, originalOverall]) => {
      player.overall = originalOverall;
    });
  }
}

function compressOverall(overall) {
  return Math.round((QUALITY_ANCHOR + (overall - QUALITY_ANCHOR) * QUALITY_FACTOR) * 10) / 10;
}

function collectSeasonTeams(season) {
  const teams = new Set();
  season?.divisions?.forEach(division => {
    division.teams?.forEach(team => teams.add(team));
  });
  season?.userTeam && teams.add(season.userTeam);
  season?.nextMatch?.home && teams.add(season.nextMatch.home);
  season?.nextMatch?.away && teams.add(season.nextMatch.away);
  season?.pendingBackgroundMatches?.forEach(match => {
    match.home && teams.add(match.home);
    match.away && teams.add(match.away);
  });
  return Array.from(teams);
}
