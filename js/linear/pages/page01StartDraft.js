import { loadPlayersFromCSV } from "../../csvLoader.js";
import { createTeams, createDraftOrder, selectDraftPool } from "../../draftRules.js";
import { appState, resetLinearState } from "../linearState.js";
import { goTo } from "../linearRouter.js?v=cache-fix-1";
import { clearApp, primaryButton } from "../pageUtils.js?v=pos-icons-3";

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
    <p class="start-bookmaker-subtitle">Start with the draft, build trait chains, lock your tactics and watch every matchday play out live with momentum, xG and ticker drama.</p>
    <div class="start-bookmaker-highlights" aria-label="Game highlights">
      <span>20 Teams</span>
      <span>Snake Draft</span>
      <span>Trait Chains</span>
      <span>Live Matchdays</span>
    </div>
  `;

  const ctaWrap = document.createElement("div");
  ctaWrap.className = "start-bookmaker-cta";
  const enterDraftButton = primaryButton("Enter Draft Room", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Loading players...";

    resetLinearState();
    appState.allPlayers = await loadPlayersFromCSV("data/players.csv");
    appState.teams = createTeams();
    appState.draftOrder = createDraftOrder();
    appState.availablePlayers = selectDraftPool(appState.allPlayers);

    goTo("page02");
  });
  enterDraftButton.classList.add("start-primary-focus");
  ctaWrap.appendChild(enterDraftButton);

  const ctaNote = document.createElement("p");
  ctaNote.className = "start-bookmaker-note";
  ctaNote.textContent = "Your first decision starts the whole season.";
  ctaWrap.appendChild(ctaNote);
  copy.appendChild(ctaWrap);

  const briefing = document.createElement("aside");
  briefing.className = "start-bookmaker-board start-briefing-card";
  briefing.innerHTML = `
    <div class="start-board-header">
      <span>Draft Room Briefing</span>
      <strong>Flow</strong>
    </div>
    <div class="start-odds-row start-flow-row featured">
      <span>1. Draft your squad</span>
      <strong>Pick</strong>
    </div>
    <div class="start-odds-row start-flow-row">
      <span>2. Build trait chains</span>
      <strong>Link</strong>
    </div>
    <div class="start-odds-row start-flow-row">
      <span>3. Set your tactics</span>
      <strong>Counter</strong>
    </div>
    <div class="start-ticket">
      <span>Season promise</span>
      <strong>Every pick should shape how your team plays.</strong>
    </div>
  `;

  layout.append(copy, briefing);

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

  requestAnimationFrame(() => enterDraftButton.focus({ preventScroll: true }));
}
