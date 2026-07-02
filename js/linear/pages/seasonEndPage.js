import { clearApp, pageShell, primaryButton, twoColumnRow } from "../pageUtils.js?v=pos-icons-5";
import {
  renderHistoryBlock,
  renderStandingsBlock,
  finalResultText,
  computeUserRecord,
  computeSquadSeasonStats,
  computeSeasonAwards
} from "../seasonRenderUtils.js";
import { getDisplayPosition } from "../../playerUtils.js";
import { appState, userTeam } from "../linearState.js";

export function renderSeasonEndPage() {
  installSeasonEndStyles();

  const app = clearApp();
  const champion = appState.season?.champion?.name || "Unknown";
  const record = computeUserRecord();
  const shell = pageShell({
    eyebrow: "Season Statistics",
    title: finalResultText(),
    subtitle: `Champion: ${champion}`
  });

  const summary = document.createElement("div");
  summary.className = "linear-mini-card";
  summary.appendChild(twoColumnRow("Matches played", String(record.played)));
  summary.appendChild(twoColumnRow("Record (W-D-L)", `${record.wins}-${record.draws}-${record.losses}`));
  summary.appendChild(twoColumnRow("Your result", finalResultText()));
  summary.appendChild(twoColumnRow("Champion of the season", champion));
  shell.card.appendChild(summary);

  shell.card.appendChild(renderStandingsBlock());
  shell.card.appendChild(renderHistoryBlock());
  shell.card.appendChild(createSquadTable());
  shell.card.appendChild(createAwardsSection());

  shell.card.appendChild(primaryButton("New Season", () => {
    window.location.href = window.location.pathname + "?v=" + Date.now();
  }));
  shell.card.appendChild(createShareSeasonButton());

  app.appendChild(shell.section);
}

function createSquadTable() {
  const card = document.createElement("div");
  card.className = "linear-mini-card season-squad-table-card";

  const heading = document.createElement("h3");
  heading.textContent = "Squad Season Overview";
  card.appendChild(heading);

  const { rows } = computeSquadSeasonStats();

  const table = document.createElement("table");
  table.className = "season-squad-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Player", "Pos", "OVR", "Goals", "Assists", "Cards", "Clean Sheets"].forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    appendCell(tr, row.player.name);
    appendCell(tr, row.positionPlayed || getDisplayPosition(row.player));
    appendCell(tr, String(row.player.overall));
    appendCell(tr, row.goals ? String(row.goals) : "-");
    appendCell(tr, row.assists ? String(row.assists) : "-");
    appendCell(tr, formatCards(row.yellowCards, row.redCards));
    appendCell(tr, row.cleanSheets !== null ? String(row.cleanSheets) : "-");
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  card.appendChild(table);
  return card;
}

function formatCards(yellow, red) {
  if (!yellow && !red) return "-";
  const parts = [];
  if (yellow) parts.push(`🟨${yellow}`);
  if (red) parts.push(`🟥${red}`);
  return parts.join(" ");
}

function appendCell(row, text) {
  const td = document.createElement("td");
  td.textContent = text;
  row.appendChild(td);
}

function createAwardsSection() {
  const card = document.createElement("div");
  card.className = "linear-mini-card season-awards-card";

  const heading = document.createElement("h3");
  heading.textContent = "Season Awards";
  card.appendChild(heading);

  const awards = computeSeasonAwards();
  const grid = document.createElement("div");
  grid.className = "season-awards-grid";

  [
    ["⭐ Best Player", awards.bestPlayer],
    ["⚽ Top Scorer", awards.topScorer],
    ["🎯 Top Assist Maker", awards.topAssist],
    ["🧤 Golden Glove", awards.goldenGlove],
    ["🔥 Best Attacker", awards.bestAttacker],
    ["🎼 Best Midfielder", awards.bestMidfielder],
    ["🛡️ Best Defender", awards.bestDefender]
  ].forEach(([label, award]) => grid.appendChild(createAwardBox(label, award?.player?.name, award?.team?.name, award?.note)));

  grid.appendChild(createAwardBox("👔 Manager of the Season", awards.manager?.team?.name, null, awards.manager?.note));

  card.appendChild(grid);
  return card;
}

function createAwardBox(label, name, teamName, note) {
  const box = document.createElement("div");
  box.className = "season-award-box";

  const title = document.createElement("strong");
  title.textContent = label;

  const value = document.createElement("p");
  value.className = "season-award-name";
  value.textContent = name || "Not awarded";

  box.append(title, value);

  if (teamName) {
    const teamLine = document.createElement("p");
    teamLine.className = "season-award-team";
    teamLine.textContent = teamName;
    box.appendChild(teamLine);
  }

  const small = document.createElement("small");
  small.textContent = note || "";
  box.appendChild(small);

  return box;
}

function createShareSeasonButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-btn linear-next-btn share-season-btn";
  button.textContent = "Share Season";
  button.addEventListener("click", () => shareSeasonImage(button));
  return button;
}

async function shareSeasonImage(button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Preparing image...";

  try {
    const canvas = buildSeasonShareCanvas();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;

    const file = new File([blob], "season-summary.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My Fantasy Football Season", text: buildShareText() });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    downloadCanvas(canvas);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function downloadCanvas(canvas) {
  const link = document.createElement("a");
  link.download = "season-summary.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function buildShareText() {
  const team = userTeam();
  const champion = appState.season?.champion?.name || "Unknown";
  return `${team.name} - season complete! Champion: ${champion}. ${finalResultText()}`;
}

function buildSeasonShareCanvas() {
  const team = userTeam();
  const { rows } = computeSquadSeasonStats();
  const record = computeUserRecord();
  const champion = appState.season?.champion?.name || "Unknown";
  const topScorer = rows.find(row => row.goals > 0);

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#0e2519");
  bg.addColorStop(1, "#07110d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(217,167,61,.5)";
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.fillStyle = "#f2d68a";
  ctx.font = "700 30px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("FANTASY FOOTBALL LEAGUE", canvas.width / 2, 90);

  ctx.fillStyle = "#fff2c2";
  ctx.font = "900 52px Georgia, serif";
  ctx.fillText(team.name, canvas.width / 2, 160);

  ctx.font = "600 26px Georgia, serif";
  ctx.fillStyle = "#d9c99f";
  ctx.fillText(finalResultText(), canvas.width / 2, 210);

  let y = 300;
  [
    ["Champion", champion],
    ["Record", `${record.wins}W - ${record.draws}D - ${record.losses}L`],
    ["Matches Played", String(record.played)],
    ["Top Scorer", topScorer ? `${topScorer.player.name} (${topScorer.goals})` : "-"]
  ].forEach(([label, value]) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#a8c9b3";
    ctx.font = "600 22px Georgia, serif";
    ctx.fillText(label, 80, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 24px Georgia, serif";
    ctx.fillText(value, canvas.width - 80, y);
    y += 50;
  });

  y += 30;
  ctx.textAlign = "left";
  ctx.fillStyle = "#f2d68a";
  ctx.font = "700 24px Georgia, serif";
  ctx.fillText("SQUAD OVERVIEW", 80, y);
  y += 46;

  rows.slice(0, 10).forEach(row => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "600 20px Georgia, serif";
    ctx.fillText(`${row.player.name} (${getDisplayPosition(row.player)})`, 80, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f7c95f";
    ctx.font = "700 20px Georgia, serif";
    ctx.fillText(row.goals ? `${row.goals} G` : "-", canvas.width - 80, y);
    y += 38;
  });

  return canvas;
}

function installSeasonEndStyles() {
  if (document.getElementById("seasonEndStyles")) return;

  const style = document.createElement("style");
  style.id = "seasonEndStyles";
  style.textContent = `
    .season-squad-table-card h3,
    .season-awards-card h3 {
      margin: 0 0 12px;
      color: #f2d68a;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .season-squad-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }

    .season-squad-table th,
    .season-squad-table td {
      padding: 7px 8px;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,.08);
      color: #e5e7eb;
    }

    .season-squad-table th {
      color: #a8c9b3;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: .04em;
    }

    .season-squad-table td:nth-child(n+3),
    .season-squad-table th:nth-child(n+3) {
      text-align: center;
      white-space: nowrap;
    }

    .season-awards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      align-items: stretch;
    }

    .season-award-box {
      display: flex;
      flex-direction: column;
      min-height: 108px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(209, 179, 110, 0.28);
      background: rgba(209, 179, 110, 0.06);
    }

    .season-award-box strong {
      display: block;
      margin-bottom: 4px;
      color: #a8c9b3;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    .season-award-name {
      margin: 0 0 2px;
      color: #fff2c2;
      font-weight: 900;
      font-size: 13.5px;
      line-height: 1.25;
    }

    .season-award-team {
      margin: 0 0 4px;
      color: #d1b36e;
      font-weight: 700;
      font-size: 11px;
    }

    .season-award-box small {
      display: block;
      margin-top: auto;
      color: #d9c99f;
      opacity: .85;
      font-size: 11px;
      line-height: 1.35;
    }

    html body .primary-btn.share-season-btn,
    html body button.primary-btn.share-season-btn {
      margin-top: 8px;
      background: linear-gradient(180deg, #1c1408, #100b04) !important;
      border: 1px solid rgba(217, 167, 61, .4) !important;
      color: #f2d68a !important;
    }
  `;
  document.head.appendChild(style);
}
