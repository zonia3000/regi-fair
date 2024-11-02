import React from "react";
import Settings from "./Settings";
import { createRoot } from "react-dom/client";

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("regi-fair-settings");
  if (typeof container !== "undefined" && container !== null) {
    const root = createRoot(container);
    root.render(<Settings />);
  }
});
