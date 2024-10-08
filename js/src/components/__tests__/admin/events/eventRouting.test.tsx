import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import EventsRoot from "../../../admin/events/EventsRoot";

test("Navigate template pages", async () => {
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
        {
          id: 2,
          name: "event2",
          date: "2030-01-05",
          registrations: 0,
          postTitle: "example",
          postPermalink: "http://localhost/?p=42",
          hasMultipleReferences: false,
        },
      ]);
    }),
  );

  server.use(
    http.get("/wpoe/v1/admin/events/1", async () => {
      return HttpResponse.json({
        id: 1,
        name: "event1",
        date: "2030-01-01",
        formFields: [
          { id: 1, fieldType: "text", label: "text field", required: true },
        ],
        autoremove: true,
        autoremovePeriod: "30",
        waitingList: false,
        editableRegistrations: true,
        adminEmail: "template@example.com",
        extraEmailContent: null,
      });
    }),
  );

  server.use(
    http.get("/wpoe/v1/admin/events/1/registrations", async () => {
      return HttpResponse.json({
        total: 3,
        eventName: "event1",
        head: [{ label: "text", deleted: false }],
        body: [
          ["2024-06-14 20:00:16", "foo"],
          ["2024-06-15 09:00:00", "bar"],
          ["2024-06-18 13:10:21", "baz"],
        ],
      });
    }),
  );

  render(<EventsRoot />);
  const user = userEvent.setup();

  expect(await screen.findByText("Your events")).toBeInTheDocument();
  expect(screen.getAllByRole("row").length).toEqual(3);

  await user.click(screen.getByText("Add event"));
  await user.click(screen.getByText("From scratch"));
  expect(await screen.findByText("Create event")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByText("Your events")).toBeInTheDocument();

  await user.click(screen.getByText("event1"));
  expect(await screen.findByText("Edit event")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByText("Your events")).toBeInTheDocument();

  await user.click(screen.getByRole("link", { name: "3" }));
  expect(
    await screen.findByText(/Registrations for the event "event1"/),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("row").length).toEqual(4);

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByText("Your events")).toBeInTheDocument();

  server.restoreHandlers();
});
