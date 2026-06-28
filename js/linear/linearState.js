import { GAME_CONFIG } from "../config.js";

export const appState = {
  allPlayers: [],
  availablePlayers: [],
  teams: [],
  draftOrder: [],
  currentPick: 0,
  activePosition: "ALL",
  activeDraftView: "Player List",
  aiSpeed: "normal",
  draftLog: [],
  selectedFormation: "4-3-3",
  season: null,
  userMatchNumber: 0,
  lastMatch: null,
  lastOverview: "opening"
};

export function userTeam() {
  return appState.teams[GAME_CONFIG.userTeamIndex];
}

export function resetLinearState() {
  appState.allPlayers = [];
  appState.availablePlayers = [];
  appState.teams = [];
  appState.draftOrder = [];
  appState.currentPick = 0;
  appState.activePosition = "ALL";
  appState.activeDraftView = "Player List";
  appState.aiSpeed = "normal";
  appState.draftLog = [];
  appState.selectedFormation = "4-3-3";
  appState.season = null;
  appState.userMatchNumber = 0;
  appState.lastMatch = null;
  appState.lastOverview = "opening";
}
