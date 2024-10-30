import React from "react";
import EventRegistration from "./EventRegistration";
import { createRoot } from "react-dom/client";

document.addEventListener("DOMContentLoaded", function () {
  const containers = document.querySelectorAll("[data-wpoe-event-id]");
  containers.forEach((container) => {
    const eventId = parseInt(container.getAttribute("data-wpoe-event-id"));
    const root = createRoot(container);
    root.render(<EventRegistration eventId={eventId} />);
  });
});
