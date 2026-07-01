import { useEffect, useRef, useState } from "react";
import { loadLegacyGame } from "./loadLegacyGame.js";

export default function LegacyGameHost() {
  const bootedRef = useRef(false);
  const [startupError, setStartupError] = useState(null);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    let cancelled = false;

    async function bootGame() {
      try {
        const bootLinearApp = await loadLegacyGame();
        if (!cancelled) bootLinearApp();
      } catch (error) {
        console.error("Fantasy Football League failed to boot", error);
        if (!cancelled) setStartupError(error);
      }
    }

    bootGame();

    return () => {
      cancelled = true;
    };
  }, []);

  if (startupError) {
    return (
      <main id="app" aria-label="Fantasy Football League game">
        <section className="linear-page">
          <div className="linear-card">
            <p className="eyebrow">Startup Error</p>
            <h1>Fantasy Football League could not start</h1>
            <p className="subtitle">Check the browser console for details.</p>
          </div>
        </section>
      </main>
    );
  }

  return <main id="app" aria-label="Fantasy Football League game" />;
}
