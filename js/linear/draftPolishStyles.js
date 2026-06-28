export function installDraftPolishStyles() {
  if (document.getElementById("draftPolishStyles")) return;

  const style = document.createElement("style");
  style.id = "draftPolishStyles";
  style.textContent = `
    .linear-round-picks {
      overflow: hidden !important;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 900;
      text-align: center;
    }

    .linear-order-ticker.centered {
      overflow: hidden !important;
      justify-content: center;
      align-items: center;
      padding-left: 8px;
      padding-right: 8px;
    }

    .linear-order-ticker.centered span {
      flex: 0 0 auto;
      opacity: 0.68;
      transform: scale(0.94);
      transition: transform 0.18s ease, opacity 0.18s ease;
    }

    .linear-order-ticker.centered span.before,
    .linear-order-ticker.centered span.after {
      color: #b9c7be;
    }

    .linear-order-ticker.centered span.active {
      opacity: 1;
      transform: scale(1.08);
      box-shadow: 0 0 0 2px #65e58d44;
    }

    .linear-myteam-tabs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      padding: 8px;
      border-radius: 14px;
      border: 1px solid #ffffff1d;
      background: #07110d;
    }

    .linear-myteam-tabs button {
      border: 1px solid #ffffff22;
      border-radius: 12px;
      padding: 12px;
      color: white;
      font-weight: 900;
      background: #111827;
    }

    .linear-myteam-tabs button.active {
      color: #06110b;
      background: linear-gradient(90deg, #65e58d, #18c7f3);
    }

    .linear-s11-view {
      display: grid;
      gap: 14px;
    }

    .linear-pitch {
      align-content: space-between;
    }

    .linear-pitch-line {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(118px, 128px));
      justify-content: center;
      gap: 12px;
    }

    .linear-slot {
      width: 128px;
      height: 92px;
      min-width: 128px;
      max-width: 128px;
      display: grid;
      align-content: center;
      gap: 4px;
      overflow: hidden;
    }

    .linear-slot strong {
      color: #65e58d;
      font-size: 12px;
    }

    .linear-slot span {
      color: white;
      font-size: 13px;
      font-weight: 900;
      line-height: 1.15;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .linear-slot small {
      color: #f7c95f;
      font-weight: 900;
    }

    .linear-bench-list {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }

    .linear-bench-player {
      min-height: 58px;
      display: grid;
      place-items: center;
      font-weight: 800;
      line-height: 1.2;
    }

    .linear-tactics-view {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .linear-tactic-control {
      display: grid;
      gap: 8px;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid #ffffff20;
      background: #07110d;
      color: white;
      font-weight: 900;
    }

    .linear-tactic-control span {
      color: #b9c7be;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .linear-tactic-control select {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #65e58d44;
      color: white;
      background: #111827;
    }

    .linear-ai-card {
      scrollbar-width: thin;
      scrollbar-color: #65e58d55 #07110d;
    }

    .linear-ai-card::-webkit-scrollbar {
      width: 6px;
    }

    .linear-ai-card::-webkit-scrollbar-track {
      background: #07110d;
      border-radius: 999px;
    }

    .linear-ai-card::-webkit-scrollbar-thumb {
      background: #65e58d55;
      border-radius: 999px;
    }

    @media (max-width: 620px) {
      .linear-pitch-line {
        grid-template-columns: repeat(auto-fit, minmax(96px, 108px));
      }

      .linear-slot {
        width: 108px;
        min-width: 108px;
        max-width: 108px;
        height: 86px;
      }
    }
  `;

  document.head.appendChild(style);
}
