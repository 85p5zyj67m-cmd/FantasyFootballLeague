export async function loadLegacyGame() {
  const module = await import("../../js/linear/linearApp.js?v=react-shell-2");

  if (typeof module.bootLinearApp !== "function") {
    throw new Error("Legacy game module does not export bootLinearApp().");
  }

  return module.bootLinearApp;
}
