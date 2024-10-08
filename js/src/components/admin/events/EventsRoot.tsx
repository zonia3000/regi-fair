import React from "react";
import EditEvent from "./EditEvent";
import ListEvents from "./ListEvents";
import { Routes, Route, HashRouter as Router } from "react-router-dom";
import ListRegistrations from "./registrations/ListRegistrations";
import EditRegistration from "./registrations/EditRegistration";

const EventsRoot = () => {
  return (
    <div className="wrap">
      <Router>
        <Routes>
          <Route path="/" element={<ListEvents />} />
          <Route path="/event/:eventId" element={<EditEvent />} />
          <Route
            path="/event/:eventId/registrations"
            element={<ListRegistrations waiting={false} />}
          />
          <Route
            path="/event/:eventId/registrations/waiting"
            element={<ListRegistrations waiting={true} />}
          />
          <Route
            path="/event/:eventId/registrations/:registrationId"
            element={<EditRegistration />}
          />
        </Routes>
      </Router>
    </div>
  );
};

export default EventsRoot;
