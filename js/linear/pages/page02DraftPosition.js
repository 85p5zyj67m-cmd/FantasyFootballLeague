import { getUserDraftPosition } from "../../draftRules.js";
import { appState } from "../linearState.js";
import { goTo } from "../linearRouter.js";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js";

const SPIN_DURATION_MS = 5000;

export function renderPage02DraftPosition() {
  installDraftPositionSpinStyles();

  const app = clearApp();
  const position = getUserDraftPosition(appState.draftOrder);
  const { section, card } = pageShell({
    eyebrow: "Page 2",
    title: "Your Draft Position",
    subtitle: "Your draft position is being drawn. The draft uses a snake order."
  });

  const slot = document.createElement("div");
  slot.className = "linear-big-number draft-position-spinner spinning";
  slot.textContent = "?";

  const note = document.createElement("p");
  note.className = "subtitle draft-position-spin-note";
  note.textContent = "Draft lottery spinning...";

  const button = primaryButton("Choose System", () => goTo("page03"));
  button.disabled = true;
  button.classList.add("draft-position-next-btn");

  card.append(slot, note, button);
  app.appendChild(section);

  runDraftPositionSpin(slot, note, button, position);
}

function runDraftPositionSpin(slot, note, button, finalPosition) {
  const start = performance.now();
  let frame = 0;

  const tick = now => {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / SPIN_DURATION_MS);
    const slowdown = 55 + progress * 260;

    if (frame === 0 || elapsed % slowdown < 28) {
      slot.textContent = String(1 + Math.floor(Math.random() * 20));
    }

    frame += 1;

    if (progress < 1) {
      window.requestAnimationFrame(tick);
      return;
    }

    slot.textContent = String(finalPosition);
    slot.classList.remove("spinning");
    slot.classList.add("revealed");
    note.textContent = `You pick at position ${finalPosition}.`;
    button.disabled = false;
  };

  window.requestAnimationFrame(tick);
}

function installDraftPositionSpinStyles() {
  if (document.getElementById("draft-position-spin-styles")) return;

  const style = document.createElement("style");
  style.id = "draft-position-spin-styles";
  style.textContent = `
    .draft-position-spinner {
      position: relative;
      min-width: 120px;
      margin: 18px auto 8px;
      border: 1px solid rgba(255, 216, 112, 0.42);
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(255, 216, 112, 0.18), rgba(6, 18, 13, 0.82));
      box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.08), 0 0 28px rgba(255, 216, 112, 0.18);
    }
    .draft-position-spinner.spinning {
      animation: draftPositionPulse 0.42s linear infinite;
    }
    .draft-position-spinner.revealed {
      color: #fff4b8;
      text-shadow: 0 0 18px rgba(255, 216, 112, 0.72);
    }
    .draft-position-spin-note {
      text-align: center;
      margin-bottom: 12px;
    }
    .draft-position-next-btn:disabled {
      opacity: 0.45;
      cursor: wait;
    }
    @keyframes draftPositionPulse {
      0% { transform: translateY(0) scale(1); filter: brightness(1); }
      50% { transform: translateY(-1px) scale(1.025); filter: brightness(1.22); }
      100% { transform: translateY(0) scale(1); filter: brightness(1); }
    }
  `;
  document.head.appendChild(style);
}
