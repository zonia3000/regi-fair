import React from "react";
import TemplatesRoot from "./TemplatesRoot";
import { createRoot } from "react-dom/client";

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("regi-fair-templates");
  if (typeof container !== "undefined" && container !== null) {
    const root = createRoot(container);
    root.render(<TemplatesRoot />);
  }
});
