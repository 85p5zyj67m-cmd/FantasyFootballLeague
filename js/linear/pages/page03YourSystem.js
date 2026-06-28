import { appState, userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, pageShell } from "../pageUtils.js";

export function renderPage03YourSystem() {
  const app = clearApp();
  const shell = pageShell({ eyebrow: "Page 3", title: "Your System", subtitle: "Pick your formation." });
  const box = document.createElement("div");
  box.className = "linear-grid";

  box.appendChild(makeSystemButton("4-3-3"));
  box.appendChild(makeSystemButton("4-4-2"));
  box.appendChild(makeSystemButton("3-5-2"));
  box.appendChild(makeSystemButton("4-2-3-1"));

  shell.card.appendChild(box);
  app.appendChild(shell.section);
}

function makeSystemButton(id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-btn linear-next-btn";
  button.textContent = id;
  button.addEventListener("click", () => {
    appState.selectedFormation = id;
    userTeam().formationId = id;
    goTo("page04");
  });
  return button;
}
