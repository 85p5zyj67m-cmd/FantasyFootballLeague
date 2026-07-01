import { useEffect, useState } from "react";

export function useLegacyRoute(initialRoute = "page01") {
  const [routeName, setRouteName] = useState(initialRoute);

  useEffect(() => {
    function handleRouteAfterRender(event) {
      const nextRouteName = event && event.detail ? event.detail.routeName : null;
      if (nextRouteName) setRouteName(nextRouteName);
    }

    window.addEventListener("ffl:route-after-render", handleRouteAfterRender);
    return () => window.removeEventListener("ffl:route-after-render", handleRouteAfterRender);
  }, []);

  return routeName;
}
