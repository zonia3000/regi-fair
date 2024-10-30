import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import ListTemplates from "../../../admin/templates/ListTemplates";
import { MemoryRouter, Route, Routes } from "react-router-dom";

test('Handles "No event templates found"', async () => {
  server.use(
    http.get("/wpoe/v1/admin/templates", () => {
      return HttpResponse.json([]);
    }),
  );

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<ListTemplates />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByText(/No event templates found/),
  ).toBeInTheDocument();

  server.restoreHandlers();
});
