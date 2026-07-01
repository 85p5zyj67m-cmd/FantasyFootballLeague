function focusStartDraftButton() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const target = buttons.find(button => {
    const text = (button.textContent || "").trim().toLowerCase();
    return text === "enter draft room" || text === "start draft";
  });

  if (!target || target.disabled) return;
  target.classList.add("start-primary-focus");
  target.focus({ preventScroll: true });
}

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(focusStartDraftButton, 80);
  window.setTimeout(focusStartDraftButton, 350);
});

const observer = new MutationObserver(() => {
  window.requestAnimationFrame(focusStartDraftButton);
});

window.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  if (app) observer.observe(app, { childList: true, subtree: true });
});
