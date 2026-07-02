import { getUserDraftPosition } from "../../draftRules.js";
import { appState } from "../linearState.js";
import { goTo } from "../linearRouter.js?v=cache-fix-1";
import { clearApp, pageShell, primaryButton } from "../pageUtils.js?v=pos-icons-5";

const SPIN_DURATION_MS = 5000;
const TOTAL_DRAFT_POSITIONS = 20;
const REEL_ITEM_HEIGHT = 86;
const REEL_LOOPS = 9;

export function renderPage02DraftPosition() {
  installDraftPositionSpinStyles();

  const app = clearApp();
  const position = getUserDraftPosition(appState.draftOrder);
  const { section, card } = pageShell({
    eyebrow: "Page 2",
    title: "Draft Lottery",
    subtitle: "Your draft position is being drawn. The draft uses a snake order."
  });

  const machine = createSlotMachine(position);

  const note = document.createElement("p");
  note.className = "subtitle draft-position-spin-note";
  note.textContent = "Spinning the draft lottery...";

  const button = primaryButton("Choose System", () => goTo("page03"));
  button.disabled = true;
  button.classList.add("draft-position-next-btn");

  card.append(machine.wrapper, note, button);
  app.appendChild(section);

  runDraftPositionSpin(machine, note, button, position);
}

function createSlotMachine(finalPosition) {
  const wrapper = document.createElement("div");
  wrapper.className = "draft-casino-machine spinning";

  const lights = document.createElement("div");
  lights.className = "draft-casino-lights";
  Array.from({ length: 16 }).forEach(() => lights.appendChild(document.createElement("span")));

  const topLabel = document.createElement("div");
  topLabel.className = "draft-casino-label";
  topLabel.textContent = "Lucky Pick";

  const windowBox = document.createElement("div");
  windowBox.className = "draft-reel-window";

  const topShade = document.createElement("div");
  topShade.className = "draft-reel-shade top";

  const bottomShade = document.createElement("div");
  bottomShade.className = "draft-reel-shade bottom";

  const payline = document.createElement("div");
  payline.className = "draft-reel-payline";

  const reel = document.createElement("div");
  reel.className = "draft-position-reel";

  const numbers = buildReelNumbers(finalPosition);
  numbers.forEach(number => {
    const item = document.createElement("div");
    item.className = "draft-reel-item";
    item.textContent = String(number);
    reel.appendChild(item);
  });

  windowBox.append(reel, topShade, bottomShade, payline);
  wrapper.append(lights, topLabel, windowBox);

  return { wrapper, reel, numbers };
}

function buildReelNumbers(finalPosition) {
  const numbers = [];

  for (let loop = 0; loop < REEL_LOOPS; loop++) {
    const offset = loop * 7;
    for (let position = 1; position <= TOTAL_DRAFT_POSITIONS; position++) {
      numbers.push(((position + offset - 1) % TOTAL_DRAFT_POSITIONS) + 1);
    }
  }

  numbers.push(finalPosition);
  return numbers;
}

function runDraftPositionSpin(machine, note, button, finalPosition) {
  const finalIndex = machine.numbers.length - 1;
  const finalOffset = -finalIndex * REEL_ITEM_HEIGHT;

  machine.reel.style.transition = "none";
  machine.reel.style.transform = "translate3d(0, 0, 0)";

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      machine.reel.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.08, 0.82, 0.12, 1)`;
      machine.reel.style.transform = `translate3d(0, ${finalOffset}px, 0)`;
    });
  });

  window.setTimeout(() => {
    machine.wrapper.classList.remove("spinning");
    machine.wrapper.classList.add("revealed");
    note.textContent = `Jackpot! You pick at position ${finalPosition}.`;
    button.disabled = false;
  }, SPIN_DURATION_MS + 80);
}

function installDraftPositionSpinStyles() {
  if (document.getElementById("draft-position-spin-styles")) return;

  const style = document.createElement("style");
  style.id = "draft-position-spin-styles";
  style.textContent = `
    .draft-casino-machine {
      position: relative;
      width: min(280px, 88vw);
      margin: 22px auto 12px;
      padding: 18px 18px 22px;
      border: 2px solid rgba(255, 216, 112, 0.72);
      border-radius: 28px;
      background:
        radial-gradient(circle at 50% 0%, rgba(255, 245, 175, 0.22), transparent 38%),
        linear-gradient(180deg, rgba(38, 22, 6, 0.98), rgba(8, 18, 12, 0.98));
      box-shadow:
        inset 0 0 34px rgba(255, 255, 255, 0.08),
        inset 0 -18px 30px rgba(0, 0, 0, 0.32),
        0 18px 46px rgba(0, 0, 0, 0.34),
        0 0 34px rgba(255, 216, 112, 0.24);
      overflow: hidden;
    }
    .draft-casino-machine::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(110deg, transparent 0 18%, rgba(255,255,255,0.12) 26%, transparent 34% 100%);
      transform: translateX(-80%);
      pointer-events: none;
    }
    .draft-casino-machine.spinning::before {
      animation: casinoSweep 1.25s linear infinite;
    }
    .draft-casino-lights {
      position: absolute;
      inset: 8px 10px auto;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
    }
    .draft-casino-lights span {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: rgba(255, 216, 112, 0.52);
      box-shadow: 0 0 10px rgba(255, 216, 112, 0.72);
    }
    .draft-casino-machine.spinning .draft-casino-lights span:nth-child(odd) {
      animation: casinoBlink 0.42s infinite alternate;
    }
    .draft-casino-machine.spinning .draft-casino-lights span:nth-child(even) {
      animation: casinoBlink 0.42s 0.21s infinite alternate;
    }
    .draft-casino-label {
      position: relative;
      z-index: 2;
      margin: 12px 0 12px;
      text-align: center;
      color: #ffe7a4;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      text-shadow: 0 0 14px rgba(255, 216, 112, 0.6);
    }
    .draft-reel-window {
      position: relative;
      height: 86px;
      overflow: hidden;
      border-radius: 20px;
      border: 2px solid rgba(255, 245, 190, 0.7);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.16), transparent 18%, transparent 82%, rgba(0,0,0,0.24)),
        radial-gradient(circle at 50% 50%, rgba(255, 216, 112, 0.18), rgba(0, 0, 0, 0.22));
      box-shadow:
        inset 0 18px 20px rgba(255,255,255,0.08),
        inset 0 -20px 24px rgba(0,0,0,0.36),
        0 0 24px rgba(255, 216, 112, 0.14);
    }
    .draft-position-reel {
      will-change: transform;
      transform: translate3d(0, 0, 0);
    }
    .draft-reel-item {
      height: 86px;
      display: grid;
      place-items: center;
      color: #fff7cf;
      font-size: clamp(54px, 15vw, 76px);
      font-weight: 1000;
      line-height: 1;
      letter-spacing: -0.05em;
      text-shadow:
        0 2px 0 rgba(80, 45, 0, 0.75),
        0 0 20px rgba(255, 216, 112, 0.64),
        0 0 42px rgba(255, 145, 61, 0.38);
      background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,216,112,0.02));
    }
    .draft-casino-machine.spinning .draft-reel-item {
      filter: blur(0.7px);
    }
    .draft-casino-machine.revealed .draft-reel-item:last-child {
      color: #ffffff;
      animation: jackpotPop 0.72s cubic-bezier(0.2, 1.5, 0.35, 1) both;
    }
    .draft-reel-shade {
      position: absolute;
      left: 0;
      right: 0;
      height: 30px;
      z-index: 3;
      pointer-events: none;
    }
    .draft-reel-shade.top {
      top: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.58), transparent);
    }
    .draft-reel-shade.bottom {
      bottom: 0;
      background: linear-gradient(0deg, rgba(0,0,0,0.58), transparent);
    }
    .draft-reel-payline {
      position: absolute;
      left: 8px;
      right: 8px;
      top: 50%;
      height: 2px;
      z-index: 4;
      transform: translateY(-50%);
      background: linear-gradient(90deg, transparent, rgba(255, 236, 160, 0.95), transparent);
      box-shadow: 0 0 12px rgba(255, 216, 112, 0.8);
      pointer-events: none;
    }
    .draft-position-spin-note {
      text-align: center;
      margin-bottom: 12px;
    }
    .draft-position-next-btn:disabled {
      opacity: 0.45;
      cursor: wait;
    }
    @keyframes casinoSweep {
      from { transform: translateX(-85%); }
      to { transform: translateX(120%); }
    }
    @keyframes casinoBlink {
      from { opacity: 0.42; transform: scale(0.82); }
      to { opacity: 1; transform: scale(1.18); }
    }
    @keyframes jackpotPop {
      0% { transform: scale(0.94); filter: brightness(1); }
      50% { transform: scale(1.12); filter: brightness(1.45); }
      100% { transform: scale(1); filter: brightness(1.16); }
    }
  `;
  document.head.appendChild(style);
}
