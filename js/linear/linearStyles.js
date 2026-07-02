export function installLinearStyles() {
  if (document.getElementById("linearStyles")) return;

  const style = document.createElement("style");
  style.id = "linearStyles";
  style.textContent = `
    body {
      background: radial-gradient(circle at top, #123821, #06100a 42%, #020403);
    }

    .linear-page {
      min-height: 100vh;
      width: min(1120px, calc(100% - 28px));
      margin: 0 auto;
      padding: 28px 0;
      display: grid;
      align-items: start;
    }

    .linear-card {
      display: grid;
      gap: 18px;
      padding: clamp(18px, 4vw, 34px);
      border: 1px solid #ffffff22;
      border-radius: 18px;
      background: linear-gradient(180deg, #102017, #07110d);
      box-shadow: 0 22px 70px #00000066;
    }

    .linear-card h1 {
      margin: 0;
      font-size: clamp(34px, 8vw, 64px);
      line-height: 0.95;
      color: #ffffff;
      letter-spacing: -1.5px;
    }

    .linear-big-number {
      display: grid;
      place-items: center;
      width: 140px;
      height: 140px;
      border-radius: 999px;
      font-size: 72px;
      font-weight: 900;
      color: #07110d;
      background: linear-gradient(135deg, #65e58d, #f7c95f);
      justify-self: center;
    }

    .linear-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }

    .linear-player-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .linear-player-card {
      display: grid;
      gap: 8px;
      padding: 14px;
      text-align: left;
      border-radius: 14px;
      border: 1px solid #ffffff20;
      color: white;
      background: linear-gradient(180deg, #13251a, #07110d);
    }

    .linear-player-card:disabled {
      opacity: 1;
    }

    .linear-player-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .linear-player-top b {
      color: #06110b;
      background: #65e58d;
      padding: 4px 8px;
      border-radius: 999px;
    }

    .linear-player-top strong {
      color: #f7c95f;
      font-size: 24px;
    }

    .linear-player-name {
      font-weight: 900;
      font-size: 18px;
    }

    .linear-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .linear-tab-btn {
      width: auto;
      padding: 9px 14px;
    }

    .linear-tab-btn.active {
      color: #06110b;
      background: linear-gradient(90deg, #65e58d, #18c7f3);
    }

    .linear-select {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      color: white;
      background: #07110d;
      border: 1px solid #ffffff22;
    }

    .linear-mini-card,
    .linear-match-summary {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 14px;
      background: #07110d;
      border: 1px solid #ffffff18;
    }

    .linear-mini-card h3,
    .linear-match-summary h2 {
      margin: 0;
      color: white;
    }

    .linear-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #ffffff10;
    }

    .linear-row span {
      color: #b9c7be;
      text-align: right;
    }

    .linear-next-btn {
      width: 100%;
      margin-top: 8px;
    }

    .linear-header-action-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .linear-header-action-row h1 {
      margin: 0;
      flex: 1 1 auto;
      min-width: 0;
      font-size: clamp(26px, 4.2vw, 40px);
    }

    .linear-header-action-row .primary-btn {
      width: auto;
      min-height: 0;
      margin-top: 0;
      padding: 10px 20px;
      font-size: 13px;
      white-space: nowrap;
    }

    @media (max-width: 560px) {
      .linear-header-action-row .primary-btn {
        width: 100%;
      }
    }

    .linear-draft-page {
      width: min(1240px, calc(100% - 20px));
      padding-top: 16px;
    }

    .linear-draft-card {
      gap: 16px;
    }

    .linear-draft-topbar {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: start;
    }

    .linear-draft-topbar h1 {
      font-size: clamp(30px, 6vw, 44px);
    }

    .linear-on-clock {
      margin: 6px 0 0;
      color: #b9c7be;
      font-weight: 900;
    }

    .linear-on-clock.user {
      color: #65e58d;
    }

    .linear-speed-box {
      display: grid;
      gap: 6px;
      min-width: 150px;
      color: #b9c7be;
      padding: 12px;
      border: 1px solid #ffffff22;
      border-radius: 14px;
      background: #111827;
    }

    .linear-speed-box select {
      color: white;
      background: #07110d;
      border: 1px solid #65e58d55;
      border-radius: 999px;
      padding: 10px;
    }

    .linear-counter-block {
      display: grid;
      gap: 10px;
    }

    .linear-round-counter {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .linear-counter-pill {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid #ffffff22;
      border-radius: 999px;
      background: #111827;
    }

    .linear-counter-pill span {
      color: #b9c7be;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
    }

    .linear-counter-pill strong {
      display: grid;
      place-items: center;
      min-width: 42px;
      min-height: 42px;
      border-radius: 50%;
      color: #06110b;
      background: linear-gradient(135deg, #65e58d, #18c7f3);
      font-size: 22px;
    }

    .linear-round-picks,
    .linear-order-ticker {
      overflow-x: auto;
      white-space: nowrap;
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid #18c7f366;
      color: #dbe7df;
      background: #0b1420;
    }

    .linear-order-ticker {
      display: flex;
      gap: 10px;
      border-color: #ffffff20;
    }

    .linear-order-ticker span {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #ffffff22;
      background: #111827;
    }

    .linear-order-ticker span.active {
      color: #06110b;
      background: linear-gradient(90deg, #65e58d, #18c7f3);
    }

    .linear-draft-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid #65e58d44;
      background: #07110d;
    }

    .linear-draft-tabs button {
      padding: 14px;
      border-radius: 14px;
      border: 1px solid #ffffff22;
      color: white;
      font-weight: 900;
      background: #111827;
    }

    .linear-draft-tabs button.active {
      color: #06110b;
      background: linear-gradient(90deg, #65e58d, #18c7f3);
    }

    .linear-draft-view {
      display: grid;
      gap: 14px;
      padding: 18px;
      border: 1px solid #65e58d33;
      border-radius: 18px;
      background: #0b1420;
    }

    .linear-pitch {
      display: grid;
      gap: 16px;
      padding: 18px;
      min-height: 420px;
      border-radius: 20px;
      border: 1px solid #65e58d44;
      background: linear-gradient(180deg, #123821, #0a1c12);
    }

    .linear-pitch-line {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .linear-slot,
    .linear-bench-player {
      min-width: 120px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #ffffff33;
      text-align: center;
      color: white;
      background: #07110dcc;
      cursor: grab;
    }

    .linear-slot.selected,
    .linear-bench-player.selected {
      outline: 3px solid #f7c95f;
    }

    .linear-bench {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid #ffffff22;
      background: #07110d;
    }

    .linear-bench h3 {
      margin: 0;
      color: white;
    }

    .linear-bench-list,
    .linear-ai-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }

    .linear-ai-card {
      display: grid;
      gap: 10px;
      min-height: 260px;
      max-height: 260px;
      overflow-y: auto;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid #ffffff22;
      background: #07110d;
    }

    .linear-ai-card h3,
    .linear-ai-card p {
      margin: 0;
      color: white;
    }

    .linear-ai-card p {
      color: #b9c7be;
      padding: 6px 0;
      border-bottom: 1px solid #ffffff10;
    }

    .linear-ai-card p.linear-ai-list-placeholder {
      color: #62726a;
      font-style: italic;
      border-bottom-style: dashed;
    }

    @media (max-width: 700px) {
      .linear-draft-topbar {
        display: grid;
      }
      .linear-round-counter {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .linear-draft-tabs {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}
