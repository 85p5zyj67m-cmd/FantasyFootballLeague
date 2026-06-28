import { goTo } from "./linearRouter.js?v=player-traits-1";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js?v=default-fast-green-draft-1";
import { installDraftSpeedController } from "./draftSpeedController.js?v=draft-speed-live-3";
import { installPlayerTraitEnhancer } from "./playerTraitEnhancer.js?v=player-traits-1";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  installDraftSpeedController();
  installPlayerTraitEnhancer();
  goTo("page01");
});
