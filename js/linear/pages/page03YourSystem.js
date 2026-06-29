import { FORMATIONS } from "../../formations.js?v=detailed-formations-2";
import { appState, userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, pageShell } from "../pageUtils.js";

export function renderPage03YourSystem() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 3",
    title: "Your System",
    subtitle: "Pick your formation. Slots now use real football positions."
  });

  const box = document.createElement("div");
  box.className = "linear-grid formation-grid detailed-formation-grid";

  FORMATIONS.forEach(formation => {
    box.appendChild(makeSystemButton(formation));
  });

  shell.card.appendChild(box);
  app.appendChild(shell.section);
}

function makeSystemButton(formation) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-btn linear-next-btn formation-option-btn";

  const name = document.createElement("strong");
  name.textContent = formation.name;

  const shape = document.createElement("span");
  shape.textContent = formation.lines
    .map(line => line.join(" "))
    .join(" / ");

  button.append(name, shape);
  button.addEventListener("click", () => {
    appState.selectedFormation = formation.id;
    userTeam().formationId = formation.id;
    goTo("page04");
  });

  return button;
}
