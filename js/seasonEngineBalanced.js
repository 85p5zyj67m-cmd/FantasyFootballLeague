import {
  createSeason as liveCreateSeason,
  continueAfterTactics as liveContinueAfterTactics,
  simulateNextMatch as liveSimulateNextMatch,
  getTeamStrength as liveGetTeamStrength
} from "./seasonEngineBalancedLive.js?v=live-balanced-engine-1";

export function createSeason(teams, userTeamIndex) {
  return liveCreateSeason(teams, userTeamIndex);
}

export function continueAfterTactics(season) {
  return liveContinueAfterTactics(season);
}

export function simulateNextMatch(season) {
  return liveSimulateNextMatch(season);
}

export function getTeamStrength(team) {
  return liveGetTeamStrength(team);
}
