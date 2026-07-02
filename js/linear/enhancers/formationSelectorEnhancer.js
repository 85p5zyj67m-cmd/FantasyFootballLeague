import { FORMATIONS } from "../../formations.js?v=detailed-formations-3";
import { resetLineup } from "../../lineup.js?v=detailed-formations-2";
import { appState, userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js?v=detailed-formations-2";

let observer = null;
let queued = false;

export function installFormationSelectorEnhancer() {
  if (observer) return;

  observer = new MutationObserver(queueEnhancement);
  observer.observe(document.getElementById("app"), {
    childList: true,
    subtree: true
  });

  queueEnhancement();
}

function queueEnhancement() {
  if (queued) return;
  queued = true;
  window.setTimeout(() => {
    queued = false;
    enhanceMyTeamFormationViews();
  }, 0);
}

function enhanceMyTeamFormationViews() {
  const myTeamView = document.querySelector(".linear-my-team-view, .linear-season-setup-card");
  const s11View = document.querySelector(".linear-s11-view");
  const tabs = document.querySelector(".linear-myteam-tabs");

  if (!myTeamView || !s11View || !tabs) return;
  if (document.querySelector(".my-team-top-row")) return;

  const team = userTeam();
  if (!team) return;

  const row = createFormationSelector(team);
  tabs.insertAdjacentElement("afterend", row);
}

function createFormationSelector(team) {
  const row = document.createElement("div");
  row.className = "my-team-top-row";

  const wrapper = document.createElement("label");
  wrapper.className = "my-team-formation-selector";

  const select = document.createElement("select");
  FORMATIONS.forEach(formation => {
    const option = document.createElement("option");
    option.value = formation.id;
    option.textContent = formation.name;
    select.appendChild(option);
  });

  select.value = team.formationId || appState.selectedFormation || FORMATIONS[0].id;
  select.addEventListener("change", () => {
    const nextFormationId = select.value;
    appState.selectedFormation = nextFormationId;
    team.formationId = nextFormationId;
    resetLineup(team);

    if (document.querySelector(".linear-draft-page")) {
      goTo("page04");
      return;
    }

    goTo("page05");
  });

  wrapper.append(select);
  row.append(wrapper);
  return row;
}
