import * as React from "react";
import { expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import EventsRoot from "../../../admin/events/EventsRoot";

test("Delete event", async () => {
  server.use(
    http.get("/wpoe/v1/admin/events", async () => {
      return HttpResponse.json([
        {
          id: 1,
          name: "event1",
          date: "2030-01-01",
          registrations: 3,
          postTitle: null,
          postPermalink: null,
          hasMultipleReferences: false,
        },
      ]);
    }),
  );

  server.use(
    http.post("/wpoe/v1/admin/events/1", async () => {
      return HttpResponse.json({});
    }),
  );

  render(<EventsRoot />);
  const user = userEvent.setup();

  expect(await screen.findByText("Your events")).toBeInTheDocument();

  const rows = screen.getAllByRole("row");
  expect(rows.length).toEqual(2);

  user.click(within(rows[1]).getByRole("button", { name: "Delete" }));
  let dialog = await screen.findByRole("dialog");
  user.click(within(dialog).getByRole("button", { name: "Cancel" }));

  user.click(await within(rows[1]).findByRole("button", { name: "Delete" }));
  dialog = await screen.findByRole("dialog");
  user.click(within(dialog).getByRole("button", { name: "Confirm" }));

  expect(await screen.findByText("No events found")).toBeInTheDocument();

  server.restoreHandlers();
});
