import { appState, userTeam } from "../linearState.js";
import { playNextLinearMatch } from "../seasonFlow.js?v=real-overall-system-balance-3";
import { clearApp, pageShell, primaryButton, renderReadOnlyPitch, generateScoutingReport } from "../pageUtils.js?v=pos-icons-5";

let divisionDrawComplete = false;
let drawTimer = null;
let selectedTeam = null;

export function renderPage06SeasonStats() {
  installPageSixStyles();

  if (selectedTeam) {
    renderTeamDetail(selectedTeam);
    return;
  }

  if (!divisionDrawComplete) {
    renderCompassDraw();
    return;
  }

  renderDivisionOverview();
}

function renderCompassDraw() {
  const app = clearApp();
  const ownDivision = getUserDivision();
  const shell = pageShell({
    eyebrow: "Page 6",
    title: "Division Draw",
    subtitle: "The compass is drawing your division."
  });

  const compass = document.createElement("div");
  compass.className = "division-compass-draw";
  compass.style.setProperty("--compass-target-angle", `${getNeedleTargetAngle(ownDivision)}deg`);
  compass.innerHTML = `
    <div class="compass-ring">
      <span class="north">N</span>
      <span class="east">E</span>
      <span class="south">S</span>
      <span class="west">W</span>
      <div class="compass-needle"></div>
    </div>
    <p>Drawing North, West, East and South...</p>
  `;
  shell.card.appendChild(compass);
  app.appendChild(shell.section);

  if (drawTimer) window.clearTimeout(drawTimer);
  drawTimer = window.setTimeout(() => {
    divisionDrawComplete = true;
    drawTimer = null;
    renderPage06SeasonStats();
  }, 5000);
}

function getUserDivision() {
  return appState.season?.divisions.find(division =>
    division.teams.includes(userTeam())
  );
}

function getNeedleTargetAngle(division) {
  const finalAngles = {
    north: 180,
    west: 90,
    east: 270,
    south: 360
  };
  const compassKey = division?.compass || "south";
  return 1800 + (finalAngles[compassKey] || 360);
}

function renderDivisionOverview() {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Page 6",
    title: "Division Overview",
    subtitle: "All divisions are drawn. Click a team to inspect its squad."
  });

  shell.card.appendChild(primaryButton("Continue to Game 1", playNextLinearMatch));
  shell.card.appendChild(createUserDivisionCard());
  shell.card.appendChild(createDivisionGrid());
  app.appendChild(shell.section);
}

function createUserDivisionCard() {
  const card = document.createElement("div");
  card.className = "linear-mini-card user-division-card";

  const ownDivision = getUserDivision();

  const title = document.createElement("h3");
  title.textContent = ownDivision
    ? `You landed in the ${ownDivision.name} Division`
    : "Your division is drawn";

  const text = document.createElement("p");
  text.textContent = "Top four teams from every division reach the knockouts.";

  card.append(title, text);
  return card;
}

function createDivisionGrid() {
  const grid = document.createElement("div");
  grid.className = "division-overview-grid";

  appState.season.divisions.forEach(division => {
    const card = document.createElement("div");
    card.className = `division-overview-card compass-${division.compass}`;

    const title = document.createElement("h3");
    title.textContent = `${division.name} Division`;
    card.appendChild(title);

    division.teams.forEach(team => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = team === userTeam() ? "division-team-button own-team" : "division-team-button";
      button.textContent = team.name;
      button.addEventListener("click", () => {
        selectedTeam = team;
        renderPage06SeasonStats();
      });
      card.appendChild(button);
    });

    grid.appendChild(card);
  });

  return grid;
}

function renderTeamDetail(team) {
  const app = clearApp();
  const shell = pageShell({
    eyebrow: "Scouting Report",
    title: team.name,
    subtitle: `${team.formationId || "4-3-3"} - ${team.players.length} drafted players`
  });

  shell.card.appendChild(primaryButton("Back to Divisions", () => {
    selectedTeam = null;
    renderPage06SeasonStats();
  }));

  const report = document.createElement("div");
  report.className = "linear-mini-card division-scout-report";
  const reportTitle = document.createElement("h3");
  reportTitle.textContent = "Scout's Notes";
  const reportText = document.createElement("p");
  reportText.textContent = generateScoutingReport(team);
  report.append(reportTitle, reportText);
  shell.card.appendChild(report);

  const pitchWrapper = document.createElement("div");
  pitchWrapper.className = "linear-info-card-view division-team-pitch";
  pitchWrapper.appendChild(renderReadOnlyPitch(team));
  shell.card.appendChild(pitchWrapper);

  app.appendChild(shell.section);
}

function installPageSixStyles() {
  if (document.getElementById("pageSixStyles")) return;

  const style = document.createElement("style");
  style.id = "pageSixStyles";
  style.textContent = `
    .division-compass-draw {
      display: grid;
      justify-items: center;
      gap: 18px;
      padding: 18px 0;
    }

    .compass-ring {
      position: relative;
      width: min(60vw, 240px);
      height: min(60vw, 240px);
      border-radius: 50%;
      border: 2px solid rgba(209, 179, 110, 0.45);
      background: radial-gradient(circle, #16281b, #0a1510 68%);
      box-shadow: inset 0 0 34px rgba(0, 0, 0, 0.6), 0 0 30px rgba(209, 179, 110, 0.16);
    }

    .compass-ring span {
      position: absolute;
      color: #f2d68a;
      font-size: 20px;
      font-weight: 700;
    }

    .compass-ring .north { top: 12px; left: 50%; transform: translateX(-50%); }
    .compass-ring .east { right: 16px; top: 50%; transform: translateY(-50%); }
    .compass-ring .south { bottom: 12px; left: 50%; transform: translateX(-50%); }
    .compass-ring .west { left: 16px; top: 50%; transform: translateY(-50%); }

    .compass-needle {
      position: absolute;
      inset: 50% auto auto 50%;
      width: 10px;
      height: 100px;
      transform-origin: 50% 0;
      transform: rotate(0deg) translate(-50%, -4px);
      border-radius: 999px;
      background: linear-gradient(180deg, #f2d68a 0 50%, #8a5a32 50% 100%);
      animation: spinCompass 5s cubic-bezier(.15,.85,.25,1) forwards;
    }

    @keyframes spinCompass {
      from { transform: rotate(0deg) translate(-50%, -4px); }
      to { transform: rotate(var(--compass-target-angle, 2160deg)) translate(-50%, -4px); }
    }

    .division-overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 12px;
    }

    .division-overview-card {
      display: grid;
      gap: 8px;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(209, 179, 110, 0.28);
      background: linear-gradient(180deg, #13251a, #07110d);
    }

    .division-overview-card h3 {
      margin: 0;
      color: #f2d68a;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .division-team-button {
      width: 100%;
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid rgba(209, 179, 110, 0.32);
      color: #f3ead7;
      text-align: left;
      font-weight: 700;
      font-size: 13px;
      background: rgba(209, 179, 110, 0.08);
    }

    .division-team-button.own-team {
      color: #1b1008;
      border-color: rgba(217, 167, 61, .7);
      background: linear-gradient(180deg, #f0d48a, #bd9147 62%, #70441f);
    }

    .user-division-card {
      padding: 10px 14px;
      gap: 4px;
      border-color: rgba(209, 179, 110, 0.35);
    }

    .user-division-card h3 {
      font-size: 15px;
    }

    .user-division-card p {
      margin: 0;
      font-size: 12px;
    }

    .division-scout-report {
      border: 1px solid rgba(209, 179, 110, 0.35);
      background: rgba(209, 179, 110, 0.06);
    }

    .division-scout-report h3 {
      margin: 0 0 6px;
      color: #f2d68a;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .division-scout-report p {
      margin: 0;
      opacity: .92;
      line-height: 1.45;
    }

    .division-team-pitch {
      display: grid;
      gap: 14px;
      margin-top: 12px;
    }
  `;

  document.head.appendChild(style);
}
