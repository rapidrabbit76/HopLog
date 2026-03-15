"use client";

import * as React from "react";

export default function AppReadyMarker() {
  React.useEffect(() => {
    document.documentElement.setAttribute("data-app-ready", "true");

    return () => {
      document.documentElement.removeAttribute("data-app-ready");
    };
  }, []);

  return null;
}
