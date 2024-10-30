import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import EditEvent from "../../../admin/events/EditEvent";

test("Event not found", async () => {
  server.use(
    http.get("/wpoe/v1/admin/events/1", () => {
      return HttpResponse.json({ code: "event_not_found" }, { status: 404 });
    }),
  );

  render(
    <MemoryRouter initialEntries={["/event/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("Event not found")).toBeInTheDocument();

  server.restoreHandlers();
});

test("Generic error when loading event", async () => {
  server.use(
    http.get("/wpoe/v1/admin/events/2", () => {
      return HttpResponse.json(
        { code: "generic_server_error", message: "A critical error happened" },
        { status: 500 },
      );
    }),
  );

  render(
    <MemoryRouter initialEntries={["/event/2"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>,
  );

  const errors = await screen.findAllByText(/A critical error happened/);
  expect(errors[0]).toBeInTheDocument();

  server.restoreHandlers();
});
