import { userTeam } from "../linearState.js";
import { startLinearSeason } from "../seasonFlow.js";
import { clearApp, pageShell, primaryButton, playerCard } from "../pageUtils.js";

export function renderPage05Tactics() {
  const team = userTeam();
  const app = clearApp();
  const { section, card } = pageShell({
    eyebrow: "Page 5",
    title: "Tactics",
    subtitle: "Choose your play style before the season starts."
  });

  const select = document.createElement("select");
  select.className = "linear-select";
  ["Balanced", "Possession", "Counter Attack", "High Press", "Defensive Block"].forEach(style => {
    const option = document.createElement("option");
    option.value = style;
    option.textContent = style;
    select.appendChild(option);
  });
  select.value = team.playStyle || "Balanced";
  select.addEventListener("change", () => {
    team.playStyle = select.value;
  });
  card.appendChild(select);

  const squad = document.createElement("div");
  squad.className = "linear-player-grid";
  team.players.slice().sort((a, b) => b.overall - a.overall).forEach(player => squad.appendChild(playerCard(player)));
  card.appendChild(squad);
  card.appendChild(primaryButton("Start Season", () => {
    team.playStyle = select.value;
    startLinearSeason();
  }));

  app.appendChild(section);
}
