import { goTo } from "./linearRouter.js?v=start-bookmaker-1";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js?v=default-fast-green-draft-1";
import { installDraftSpeedController } from "./draftSpeedController.js?v=draft-speed-live-3";
import { installFormationSelectorEnhancer } from "./formationSelectorEnhancer.js?v=formation-links-1";
import { installDraftFormationConstraintEnhancer } from "./draftFormationConstraintEnhancerV6.js?v=draft-constraint-perf-1";
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
  goTo("page01");
});
