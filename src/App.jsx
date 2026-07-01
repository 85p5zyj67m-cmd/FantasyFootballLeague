import { useEffect, useRef } from "react";
import "./appShell.css";

export default function App() {
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    import("../js/linear/linearApp.js?v=react-shell-safe-1").then(module => {
      if (typeof module.bootLinearApp === "function") {
        module.bootLinearApp();
      }
    });
  }, []);

  return <main id="app" aria-label="Fantasy Football League game" />;
}
