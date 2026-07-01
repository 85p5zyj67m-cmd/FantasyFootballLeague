import { getFormationById } from "../../formations.js?v=detailed-formations-3";
import { getSlotsFromFormation } from "../../lineup.js?v=strict-cdm-1";
import { canPlayPosition } from "../../playerUtils.js?v=strict-cdm-1";
import { userTeam } from "../linearState.js";
import { goTo } from "../linearRouter.js?v=detailed-formations-1";

let queued = false;
let installed = false;

export function installStrictPositionEnforcer() {
  if (installed) return;
  installed = true;

  window.addEventListener("drop", queueStrictPositionCheck, true);
  window.addEventListener("dragend", queueStrictPositionCheck, true);
  window.addEventListener("change", queueStrictPositionCheck, true);
  window.addEventListener("click", queueStrictPositionCheck, true);

  queueStrictPositionCheck();
}

function queueStrictPositionCheck() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    enforceStrictPositions();
  });
}

function enforceStrictPositions() {
  const team = userTeam();
  if (!team?.lineup || !team?.players?.length) return;

  const formation = getFormationById(team.formationId);
  const slots = getSlotsFromFormation(formation);
  const slotsByKey = new Map(slots.map(slot => [slot.key, slot]));
  const playersById = new Map(team.players.map(player => [player.id, player]));
  let changed = false;

  Object.entries(team.lineup).forEach(([playerId, slotKey]) => {
    if (!slotKey || slotKey === "BENCH") return;

    const player = playersById.get(playerId);
    const slot = slotsByKey.get(slotKey);

    if (!player || !slot || !canPlayPosition(player, slot.position)) {
      team.lineup[playerId] = "BENCH";
      changed = true;
    }
  });

  if (!changed) return;

  if (document.querySelector(".linear-draft-page")) {
    goTo("page04");
    return;
  }

  if (document.querySelector(".linear-season-setup-card, .linear-my-team-view")) {
    goTo("page05");
  }
}
