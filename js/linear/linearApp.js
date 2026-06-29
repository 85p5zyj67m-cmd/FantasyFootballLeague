import { goTo } from "./linearRouter.js?v=detailed-formations-1";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js?v=default-fast-green-draft-1";
import { installDraftSpeedController } from "./draftSpeedController.js?v=draft-speed-live-3";
import { installFormationSelectorEnhancer } from "./formationSelectorEnhancer.js?v=detailed-formations-2";
import { installTraitChainEnhancer } from "./traitChainEnhancer.js?v=chain-ui-2";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  installDraftSpeedController();
  installFormationSelectorEnhancer();
  installTraitChainEnhancer();
  goTo("page01");
});