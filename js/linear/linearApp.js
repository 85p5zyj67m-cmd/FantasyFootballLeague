import { goTo } from "./linearRouter.js?v=draft-speed-live-2";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js";
import { installDraftSpeedController } from "./draftSpeedController.js?v=draft-speed-live-2";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  installDraftSpeedController();
  goTo("page01");
});
