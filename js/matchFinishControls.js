window.addEventListener("DOMContentLoaded", () => {
  const liveMatchCard = document.getElementById("liveMatchCard");
  if (!liveMatchCard) return;

  const observer = new MutationObserver(() => updateFinishControls(liveMatchCard));
  observer.observe(liveMatchCard, { childList: true, subtree: true, characterData: true });
  updateFinishControls(liveMatchCard);
});

function updateFinishControls(container) {
  const card = container.querySelector(".live-replay-card");
  if (!card) return;

  const clock = card.querySelector(".replay-clock");
  const replayComplete = card.textContent.includes("Replay complete");
  const clockText = clock ? clock.textContent.trim() : "";
  const isFinished = replayComplete || /^90\+|^120|^FT|^FINISH/i.test(clockText);

  if (!isFinished) return;

  if (clock) clock.textContent = "FINISH";
  document.body.classList.add("match-finished");

  let controls = card.querySelector(".post-match-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.className = "post-match-controls";
    card.appendChild(controls);
  }

  const seasonActions = document.querySelector(".season-actions");
  if (!seasonActions) return;

  controls.replaceChildren();
  controls.appendChild(seasonActions);

  const simulateBtn = document.getElementById("simulateMatchBtn");
  const tacticsBtn = document.getElementById("continueAfterTacticsBtn");
  const newSeasonBtn = document.getElementById("newSeasonBtn");

  [simulateBtn, tacticsBtn, newSeasonBtn].forEach(button => {
    if (!button) return;
    button.classList.add("post-match-action-btn");
  });

  if (tacticsBtn && !tacticsBtn.classList.contains("hidden")) {
    tacticsBtn.textContent = "Next Match";
  }

  if (simulateBtn && !simulateBtn.classList.contains("hidden")) {
    simulateBtn.textContent = simulateBtn.textContent || "Next Match";
  }
}
