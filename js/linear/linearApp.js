import { goTo } from "./linearRouter.js";
import { installLinearStyles } from "./linearStyles.js";

window.addEventListener("DOMContentLoaded", () => {
  installLinearStyles();
  goTo("page01");
});
