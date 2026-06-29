import { createSeason, continueAfterTactics, simulateNextMatch } from "../seasonEngineBalanced.js?v=equal-overall-tactics-chains-1";
import { appState, userTeam } from "./linearState.js";
import { goTo } from "./linearRouter.js";

const DIVISION_NAMES = ["North", "West", "East", "South"];

export function startLinearSeason() {
  appState.season = createSeasonWithRandomUserDivision();
  appState.userMatchNumber = 0;
  appState.lastMatch = null;
  continueAfterTactics(appState.season);
  goTo("page06");
}

function createSeasonWithRandomUserDivision() {
  const targetDivisionName = DIVISION_NAMES[Math.floor(Math.random() * DIVISION_NAMES.length)];
  let fallbackSeason = null;

  for (let attempt = 0; attempt < 80; attempt++) {
    const season = createSeason(appState.teams, 0);
    fallbackSeason = season;

    const userDivision = season.divisions.find(division =>
      division.teams.includes(season.userTeam)
    );

    if (userDivision && userDivision.name === targetDivisionName) {
      season.targetDivisionName = targetDivisionName;
      return season;
    }
  }

  if (fallbackSeason) {
    fallbackSeason.targetDivisionName = targetDivisionName;
  }
  return fallbackSeason || createSeason(appState.teams, 0);
}

export function playNextLinearMatch() {
  const season = appState.season;
  if (!season) return;

  if (season.phase === "COMPLETE") {
    goTo("seasonEnd");
    return;
  }

  if (season.waitingForTactics) {
    continueAfterTactics(season);
  }

  simulateNextMatch(season);
  appState.lastMatch = season.currentMatch;
  appState.userMatchNumber += 1;

  goTo(routeForCurrentMatch());
}

export function continueAfterMatch() {
  const season = appState.season;
  if (!season) return;

  if (appState.userMatchNumber === 4 && season.phase === "SECOND_HALF") {
    appState.lastOverview = "firstHalf";
    goTo("page11");
    return;
  }

  if (appState.userMatchNumber === 8) {
    appState.lastOverview = "secondHalf";
    goTo("page16");
    return;
  }

  if (season.phase === "COMPLETE") {
    goTo("seasonEnd");
    return;
  }

  playNextLinearMatch();
}

export function routeForCurrentMatch() {
  const match = appState.lastMatch;
  const number = appState.userMatchNumber;

  if (number >= 1 && number <= 4) {
    return `page${String(6 + number).padStart(2, "0")}`;
  }

  if (number >= 5 && number <= 8) {
    return `page${String(7 + number).padStart(2, "0")}`;
  }

  if (!match) return "seasonEnd";
  if (match.round && match.round.includes("Round of 16")) return "page17";
  if (match.round && match.round.includes("Quarter")) return "page18";
  if (match.round && match.round.includes("Semi")) return "page19";
  if (match.round && match.round.includes("Final")) return "page20";

  if (appState.season.phase === "ROUND_OF_16") return "page17";
  if (appState.season.phase === "QUARTERFINALS") return "page18";
  if (appState.season.phase === "SEMIFINALS") return "page19";
  if (appState.season.phase === "FINAL") return "page20";
  return "seasonEnd";
}

export function nextMatchButtonText() {
  const season = appState.season;
  if (!season) return "Next";
  if (appState.userMatchNumber === 4) return "First Half Overview";
  if (appState.userMatchNumber === 8) return "Second Half Overview";
  if (season.phase === "COMPLETE") return "Season Statistics";
  if (season.phase === "QUARTERFINALS") return "Play Quarterfinal";
  if (season.phase === "SEMIFINALS") return "Play Semifinal";
  if (season.phase === "FINAL") return "Play Final";
  return "Play Next Match";
}

export function overviewButtonText() {
  const season = appState.season;
  if (!season) return "Play Next Match";
  if (season.phase === "COMPLETE") return "Season Statistics";
  if (season.phase === "SECOND_HALF") return "Play Second Half";
  if (season.phase === "ROUND_OF_16") return "Play Round of 16";
  return "Play Next Match";
}

export function userWonLastMatch() {
  const match = appState.lastMatch;
  return match && match.winner === userTeam();
}
