window.addEventListener("DOMContentLoaded", () => {
  const liveMatchCard = document.getElementById("liveMatchCard");
  if (!liveMatchCard) return;

  const observer = new MutationObserver(() => enhanceFocusLayout(liveMatchCard));
  observer.observe(liveMatchCard, { childList: true, subtree: true });
  enhanceFocusLayout(liveMatchCard);
});

function enhanceFocusLayout(container) {
  const card = container.querySelector(".live-replay-card");
  if (!card) return;

  document.body.classList.add("live-match-focus");

  const oldStats = card.querySelector(".match-stats");
  const events = card.querySelector(".live-events");

  if (!oldStats || !events || card.querySelector(".focus-match-stats")) return;

  const stats = buildFocusStats(oldStats);
  card.appendChild(stats);
}

function buildFocusStats(oldStats) {
  const source = Array.from(oldStats.querySelectorAll(".stat-pill"));
  const values = Object.fromEntries(source.map(pill => {
    const label = pill.querySelector("span")?.textContent || "";
    const value = pill.querySelector("strong")?.textContent || "-";
    return [label.toLowerCase(), value];
  }));

  const shots = splitScore(values.shots || "0 - 0");
  const xg = splitScore(values.xg || "0.0 - 0.0");
  const possessionHome = estimatePossession(xg.home, shots.home);
  const possessionAway = 100 - possessionHome;
  const cornersHome = Math.max(1, Math.round(shots.home / 3));
  const cornersAway = Math.max(1, Math.round(shots.away / 3));
  const passesHome = 280 + possessionHome * 5 + shots.home * 8;
  const passesAway = 280 + possessionAway * 5 + shots.away * 8;

  const wrapper = document.createElement("div");
  wrapper.className = "focus-match-stats";
  wrapper.append(
    createStat("Possession", `${possessionHome}% - ${possessionAway}%`),
    createStat("Shots", `${shots.home} - ${shots.away}`),
    createStat("xG", `${xg.home.toFixed(1)} - ${xg.away.toFixed(1)}`),
    createStat("Corners", `${cornersHome} - ${cornersAway}`),
    createStat("Passes", `${Math.round(passesHome)} - ${Math.round(passesAway)}`),
    createStat("Duels", `${48 + shots.home} - ${48 + shots.away}`)
  );
  return wrapper;
}

function createStat(label, value) {
  const row = document.createElement("div");
  row.className = "focus-stat-row";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  row.append(labelNode, valueNode);
  return row;
}

function splitScore(value) {
  const parts = value.split("-").map(part => Number(part.trim()) || 0);
  return { home: parts[0] || 0, away: parts[1] || 0 };
}

function estimatePossession(homeXg, homeShots) {
  const raw = 50 + (homeXg - 0.8) * 9 + (homeShots - 5) * 1.4;
  return Math.max(38, Math.min(62, Math.round(raw)));
}
