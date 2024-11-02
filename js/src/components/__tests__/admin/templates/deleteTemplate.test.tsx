import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import ListTemplates from "../../../admin/templates/ListTemplates";
import { MemoryRouter, Route, Routes } from "react-router-dom";

test("Delete template", async () => {
  server.use(
    http.get("/regifair/v1/admin/templates", () => {
      return HttpResponse.json([
        { id: 1, name: "template1" },
        { id: 2, name: "template2" },
      ]);
    }),
  );

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<ListTemplates />} />
      </Routes>
    </MemoryRouter>,
  );

  await screen.findByText("Event templates");

  let rows = screen.getAllByRole("row");
  expect(rows.length).toEqual(3);

  let deleted = false;
  server.use(
    http.post("/regifair/v1/admin/templates/2", () => {
      deleted = true;
      return HttpResponse.json({});
    }),
  );

  const user = userEvent.setup();

  await user.click(within(rows[1]).getByRole("button", { name: "Delete" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  await user.click(within(rows[2]).getByRole("button", { name: "Delete" }));
  await user.click(screen.getByRole("button", { name: "Confirm" }));

  expect(deleted).toEqual(true);
  rows = screen.getAllByRole("row");
  expect(rows.length).toEqual(2);

  server.restoreHandlers();
});
