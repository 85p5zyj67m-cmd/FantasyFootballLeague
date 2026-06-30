const SVG_NS = "http://www.w3.org/2000/svg";

let observer = null;
let queued = false;

export function installLiveGoalScorersEnhancer() {
  if (observer) return;

  installGoalScorerStyles();

  const app = document.getElementById("app");
  if (!app) return;

  observer = new MutationObserver(queueEnhancement);
  observer.observe(app, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] });

  queueEnhancement();
}

function queueEnhancement() {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(() => {
    queued = false;
    enhanceLiveGoalScorers();
  });
}

function enhanceLiveGoalScorers() {
  document.querySelectorAll(".linear-live-sim").forEach(sim => {
    const momentumCard = sim.querySelector(".live-momentum-card");
    const svg = momentumCard?.querySelector(".live-momentum-svg");
    if (!momentumCard || !svg) return;

    const scorers = getGoalScorers(sim);
    ensureGoalScorerPanel(momentumCard, svg, scorers);
    enhanceGoalMarkers(sim, scorers);
  });
}

function ensureGoalScorerPanel(momentumCard, svg, scorers) {
  let panel = momentumCard.querySelector(".live-goal-scorers-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "live-goal-scorers-panel";
    svg.insertAdjacentElement("afterend", panel);
  }

  panel.replaceChildren();

  const title = document.createElement("div");
  title.className = "live-goal-scorers-title";
  title.textContent = "Goal Scorers";
  panel.appendChild(title);

  if (!scorers.length) {
    const empty = document.createElement("p");
    empty.className = "live-goal-scorers-empty";
    empty.textContent = "No goals yet.";
    panel.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "live-goal-scorers-list";

  scorers.forEach(goal => {
    const row = document.createElement("div");
    row.className = `live-goal-scorer-row ${goal.side}`;

    const minute = document.createElement("span");
    minute.className = "live-goal-scorer-minute";
    minute.textContent = `${goal.minute}'`;

    const main = document.createElement("span");
    main.className = "live-goal-scorer-main";
    main.textContent = goal.scorer;

    const team = document.createElement("span");
    team.className = "live-goal-scorer-team";
    team.textContent = goal.team;

    const score = document.createElement("span");
    score.className = "live-goal-scorer-score";
    score.textContent = goal.score;

    row.append(minute, main, team, score);
    list.appendChild(row);
  });

  panel.appendChild(list);
}

function enhanceGoalMarkers(sim, scorers) {
  const markers = Array.from(sim.querySelectorAll(".live-goal-markers .live-goal-dot"));
  const markerTexts = Array.from(sim.querySelectorAll(".live-goal-markers .live-goal-text"));
  const markerGroup = sim.querySelector(".live-goal-markers");
  if (!markerGroup) return;

  markerGroup.querySelectorAll(".live-goal-minute-label").forEach(label => label.remove());

  markers.forEach((marker, index) => {
    const goal = scorers[index];
    if (!goal) return;

    marker.querySelector("title")?.remove();
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = `${goal.minute}' ${goal.scorer} (${goal.team}) - ${goal.score}`;
    marker.appendChild(title);

    const markerText = markerTexts[index];
    if (markerText) markerText.textContent = initials(goal.scorer);

    const cx = Number(marker.getAttribute("cx") || 0);
    const cy = Number(marker.getAttribute("cy") || 0);
    const minuteLabel = document.createElementNS(SVG_NS, "text");
    minuteLabel.setAttribute("x", String(cx));
    minuteLabel.setAttribute("y", String(goal.side === "away" ? cy + 24 : cy - 17));
    minuteLabel.setAttribute("class", "live-goal-minute-label");
    minuteLabel.textContent = `${goal.minute}'`;
    markerGroup.appendChild(minuteLabel);
  });
}

function getGoalScorers(sim) {
  const homeTeam = sim.querySelector(".home-team")?.textContent?.trim() || "Home";
  const awayTeam = sim.querySelector(".away-team")?.textContent?.trim() || "Away";

  const rows = Array.from(sim.querySelectorAll(".live-ticker-event.goal"));
  const goals = rows
    .map(row => {
      const minuteText = row.querySelector(".live-event-minute")?.textContent || "";
      const eventText = row.querySelector(".live-event-text")?.textContent || "";
      const minute = Number((minuteText.match(/\d+/) || [0])[0]);
      const side = row.classList.contains("away") ? "away" : "home";
      const team = side === "home" ? homeTeam : awayTeam;
      const scorer = extractScorer(eventText, team);
      const penaltyShootout = eventText.toLowerCase().includes("penalties");
      return { minute, side, team, scorer, eventText, penaltyShootout };
    })
    .filter(goal => !goal.penaltyShootout && goal.minute > 0)
    .sort((a, b) => a.minute - b.minute);

  let homeGoals = 0;
  let awayGoals = 0;

  return goals.map(goal => {
    if (goal.side === "home") homeGoals += 1;
    else awayGoals += 1;
    return {
      ...goal,
      score: `${homeGoals} - ${awayGoals}`
    };
  });
}

function extractScorer(text, teamName) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  const patterns = [
    /through ([^.]+?)(?:\.|$)/i,
    /and ([^.]+?) scores/i,
    /and ([^.]+?) converts/i,
    /([A-ZÀ-Ÿ][^.!?]+?) gets the final touch/i,
    /([A-ZÀ-Ÿ][^.!?]+?) fires in from distance/i,
    /and ([^.]+?) finishes/i,
    /finished by ([^.]+?)(?:\.|$)/i,
    /strike through ([^.]+?)(?:\.|$)/i
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match?.[1]) return cleanupScorer(match[1], teamName);
  }

  return "Unknown scorer";
}

function cleanupScorer(value, teamName) {
  return String(value || "")
    .replace(teamName, "")
    .replace(/^the\s+/i, "")
    .replace(/\s+for\s+$/i, "")
    .replace(/[.,!]+$/g, "")
    .trim() || "Unknown scorer";
}

function initials(name) {
  const parts = String(name || "G")
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function installGoalScorerStyles() {
  if (document.getElementById("live-goal-scorers-styles")) return;

  const style = document.createElement("style");
  style.id = "live-goal-scorers-styles";
  style.textContent = `
    .live-goal-scorers-panel {
      margin-top: 12px;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      background: rgba(5, 8, 7, 0.48);
    }
    .live-goal-scorers-title {
      margin-bottom: 8px;
      color: #f7c95f;
      font-size: 12px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      text-align: center;
    }
    .live-goal-scorers-empty {
      margin: 0;
      color: #a1a1aa;
      text-align: center;
      font-size: 13px;
    }
    .live-goal-scorers-list {
      display: grid;
      gap: 8px;
    }
    .live-goal-scorer-row {
      display: grid;
      grid-template-columns: 44px 1fr minmax(74px, auto) 54px;
      align-items: center;
      gap: 8px;
      padding: 9px 10px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f4f4f5;
      background: rgba(255, 255, 255, 0.045);
    }
    .live-goal-scorer-row.home { border-left: 4px solid #65e58d; }
    .live-goal-scorer-row.away { border-left: 4px solid #ef4444; }
    .live-goal-scorer-minute,
    .live-goal-scorer-score {
      color: #f7c95f;
      font-weight: 950;
      text-align: center;
    }
    .live-goal-scorer-main {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 950;
    }
    .live-goal-scorer-team {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #a1a1aa;
      font-size: 12px;
      font-weight: 800;
      text-align: right;
    }
    .live-goal-minute-label {
      fill: #f7c95f;
      font-family: inherit;
      font-size: 10px;
      font-weight: 950;
      text-anchor: middle;
      paint-order: stroke;
      stroke: rgba(0, 0, 0, 0.72);
      stroke-width: 3px;
    }
    .live-goal-text {
      font-size: 8.5px;
    }
    @media (max-width: 720px) {
      .live-goal-scorer-row {
        grid-template-columns: 38px 1fr 48px;
      }
      .live-goal-scorer-team {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}
