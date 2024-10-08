import * as React from "react";
import { test } from "vitest";
import { render, screen } from "@testing-library/react";
import EditEvent from "../../admin/events/EditEvent";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/api";
import { HttpResponse, http } from "msw";

/**
 * Base test function starting on "Create event" page opened
 */
export const createEventTest = (
  testDescription: string,
  editEvent: () => Promise<void>,
  verifyRequestPayload: (body: unknown) => void,
) => {
  test(testDescription, async () => {
    render(
      <MemoryRouter initialEntries={["/event/new"]}>
        <Routes>
          <Route path="/" element={<div></div>} />
          <Route path="/event/:eventId" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("Create event");

    let body: unknown;
    server.use(
      http.post("/wpoe/v1/admin/events", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 1 });
      }),
    );

    await editEvent();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    verifyRequestPayload(body);

    server.restoreHandlers();
  });
};
