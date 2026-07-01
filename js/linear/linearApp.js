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
import { installVisualUnityLayer } from "./visualUnityLayer.js?v=unified-green-wood-1";

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
  installCompactDraftRuntimeLayer();
  goTo("page01");
});

function installCompactDraftRuntimeLayer() {
  const styleId = "compact-draft-runtime-layer";
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `
    html body .linear-draft-page {
      width: min(1100px, calc(100% - 18px)) !important;
      padding-top: 4px !important;
    }

    html body .linear-draft-card {
      gap: 4px !important;
      padding: 8px 14px 14px !important;
      border-radius: 16px !important;
    }

    html body .linear-draft-topbar {
      min-height: 38px !important;
      height: 44px !important;
      max-height: 44px !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
    }

    html body .linear-draft-topbar > div:first-child {
      display: grid !important;
      gap: 0 !important;
      align-content: center !important;
    }

    html body .linear-draft-topbar .eyebrow {
      margin: 0 !important;
      font-size: 8px !important;
      line-height: 1 !important;
      letter-spacing: .13em !important;
    }

    html body .linear-draft-topbar h1 {
      margin: 0 !important;
      font-size: clamp(23px, 3vw, 31px) !important;
      line-height: .86 !important;
      letter-spacing: 0 !important;
    }

    html body .linear-on-clock {
      margin: 0 !important;
      font-size: 10px !important;
      line-height: 1 !important;
    }

    html body .linear-speed-box {
      min-width: 96px !important;
      max-width: 104px !important;
      gap: 1px !important;
      padding: 4px 6px !important;
      border-radius: 9px !important;
      outline-width: 1px !important;
      outline-offset: 2px !important;
    }

    html body .linear-speed-box span {
      font-size: 9px !important;
      line-height: 1 !important;
    }

    html body .linear-speed-box select {
      min-height: 20px !important;
      height: 20px !important;
      padding: 1px 5px !important;
      border-radius: 6px !important;
      font-size: 10px !important;
      line-height: 1 !important;
    }

    html body .linear-counter-block {
      display: grid !important;
      grid-template-columns: minmax(0, 1.25fr) minmax(250px, .85fr) !important;
      gap: 5px !important;
      align-items: center !important;
      margin: 0 !important;
      min-height: 26px !important;
    }

    html body .linear-round-counter {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 4px !important;
      min-height: 26px !important;
      margin: 0 !important;
    }

    html body .linear-counter-pill {
      min-height: 25px !important;
      height: 25px !important;
      padding: 1px 3px 1px 7px !important;
      gap: 4px !important;
      border-radius: 999px !important;
      outline-width: 0 !important;
      margin: 0 !important;
    }

    html body .linear-counter-pill span {
      font-size: 7px !important;
      line-height: 1 !important;
      letter-spacing: .04em !important;
    }

    html body .linear-counter-pill strong {
      min-width: 20px !important;
      min-height: 20px !important;
      width: 20px !important;
      height: 20px !important;
      font-size: 11px !important;
      line-height: 1 !important;
    }

    html body .linear-round-picks {
      min-height: 25px !important;
      height: 25px !important;
      padding: 2px 8px !important;
      border-radius: 999px !important;
      font-size: 10px !important;
      line-height: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    html body .linear-order-ticker {
      min-height: 27px !important;
      height: 27px !important;
      padding: 2px 7px !important;
      gap: 4px !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 11px !important;
      margin: 0 !important;
      overflow: hidden !important;
    }

    html body .linear-order-ticker span {
      padding: 3px 7px !important;
      font-size: 9px !important;
      line-height: 1 !important;
      border-radius: 999px !important;
    }

    html body .linear-draft-tabs {
      min-height: 31px !important;
      height: 31px !important;
      gap: 5px !important;
      padding: 3px 6px !important;
      border-radius: 11px !important;
      outline-width: 1px !important;
      outline-offset: 2px !important;
      margin: 0 !important;
    }

    html body .linear-draft-tabs button {
      min-height: 23px !important;
      height: 23px !important;
      padding: 3px 8px !important;
      border-radius: 7px !important;
      font-size: 10px !important;
      line-height: 1 !important;
    }

    html body .linear-draft-view {
      margin-top: 4px !important;
      padding: 10px !important;
      gap: 7px !important;
      border-radius: 15px !important;
    }

    html body .linear-player-list-view h2,
    html body .linear-my-team-view h2,
    html body .linear-ai-teams-view h2 {
      margin: 0 0 4px !important;
      font-size: clamp(22px, 2.6vw, 29px) !important;
      line-height: 1 !important;
    }

    html body .linear-tabs {
      margin: 0 0 8px !important;
      gap: 5px !important;
    }

    html body .linear-tab-btn,
    html body .position-filter-btn,
    html body .chip {
      min-height: 28px !important;
      padding: 5px 10px !important;
      font-size: 11px !important;
      line-height: 1 !important;
    }

    html body .linear-player-card,
    html body .draft-list-player-card,
    html body .player-card,
    html body .my-team-card,
    html body .linear-info-player-card {
      outline-width: 1px !important;
      outline-offset: 2px !important;
      border-width: 1px !important;
      border-radius: 11px !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.045), 0 6px 14px rgba(0,0,0,.24) !important;
    }

    html body .linear-player-card,
    html body .draft-list-player-card {
      min-height: 112px !important;
      padding: 9px 10px !important;
    }

    html body .linear-player-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
      gap: 9px !important;
    }

    html body .draft-list-name,
    html body .linear-player-name {
      font-size: 14px !important;
      line-height: 1.06 !important;
    }

    @media (max-width: 900px) {
      html body .linear-counter-block {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  const markDraft = () => {
    document.querySelectorAll(".linear-draft-page").forEach(page => page.classList.add("compact-draft-runtime"));
  };
  markDraft();
  new MutationObserver(markDraft).observe(document.documentElement, { childList: true, subtree: true });
}
