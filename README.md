# Fantasy Football League

A single-player fantasy football game that runs entirely in the browser: draft a squad from a pool of real-ish players, build trait synergies, lock in tactics, and play out a full season with live match simulation — snake draft, divisions, knockouts and all.

No build step, no framework, no dependencies. Plain HTML/CSS and native ES modules, loaded directly by the browser.

## Running it locally

Any static file server works, since the app loads modules via `fetch`/`import` and needs `http://`, not `file://`. For example:

```
python3 -m http.server 8123
```

Then open `http://localhost:8123/`.

## How the pieces fit together

```
index.html                  Loads all CSS, then js/linear/linearApp.js as the only <script>
data/players.csv            The player pool (name, club, nationality, overall, position, traits)
css/
  core/                     Base layout, player cards, my-team cards, mobile layout
  formations/                Formation grid + formation selector styling
  trait-chain/               Trait-chain panel, links, scroll/selection behaviour
  theme/                     Visual theme: bookmaker look, momentum colors, draft screens
js/
  (engine, framework-free)   Pure game logic — no DOM access, safe to unit-test in isolation
  linear/
    linearApp.js             Entry point: wires up the router and installs every enhancer
    linearRouter.js           Page-to-page navigation (goTo)
    linearState.js            Shared mutable app/team state
    linearStyles.js           Base runtime style injection
    pageUtils.js, seasonRenderUtils.js   Shared rendering helpers for pages/
    seasonFlow.js             Season orchestration, lazy-loaded on "Start Season"
    liveMatchSimulation.js    Drives the live match ticker/momentum UI
    enhancers/                DOM-mutating feature layers (see below)
    pages/                    One file per screen (page01StartDraft.js … page20Final.js)
```

### The engine layer (`js/*.js`)

Framework-free game logic, imported by the `linear/` app layer but with no DOM dependency of its own:

- `csvLoader.js` — parses `data/players.csv` into player objects
- `config.js` — league size, rounds, draft pool sizes
- `draftRules.js`, `aiDraft.js` — snake draft order, AI pick logic
- `formations.js`, `lineup.js`, `playerUtils.js` — formation definitions, slot placement, position matching
- `draftFormationConstraints.js` — whether a player can still be legally drafted given the formation
- `traitChainEngine.js`, `traitChains.js`, `formationChainLinks.js` — trait synergy detection between placed players
- `detailPositionEngine.js` — fine-grained position scoring
- `seasonEngineBalancedLive.js` — the season/match engine (imports `seasonEngineTacticalLite.js` for tactic-profile math)

### The app layer (`js/linear/`)

`linearApp.js` is the sole entry point loaded by `index.html`. On `DOMContentLoaded` it installs the router and then every enhancer in `enhancers/`, in a fixed order, before navigating to `page01`.

### Enhancers (`js/linear/enhancers/`)

Each enhancer is a self-contained feature that observes the DOM (via `MutationObserver`, click/drag listeners, etc.) and layers behaviour or styling on top of whatever the current page rendered. They're installed once and keep working across page navigations without the pages needing to know about them:

- `draftPolishStyles.js`, `draftSpeedController.js` — draft screen styling and pick speed control
- `formationSelectorEnhancer.js` — formation dropdown behaviour
- `draftFormationConstraintEnhancer.js` — disables draft cards that no longer fit the chosen formation
- `traitChainPanel.js` → `traitChainPositionHighlighter.js` → `traitChainShowAllToggle.js` — a three-layer chain (each wraps the previous one's `installTraitChainEnhancer`):
  1. **traitChainPanel.js** renders the "Active Chains" panel and draws the link overlay for the selected chain
  2. **traitChainPositionHighlighter.js** adds click-a-slot-to-highlight-compatible-positions
  3. **traitChainShowAllToggle.js** adds the "Show all chains" toggle and its overlay
- `matchActionTopEnhancer.js`, `liveGoalScorersEnhancer.js` — live match ticker enhancements
- `tacticsSystemEnhancer.js`, `strictPositionEnforcer.js` — tactics page behaviour, position legality
- `seasonStartBridge.js` — listens for the "Start Season" click and lazy-loads `seasonFlow.js`
- `visualUnityLayer.js` — final cross-page visual consistency pass

### Pages (`js/linear/pages/`)

One file per screen, in flow order: start → draft lottery → formation choice → draft → tactics → season stats → 14 match-day pages → knockout rounds → final → season end. `matchPageFactory.js` generates the repetitive match-day pages from a shared template.

## Notes on the codebase history

This project grew through many small iterative commits, which had left behind:

- Several fully superseded engine/UI files no longer referenced from anywhere (old season engines, an old non-modular UI layer, unused match-replay variants) — removed.
- Five outdated numbered versions of the draft-formation-constraint enhancer and the trait-chain enhancer, superseded by the versions now named `draftFormationConstraintEnhancer.js` and the `traitChainPanel/PositionHighlighter/ShowAllToggle` chain — removed, and the survivors renamed to drop the version-number naming.
- An abandoned React migration (`src/App.jsx` and friends) that was never wired into `index.html` and had no build tooling behind it — removed.

None of this changed any runtime behavior — see the git log for the cleanup commits and what was verified at each step.
