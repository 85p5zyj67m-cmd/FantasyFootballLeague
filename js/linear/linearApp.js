import { goTo } from "./linearRouter.js?v=draft-speed-live-3";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js";
import { installDraftSpeedController } from "./draftSpeedController.js?v=draft-speed-live-3";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  installDraftSpeedController();
  goTo("page01");
});
