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
    ensureGoalScorerLine(momentumCard, svg, scorers);
    enhanceGoalMarkers(sim, scorers);
  });
}

function ensureGoalScorerLine(momentumCard, svg, scorers) {
  momentumCard.querySelector(".live-goal-scorers-panel")?.remove();

  let line = momentumCard.querySelector(".live-goal-scorers-line");
  if (!line) {
    line = document.createElement("div");
    line.className = "live-goal-scorers-line";
    svg.insertAdjacentElement("beforebegin", line);
  }

  if (!scorers.length) {
    line.textContent = "Goal scorers: none yet";
    line.classList.add("empty");
    return;
  }

  line.classList.remove("empty");
  line.textContent = `Goal scorers: ${scorers.map(goal => `${goal.minute}' ${goal.scorer}`).join("  ·  ")}`;
}

function enhanceGoalMarkers(sim, scorers) {
  const markers = Array.from(sim.querySelectorAll(".live-goal-markers .live-goal-dot"));
  const markerTexts = Array.from(sim.querySelectorAll(".live-goal-markers .live-goal-text"));
  const markerGroup = sim.querySelector(".live-goal-markers");
  if (!markerGroup) return;

  markerGroup.querySelectorAll(".live-goal-minute-label, .live-goal-ball-icon").forEach(label => label.remove());

  markerTexts.forEach(textNode => {
    textNode.textContent = "";
    textNode.style.display = "none";
  });

  markers.forEach((marker, index) => {
    const goal = scorers[index];
    if (!goal) return;

    marker.querySelector("title")?.remove();
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = `${goal.minute}' ${goal.scorer} (${goal.team}) - ${goal.score}`;
    marker.appendChild(title);

    marker.classList.add("live-goal-ball-bg");
    marker.setAttribute("r", "0");
    marker.style.display = "none";
    marker.style.opacity = "0";

    const cx = Number(marker.getAttribute("cx") || 0);
    const cy = Number(marker.getAttribute("cy") || 0);

    const ball = document.createElementNS(SVG_NS, "text");
    ball.setAttribute("x", String(cx));
    ball.setAttribute("y", String(cy + 4));
    ball.setAttribute("class", "live-goal-ball-icon");
    ball.textContent = "⚽";
    markerGroup.appendChild(ball);
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

function installGoalScorerStyles() {
  if (document.getElementById("live-goal-scorers-styles")) return;

  const style = document.createElement("style");
  style.id = "live-goal-scorers-styles";
  style.textContent = `
    .live-goal-scorers-line {
      margin: 2px 0 4px;
      color: #d4d4d8;
      font-size: 11px;
      font-weight: 800;
      line-height: 1.35;
      text-align: center;
      opacity: 0.78;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .live-goal-scorers-line.empty {
      color: #a1a1aa;
      opacity: 0.48;
      font-weight: 700;
    }
    .live-goal-ball-bg {
      display: none !important;
      opacity: 0 !important;
      fill: transparent !important;
      stroke: transparent !important;
      stroke-width: 0 !important;
      filter: none !important;
    }
    .live-goal-ball-icon {
      font-family: inherit;
      font-size: 15px;
      text-anchor: middle;
      dominant-baseline: middle;
      pointer-events: none;
      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.75));
    }
    @media (max-width: 720px) {
      .live-goal-scorers-line {
        font-size: 10px;
        white-space: normal;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
  `;
  document.head.appendChild(style);
}
