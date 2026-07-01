import { loadPlayersFromCSV } from "../../csvLoader.js";
import { createTeams, createDraftOrder, selectDraftPool } from "../../draftRules.js";
import { appState, resetLinearState } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, primaryButton } from "../pageUtils.js";

export function renderPage01StartDraft() {
  const app = clearApp();

  const section = document.createElement("section");
  section.className = "linear-page start-bookmaker-page";

  const hero = document.createElement("div");
  hero.className = "start-bookmaker-hero";

  const topLine = document.createElement("div");
  topLine.className = "start-bookmaker-topline";
  topLine.innerHTML = `
    <span>Fantasy Football League</span>
    <span>Draft Room Open</span>
  `;

  const layout = document.createElement("div");
  layout.className = "start-bookmaker-layout";

  const copy = document.createElement("div");
  copy.className = "start-bookmaker-copy";
  copy.innerHTML = `
    <p class="eyebrow start-kicker">Old school bookmaker draft night</p>
    <h1>Build your dynasty under the lights.</h1>
    <p class="start-bookmaker-subtitle">Step into a smoky sports bar draft room, read the board, trust your football eye and assemble a squad built for tactics, traits and playoff pressure.</p>
    <div class="start-bookmaker-highlights" aria-label="Game highlights">
      <span>20 Teams</span>
      <span>Snake Draft</span>
      <span>Trait Chains</span>
      <span>Live Matchdays</span>
    </div>
  `;

  const ctaWrap = document.createElement("div");
  ctaWrap.className = "start-bookmaker-cta";
  ctaWrap.appendChild(primaryButton("Enter Draft Room", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Loading players...";

    resetLinearState();
    appState.allPlayers = await loadPlayersFromCSV("players.csv");
    appState.teams = createTeams();
    appState.draftOrder = createDraftOrder();
    appState.availablePlayers = selectDraftPool(appState.allPlayers);

    goTo("page02");
  }));

  const ctaNote = document.createElement("p");
  ctaNote.className = "start-bookmaker-note";
  ctaNote.textContent = "No second chances. Every pick changes the market.";
  ctaWrap.appendChild(ctaNote);
  copy.appendChild(ctaWrap);

  const board = document.createElement("aside");
  board.className = "start-bookmaker-board";
  board.innerHTML = `
    <div class="start-board-header">
      <span>Tonight's Board</span>
      <strong>Live Odds</strong>
    </div>
    <div class="start-odds-row featured">
      <span>Elite ST run</span>
      <strong>2.10</strong>
    </div>
    <div class="start-odds-row">
      <span>Midfield control</span>
      <strong>1.85</strong>
    </div>
    <div class="start-odds-row">
      <span>Trait chain value</span>
      <strong>3.40</strong>
    </div>
    <div class="start-ticket">
      <span>Manager slip</span>
      <strong>Pick smart. Counter harder.</strong>
    </div>
  `;

  layout.append(copy, board);

  const bottom = document.createElement("div");
  bottom.className = "start-bookmaker-bottom";
  bottom.innerHTML = `
    <div>
      <strong>Draft</strong>
      <span>Build your squad from legends and role players.</span>
    </div>
    <div>
      <strong>Tactics</strong>
      <span>Lock in plans that counter your next opponent.</span>
    </div>
    <div>
      <strong>Matchday</strong>
      <span>Watch momentum, xG, ticker events and goals unfold live.</span>
    </div>
  `;

  hero.append(topLine, layout, bottom);
  section.appendChild(hero);
  app.appendChild(section);
}
