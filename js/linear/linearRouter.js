import { renderPage01StartDraft } from "./pages/page01StartDraft.js?v=start-bookmaker-1";
import { renderPage02DraftPosition } from "./pages/page02DraftPosition.js?v=casino-reel-1";
import { renderPage03YourSystem } from "./pages/page03YourSystem.js?v=page-flow-polish-1";
import { renderPage04Draft } from "./pages/page04Draft.js?v=formation-draft-constraints-1";
import { renderPage05Tactics } from "./pages/page05Tactics.js?v=real-overall-system-balance-3";
import { renderPage06SeasonStats } from "./pages/page06SeasonStats.js?v=real-overall-system-balance-3";
import { renderPage07Match1 } from "./pages/page07Match1.js?v=second-half-route-2";
import { renderPage08Match2 } from "./pages/page08Match2.js?v=second-half-route-2";
import { renderPage09Match3 } from "./pages/page09Match3.js?v=second-half-route-2";
import { renderPage10Match4 } from "./pages/page10Match4.js?v=second-half-route-2";
import { renderPage11FirstHalfOverview } from "./pages/page11FirstHalfOverview.js?v=english-ui-1";
import { renderPage12Match5 } from "./pages/page12Match5.js?v=second-half-route-2";
import { renderPage13Match6 } from "./pages/page13Match6.js?v=second-half-route-2";
import { renderPage14Match7 } from "./pages/page14Match7.js?v=second-half-route-2";
import { renderPage15Match8 } from "./pages/page15Match8.js?v=second-half-route-2";
import { renderPage16SecondHalfOverview } from "./pages/page16SecondHalfOverview.js?v=english-ui-1";
import { renderPage17RoundOf16 } from "./pages/page17RoundOf16.js?v=second-half-route-2";
import { renderPage18QuarterFinal } from "./pages/page18QuarterFinal.js?v=second-half-route-2";
import { renderPage19SemiFinal } from "./pages/page19SemiFinal.js?v=second-half-route-2";
import { renderPage20Final } from "./pages/page20Final.js?v=second-half-route-2";
import { renderSeasonEndPage } from "./pages/seasonEndPage.js?v=second-half-route-2";

const routes = {
  page01: renderPage01StartDraft,
  page02: renderPage02DraftPosition,
  page03: renderPage03YourSystem,
  page04: renderPage04Draft,
  page05: renderPage05Tactics,
  page06: renderPage06SeasonStats,
  page07: renderPage07Match1,
  page08: renderPage08Match2,
  page09: renderPage09Match3,
  page10: renderPage10Match4,
  page11: renderPage11FirstHalfOverview,
  page12: renderPage12Match5,
  page13: renderPage13Match6,
  page14: renderPage14Match7,
  page15: renderPage15Match8,
  page16: renderPage16SecondHalfOverview,
  page17: renderPage17RoundOf16,
  page18: renderPage18QuarterFinal,
  page19: renderPage19SemiFinal,
  page20: renderPage20Final,
  seasonEnd: renderSeasonEndPage
};

export function goTo(routeName) {
  const render = routes[routeName];
  if (!render) {
    throw new Error(`Unknown route: ${routeName}`);
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
