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
  `;

  document.head.appendChild(style);
}
