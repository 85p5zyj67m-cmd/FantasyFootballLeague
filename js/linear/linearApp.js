import { goTo } from "./linearRouter.js?v=draft-speed-live-1";
import { installLinearStyles } from "./linearStyles.js";
import { installDraftPolishStyles } from "./draftPolishStyles.js";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  installDraftPolishStyles();
  goTo("page01");
});
