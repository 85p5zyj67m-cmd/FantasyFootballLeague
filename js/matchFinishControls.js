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
  const isFinished = replayComplete || (clock && /^90\+|^120|^FT/i.test(clock.textContent.trim()));

  if (!isFinished) return;

  if (clock) clock.textContent = "FINISH";

  let controls = card.querySelector(".post-match-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.className = "post-match-controls";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-btn post-match-next-btn";
    button.textContent = "Next Match";
    button.addEventListener("click", () => {
      const adjustBtn = document.getElementById("continueAfterTacticsBtn");
      const nextBtn = document.getElementById("simulateMatchBtn");
      const newSeasonBtn = document.getElementById("newSeasonBtn");

      if (adjustBtn && !adjustBtn.classList.contains("hidden")) {
        adjustBtn.click();
        return;
      }

      if (nextBtn && !nextBtn.classList.contains("hidden")) {
        nextBtn.click();
        return;
      }

      if (newSeasonBtn && !newSeasonBtn.classList.contains("hidden")) {
        newSeasonBtn.click();
      }
    });

    controls.appendChild(button);
    card.appendChild(controls);
  }

  document.body.classList.add("match-finished");
}
