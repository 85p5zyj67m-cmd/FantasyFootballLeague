import { goTo } from "./linearRouter.js?v=draft-status-hidden-2";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./enhancers/draftPolishStyles.js?v=default-fast-green-draft-1";
import { installDraftSpeedController } from "./enhancers/draftSpeedController.js?v=instant-draft-batch-1";
import { installFormationSelectorEnhancer } from "./enhancers/formationSelectorEnhancer.js?v=formation-links-1";
import { installDraftFormationConstraintEnhancer } from "./enhancers/draftFormationConstraintEnhancer.js?v=draft-status-hidden-2";
import { installTraitChainEnhancer } from "./enhancers/traitChainShowAllToggle.js?v=show-all-control-robust-1";
import { installMatchActionTopEnhancer } from "./enhancers/matchActionTopEnhancer.js?v=page-flow-polish-1";
import { installLiveGoalScorersEnhancer } from "./enhancers/liveGoalScorersEnhancer.js?v=goal-ball-only-1";
import { installTacticsSystemEnhancer } from "./enhancers/tacticsSystemEnhancer.js?v=english-ui-1";
import { installStrictPositionEnforcer } from "./enhancers/strictPositionEnforcer.js?v=strict-cdm-1";
import { installSeasonStartBridge } from "./enhancers/seasonStartBridge.js?v=detailed-position-engine-1";
import { installVisualUnityLayer } from "./enhancers/visualUnityLayer.js?v=draft-desktop-final-1";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  installDraftSpeedController();
  installFormationSelectorEnhancer();
  installDraftFormationConstraintEnhancer();
  installTraitChainEnhancer();
  installMatchActionTopEnhancer();
  installLiveGoalScorersEnhancer();
  installTacticsSystemEnhancer();
  installStrictPositionEnforcer();
  installSeasonStartBridge();
  installVisualUnityLayer();
  document.getElementById("compact-draft-runtime-layer")?.remove();
  installForcedDraftLayout();
  goTo("page01");
});

function installForcedDraftLayout() {
  const cssProp = prop => prop.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
  const set = (node, prop, value) => node?.style?.setProperty(cssProp(prop), value, "important");
  const setAll = (selector, styles) => {
    document.querySelectorAll(selector).forEach(node => {
      Object.entries(styles).forEach(([prop, value]) => set(node, prop, value));
    });
  };

  const apply = () => {
    const page = document.querySelector(".linear-draft-page");
    if (!page) return;

    const desktop = window.matchMedia("(min-width: 901px)").matches;
    page.classList.add("draft-final-forced");

    /* Shared final chrome: thin elegant borders on cards, menus, counters and draft panels. */
    setAll(".linear-draft-page .linear-card, .linear-draft-page .linear-draft-view, .linear-draft-page .linear-draft-tabs, .linear-draft-page .linear-round-picks, .linear-draft-page .linear-order-ticker, .linear-draft-page .linear-speed-box, .linear-draft-page .linear-counter-pill, .linear-draft-page .linear-mini-card, .linear-draft-page .active-chains-panel", {
      border: "1px solid rgba(240, 223, 184, .18)",
      outline: "1px solid rgba(217, 167, 61, .28)",
      outlineOffset: "0",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.045), 0 8px 20px rgba(0,0,0,.30)"
    });

    setAll(".linear-draft-page .linear-draft-tabs button, .linear-draft-page .linear-tab-btn, .linear-draft-page .position-filter-btn, .linear-draft-page .chip, .linear-draft-page .main-tab, .linear-draft-page .view-toggle-btn, .linear-draft-page .linear-order-ticker span", {
      border: "1px solid rgba(217, 167, 61, .32)",
      outline: "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.045), 0 5px 12px rgba(0,0,0,.24)"
    });

    setAll(".linear-draft-page .linear-player-card, .linear-draft-page .draft-list-player-card, .linear-draft-page .player-card, .linear-draft-page .my-team-card, .linear-draft-page .linear-info-player-card", {
      outline: "1px solid rgba(217, 167, 61, .28)",
      outlineOffset: "0",
      border: "1px solid rgba(240, 223, 184, .18)",
      borderRadius: "14px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.045), 0 8px 20px rgba(0,0,0,.30)"
    });

    setAll(".linear-draft-page .linear-player-card:hover, .linear-draft-page .draft-list-player-card:hover, .linear-draft-page .player-card:hover, .linear-draft-page .my-team-card:hover, .linear-draft-page .linear-info-player-card:hover", {
      outline: "1px solid rgba(242, 204, 107, .58)",
      border: "1px solid rgba(242, 204, 107, .42)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.07), 0 10px 24px rgba(0,0,0,.36)"
    });

    if (!desktop) {
      page.classList.add("draft-mobile-final-forced");

      setAll(".linear-draft-page .linear-player-grid", {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
        gap: "10px"
      });

      setAll(".linear-draft-page .linear-player-card, .linear-draft-page .draft-list-player-card", {
        minHeight: "116px",
        padding: "10px 11px"
      });

      setAll(".linear-draft-page .draft-list-name, .linear-draft-page .linear-player-name", {
        display: "-webkit-box",
        fontSize: "15px",
        lineHeight: "1.1",
        whiteSpace: "normal",
        overflow: "hidden",
        textOverflow: "ellipsis",
        WebkitLineClamp: "2",
        WebkitBoxOrient: "vertical"
      });

      return;
    }

    page.classList.add("draft-desktop-final-forced");

    set(page, "width", "min(1180px, calc(100% - 28px))");
    set(page, "paddingTop", "8px");

    setAll(".linear-draft-page .linear-draft-card", {
      gap: "10px",
      padding: "16px 18px 18px"
    });

    setAll(".linear-draft-page .linear-draft-topbar", {
      minHeight: "78px",
      height: "auto",
      maxHeight: "none",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "center",
      gap: "16px",
      padding: "8px 12px"
    });

    setAll(".linear-draft-page .linear-draft-topbar .eyebrow", {
      fontSize: "12px",
      lineHeight: "1"
    });

    setAll(".linear-draft-page .linear-draft-topbar h1", {
      fontSize: "clamp(42px, 4vw, 54px)",
      lineHeight: ".9"
    });

    setAll(".linear-draft-page .linear-on-clock", {
      fontSize: "15px",
      lineHeight: "1.05"
    });

    setAll(".linear-draft-page .linear-speed-box", {
      minWidth: "142px",
      maxWidth: "150px",
      padding: "9px 11px"
    });

    setAll(".linear-draft-page .linear-speed-box span, .linear-draft-page .linear-speed-box select", {
      fontSize: "13px"
    });

    setAll(".linear-draft-page .linear-speed-box select", {
      minHeight: "32px",
      height: "32px"
    });

    setAll(".linear-draft-page .linear-counter-block", {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, .85fr)",
      gap: "10px",
      minHeight: "44px"
    });

    setAll(".linear-draft-page .linear-round-counter", {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "10px",
      minHeight: "44px"
    });

    setAll(".linear-draft-page .linear-counter-pill", {
      minHeight: "44px",
      height: "44px",
      padding: "5px 8px 5px 12px",
      gap: "8px"
    });

    setAll(".linear-draft-page .linear-counter-pill span", {
      fontSize: "11px"
    });

    setAll(".linear-draft-page .linear-counter-pill strong", {
      minWidth: "34px",
      minHeight: "34px",
      width: "34px",
      height: "34px",
      fontSize: "19px"
    });

    setAll(".linear-draft-page .linear-round-picks, .linear-draft-page .linear-order-ticker", {
      minHeight: "42px",
      height: "42px",
      fontSize: "14px"
    });

    setAll(".linear-draft-page .linear-order-ticker span", {
      fontSize: "13px",
      padding: "6px 12px"
    });

    setAll(".linear-draft-page .linear-draft-tabs", {
      minHeight: "52px",
      height: "52px",
      gap: "10px",
      padding: "7px 9px"
    });

    setAll(".linear-draft-page .linear-draft-tabs button", {
      minHeight: "38px",
      height: "38px",
      padding: "8px 16px",
      fontSize: "14px"
    });

    setAll(".linear-draft-page .linear-draft-view", {
      padding: "16px",
      gap: "12px"
    });

    setAll(".linear-draft-page .linear-player-grid", {
      display: "grid",
      gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
      gap: "16px"
    });

    setAll(".linear-draft-page .linear-player-card, .linear-draft-page .draft-list-player-card", {
      minHeight: "172px",
      padding: "14px 15px"
    });

    setAll(".linear-draft-page .draft-list-name, .linear-draft-page .linear-player-name", {
      display: "-webkit-box",
      fontSize: "18px",
      lineHeight: "1.12",
      whiteSpace: "normal",
      overflow: "hidden",
      textOverflow: "ellipsis",
      WebkitLineClamp: "2",
      WebkitBoxOrient: "vertical"
    });

    setAll(".linear-draft-page .draft-list-club, .linear-draft-page .draft-list-nationality", {
      fontSize: "13px",
      lineHeight: "1.2",
      whiteSpace: "normal",
      overflow: "visible",
      textOverflow: "clip"
    });
  };

  apply();
  window.addEventListener("resize", apply);
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
}
