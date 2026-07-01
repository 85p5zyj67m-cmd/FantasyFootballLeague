import { useEffect, useRef } from "react";
import "./appShell.css";

export default function App() {
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    let cancelled = false;

    async function bootGame() {
      try {
        const module = await import("../js/linear/linearApp.js?v=react-shell-1");
        if (!cancelled) {
          module.bootLinearApp?.();
        }
      } catch (error) {
        console.error("Fantasy Football League failed to boot", error);
        const app = document.getElementById("app");
        if (app) {
          app.innerHTML = `
            <section class="linear-page">
              <div class="linear-card">
                <p class="eyebrow">Startup Error</p>
                <h1>Fantasy Football League could not start</h1>
                <p class="subtitle">Check the browser console for details.</p>
              </div>
            </section>
          `;
        }
      }
    }

    bootGame();

    return () => {
      cancelled = true;
    };
  }, []);

  return <main id="app" aria-label="Fantasy Football League game" />;
}
