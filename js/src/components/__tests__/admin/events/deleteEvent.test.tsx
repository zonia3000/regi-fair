import * as React from "react";
import { expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import EventsRoot from "../../../admin/events/EventsRoot";
import type { EventConfiguration } from "../../../classes/event";

test("Delete last event", async () => {

  const events = [
    {
      id: 1,
      name: "event1",
      date: "2030-01-01",
      registrations: 3,
      postTitle: null,
      postPermalink: null,
      hasMultipleReferences: false,
    } as EventConfiguration
  ]

  server.use(
    http.get("/regifair/v1/admin/events", () => {
      return HttpResponse.json({
        events,
        total: events.length
      });
    }),
  );

  server.use(
    http.post("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({});
    }),
  );

  render(<EventsRoot />);
  const user = userEvent.setup();

  expect(await screen.findByText("Your events")).toBeInTheDocument();

  const rows = await screen.findAllByRole("row");
  expect(rows.length).toEqual(2);

  user.click(within(rows[1]).getByRole("button", { name: "Delete" }));
  let dialog = await screen.findByRole("dialog");
  user.click(within(dialog).getByRole("button", { name: "Cancel" }));

  events.splice(0);
  user.click(await within(rows[1]).findByRole("button", { name: "Delete" }));
  dialog = await screen.findByRole("dialog");
  user.click(within(dialog).getByRole("button", { name: "Confirm" }));

  expect(await screen.findByText("No events found")).toBeInTheDocument();

  server.restoreHandlers();
});

test("Deleting events should reload events list with proper page value", async () => {

  const events = [...new Array(21)].map((_, i) => ({
    "id": i + 1,
    "name": `event${i + 1}`,
    "date": "2050-01-01",
    "registrations": 0,
    "postTitle": null,
    "postPermalink": null,
    "hasMultipleReferences": false
  } as EventConfiguration));

  server.use(
    http.get("/regifair/v1/admin/events", ({ request }) => {
      const url = new URL(request.url);
      const page = url.searchParams.get('page');
      if (page === "1") {
        return HttpResponse.json({
          events: events.slice(0, 20),
          total: events.length,
        });
      } else if (page === "2") {
        return HttpResponse.json({
          events: events.slice(20),
          total: events.length,
        });
      } else {
        throw Error(`Unexpected page: ${page}`);
      }
    }),
    http.post("/regifair/v1/admin/events/21", () => {
      return HttpResponse.json({});
    }),
    http.post("/regifair/v1/admin/events/20", () => {
      return HttpResponse.json({});
    })
  );

  const user = userEvent.setup();
  render(<EventsRoot />);

  expect(await screen.findByRole("link", { name: "event1" })).toBeVisible();
  expect(await screen.findByRole("link", { name: "event2" })).toBeVisible();
  expect(await screen.findByRole("link", { name: "event20" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(20);

  // Go to page 2
  await user.click(screen.getByRole("button", { name: "Go to page 2" }));
  expect(await screen.findByRole("link", { name: "event21" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);

  // Delete event 21
  events.splice(20);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(await screen.findByRole("button", { name: "Confirm" }));

  // Verify that it goes back to page 1
  expect(await screen.findByRole("link", { name: "event1" })).toBeVisible();
  expect(await screen.findByRole("link", { name: "event2" })).toBeVisible();
  expect(await screen.findByRole("link", { name: "event20" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(20);

  // Delete event 20
  events.splice(19);
  await user.click(screen.getAllByRole("button", { name: "Delete" })[19]);
  await user.click(await screen.findByRole("button", { name: "Confirm" }));
  expect(await screen.findByRole("link", { name: "event1" })).toBeVisible();
  expect(await screen.findByRole("link", { name: "event19" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(19);

  server.restoreHandlers();
});
