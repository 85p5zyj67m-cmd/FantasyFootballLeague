import { goTo } from "./linearRouter.js?v=detailed-formations-1";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js?v=default-fast-green-draft-1";
import { installDraftSpeedController } from "./draftSpeedController.js?v=draft-speed-live-3";
import { installFormationSelectorEnhancer } from "./formationSelectorEnhancer.js?v=formation-links-1";
import { installTraitChainEnhancer } from "./traitChainEnhancer.js?v=chain-box-1";
import { installStrictPositionEnforcer } from "./strictPositionEnforcer.js?v=strict-cdm-1";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  installDraftSpeedController();
  installFormationSelectorEnhancer();
  installTraitChainEnhancer();
  installStrictPositionEnforcer();
  goTo("page01");
});