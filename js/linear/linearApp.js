import { goTo } from "./linearRouter.js?v=live-balanced-engine-1";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js?v=default-fast-green-draft-1";
import { installDraftSpeedController } from "./draftSpeedController.js?v=draft-speed-live-3";
import { installFormationSelectorEnhancer } from "./formationSelectorEnhancer.js?v=formation-links-1";
import { installTraitChainEnhancer } from "./traitChainEnhancerCompleteV3.js?v=chain-ui-v3-1";
import { installTacticsSystemEnhancer } from "./tacticsSystemEnhancer.js";
import { installStrictPositionEnforcer } from "./strictPositionEnforcer.js?v=strict-cdm-1";
import { installSeasonStartBridge } from "./seasonStartBridge.js?v=live-balanced-engine-1";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  installDraftSpeedController();
  installFormationSelectorEnhancer();
  installTraitChainEnhancer();
  installTacticsSystemEnhancer();
  installStrictPositionEnforcer();
  installSeasonStartBridge();
  goTo("page01");
});
