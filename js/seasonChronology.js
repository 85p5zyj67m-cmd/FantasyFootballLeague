window.addEventListener("DOMContentLoaded", () => {
  installChronologyStyles();
  installTacticsSkip();

  const app = document.getElementById("app") || document.body;
  const observer = new MutationObserver(updateChronologyView);
  observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  window.setInterval(updateChronologyView, 500);
  updateChronologyView();
});

function installTacticsSkip() {
  const continueButton = document.getElementById("continueAfterTacticsBtn");
  if (!continueButton || continueButton.dataset.chronologyReady === "true") return;

  continueButton.dataset.chronologyReady = "true";
  continueButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const lockTacticsButton = document.getElementById("startSeasonBtn");
    const playButton = document.getElementById("simulateMatchBtn");

    if (lockTacticsButton) {
      lockTacticsButton.click();
    }

    window.setTimeout(() => {
      const refreshedPlayButton = document.getElementById("simulateMatchBtn") || playButton;
      if (refreshedPlayButton && !refreshedPlayButton.classList.contains("hidden")) {
        refreshedPlayButton.click();
      }
    }, 40);
  }, true);
}

function updateChronologyView() {
  document.body.classList.remove("live-match-focus", "match-finished");
  installTacticsSkip();

  const seasonScreen = document.getElementById("seasonScreen");
  if (!seasonScreen || seasonScreen.classList.contains("hidden")) return;

  const liveCard = document.getElementById("liveMatchCard");
  const schedule = document.getElementById("mySchedule");
  const results = document.getElementById("seasonResults");
  const nextCard = document.getElementById("nextMatchCard");
  const playButton = document.getElementById("simulateMatchBtn");
  const tacticsButton = document.getElementById("continueAfterTacticsBtn");
  const newSeasonButton = document.getElementById("newSeasonBtn");

  const hasRealMatch = liveCard && !liveCard.textContent.includes("Matchday Ready") && liveCard.textContent.trim().length > 0;
  const waitingForNextPhase = tacticsButton && !tacticsButton.classList.contains("hidden");
  const seasonComplete = newSeasonButton && !newSeasonButton.classList.contains("hidden");
  const overviewMode = !hasRealMatch || waitingForNextPhase || seasonComplete;

  document.body.classList.toggle("chronology-overview", overviewMode);
  document.body.classList.toggle("chronology-match", !overviewMode);

  if (liveCard) liveCard.style.display = overviewMode ? "none" : "block";
  if (nextCard) nextCard.style.display = overviewMode ? "block" : "none";
  if (schedule) schedule.style.display = overviewMode ? "block" : "none";
  if (results) results.style.display = overviewMode ? "block" : "none";

  if (playButton && !playButton.classList.contains("hidden")) {
    playButton.style.display = "block";
    playButton.style.width = "100%";
  }

  if (tacticsButton && !tacticsButton.classList.contains("hidden")) {
    tacticsButton.style.display = "block";
    tacticsButton.style.width = "100%";
    tacticsButton.textContent = getNextPhaseLabel();
  }

  if (newSeasonButton && !newSeasonButton.classList.contains("hidden")) {
    newSeasonButton.style.display = "block";
    newSeasonButton.style.width = "100%";
  }
}

function getNextPhaseLabel() {
  const title = document.getElementById("seasonPhaseTitle");
  const text = title ? title.textContent.toLowerCase() : "";

  if (text.includes("first half")) return "Play Second Half";
  if (text.includes("second half")) return "Play Round of 16";
  if (text.includes("round of 16")) return "Play Quarterfinal";
  if (text.includes("quarter")) return "Play Semifinal";
  if (text.includes("semi")) return "Play Final";
  return "Play Next Match";
}

function installChronologyStyles() {
  if (document.getElementById("chronologyStyles")) return;

  const style = document.createElement("style");
  style.id = "chronologyStyles";
  style.textContent = `
    .season-shell {
      display: grid;
      gap: 16px;
      max-width: 980px;
      margin: 0 auto;
    }

    .season-command,
    #liveMatchCard,
    #mySchedule,
    #seasonResults,
    #nextMatchCard {
      width: 100%;
    }

    .season-actions {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }

    .season-actions .primary-btn.hidden {
      display: none !important;
    }

    .season-actions .primary-btn:not(.hidden) {
      display: block !important;
      width: 100%;
    }

    .chronology-match #liveMatchCard {
      order: 1;
    }

    .chronology-match .season-command {
      order: 2;
    }

    .chronology-overview .season-command {
      order: 1;
    }

    .chronology-overview #mySchedule {
      order: 2;
    }

    .chronology-overview #seasonResults {
      order: 3;
    }
  `;

  document.head.appendChild(style);
}
