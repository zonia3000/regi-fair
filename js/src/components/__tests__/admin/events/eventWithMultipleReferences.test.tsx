import * as React from "react";
import { expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import EventsRoot from "../../../admin/events/EventsRoot";

test("Open event with multiple references modal", async () => {
  server.use(
    http.get("/regifair/v1/admin/events", () => {
      return HttpResponse.json([
        {
          id: 1,
          name: "event1",
          date: "2030-01-01",
          registrations: 0,
          postTitle: "example",
          postPermalink: "http://localhost/?p=42",
          hasMultipleReferences: true,
        },
      ]);
    }),
  );

  server.use(
    http.get("/regifair/v1/admin/events/1/references", () => {
      return HttpResponse.json([
        { title: "example", permalink: "http://localhost/?p=42" },
        { title: "example2", permalink: "http://localhost/?p=43" },
      ]);
    }),
  );

  render(<EventsRoot />);
  const user = userEvent.setup();

  expect(await screen.findByText("Your events")).toBeInTheDocument();
  expect(screen.getAllByRole("row").length).toEqual(2);

  await user.click(screen.getByLabelText("Warning"));
  const dialog = await screen.findByRole("dialog");

  expect(
    within(dialog).getByText("Event form is referenced in multiple posts"),
  ).toBeInTheDocument();
  expect(within(dialog).getAllByRole("listitem").length).toEqual(2);

  server.restoreHandlers();
});
