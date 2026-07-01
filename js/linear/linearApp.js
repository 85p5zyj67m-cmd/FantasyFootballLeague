import { goTo } from "./linearRouter.js?v=draft-status-hidden-2";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js?v=default-fast-green-draft-1";
import { installDraftSpeedController } from "./draftSpeedController.js?v=instant-draft-batch-1";
import { installFormationSelectorEnhancer } from "./formationSelectorEnhancer.js?v=formation-links-1";
import { installDraftFormationConstraintEnhancer } from "./draftFormationConstraintEnhancerV6.js?v=draft-status-hidden-2";
import { installTraitChainEnhancer } from "./traitChainEnhancerCompleteV6.js?v=show-all-control-robust-1";
import { installMatchActionTopEnhancer } from "./matchActionTopEnhancer.js?v=page-flow-polish-1";
import { installLiveGoalScorersEnhancer } from "./liveGoalScorersEnhancer.js?v=goal-ball-only-1";
import { installTacticsSystemEnhancer } from "./tacticsSystemEnhancer.js?v=english-ui-1";
import { installStrictPositionEnforcer } from "./strictPositionEnforcer.js?v=strict-cdm-1";
import { installSeasonStartBridge } from "./seasonStartBridge.js?v=detailed-position-engine-1";
import { installVisualUnityLayer } from "./visualUnityLayer.js?v=draft-desktop-final-1";

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
  installForcedDraftDesktopLayout();
  goTo("page01");
});

function installForcedDraftDesktopLayout() {
  const set = (node, prop, value) => node?.style?.setProperty(prop, value, "important");
  const setAll = (selector, styles) => {
    document.querySelectorAll(selector).forEach(node => {
      Object.entries(styles).forEach(([prop, value]) => set(node, prop, value));
    });
  };

  const apply = () => {
    const page = document.querySelector(".linear-draft-page");
    if (!page) return;

    const desktop = window.matchMedia("(min-width: 901px)").matches;
    if (!desktop) return;

    page.classList.add("draft-desktop-final-forced");

    set(page, "width", "min(1180px, calc(100% - 28px))");
    set(page, "padding-top", "8px");

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

    setAll(".linear-draft-page .linear-player-card, .linear-draft-page .draft-list-player-card, .linear-draft-page .player-card, .linear-draft-page .my-team-card, .linear-draft-page .linear-info-player-card", {
      outline: "1px solid rgba(217, 167, 61, .28)",
      outlineOffset: "0",
      border: "1px solid rgba(240, 223, 184, .18)",
      borderRadius: "14px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.045), 0 8px 20px rgba(0,0,0,.30)"
    });

    setAll(".linear-draft-page .linear-player-card, .linear-draft-page .draft-list-player-card", {
      minHeight: "172px",
      padding: "14px 15px"
    });

    setAll(".linear-draft-page .draft-list-name, .linear-draft-page .linear-player-name", {
      fontSize: "18px",
      lineHeight: "1.12",
      whiteSpace: "normal",
      overflow: "visible",
      textOverflow: "clip"
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
