import React from "react";
import EventsRoot from "./EventsRoot";
import { createRoot } from "react-dom/client";

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("regi-fair-events");
  if (typeof container !== "undefined" && container !== null) {
    const root = createRoot(container);
    root.render(<EventsRoot />);
  }
});
