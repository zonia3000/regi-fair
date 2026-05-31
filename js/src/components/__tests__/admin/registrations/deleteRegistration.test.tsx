import * as React from "react";
import { expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import ListRegistrations from "../../../admin/events/registrations/ListRegistrations";
import { userEvent } from "@testing-library/user-event";

test("Delete registration", async () => {
  let registrations = [[1, "2024-09-15 20:27:03", "mario"]];

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations", () => {
      return HttpResponse.json({
        head: [{ label: "name" }],
        body: registrations,
        total: 1,
        totalParticipants: 1,
      });
    }),
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        formFields: [],
      });
    })
  );

  server.use(
    http.post("/regifair/v1/admin/events/1/registrations/1", () => {
      registrations = [];
      return new Response(null, { status: 204 });
    })
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route
          path="/event/:eventId/registrations"
          element={<ListRegistrations waiting={false} />}
        />
      </Routes>
    </MemoryRouter>
  );

  expect(
    await screen.findByText(/Registrations for the event/)
  ).toBeInTheDocument();

  const user = userEvent.setup();
  expect(screen.getAllByRole("row")).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", {
      name: "Confirm",
    })
  );

  expect(registrations).toHaveLength(0);
  await expect.poll(() => screen.getAllByRole("row")).toHaveLength(1);

  server.restoreHandlers();
});

test("Error happens while deleting a registration", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1/registrations", () => {
      return HttpResponse.json({
        head: [{ label: "name" }],
        body: [[1, "2024-09-15 20:27:03", "mario"]],
        total: 1,
        totalParticipants: 1,
      });
    }),
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        formFields: [],
      });
    })
  );

  server.use(
    http.post("/regifair/v1/admin/events/1/registrations/1", () => {
      return HttpResponse.json(
        { code: "generic_error", message: "A critical error happened" },
        { status: 500 }
      );
    })
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route
          path="/event/:eventId/registrations"
          element={<ListRegistrations waiting={false} />}
        />
      </Routes>
    </MemoryRouter>
  );

  expect(
    await screen.findByText(/Registrations for the event/)
  ).toBeInTheDocument();

  expect(await screen.findAllByRole("row")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", {
      name: "Confirm",
    })
  );

  const errors = await screen.findAllByText(/A critical error happened/);
  expect(errors[0]).toBeInTheDocument();

  server.restoreHandlers();
});

test("Deleting registrations should reload registrations list with proper page value", { timeout: 15_000 }, async () => {

  const registrations = [...new Array(21)].map((_, i) => ([i + 1, "2024-09-15 20:27:03", `name${i + 1}`]));

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations", ({ request }) => {
      const url = new URL(request.url);
      const page = url.searchParams.get('page');
      if (page === "1") {
        return HttpResponse.json({
          head: [{ label: "name" }],
          body: registrations.slice(0, 20),
          total: registrations.length,
          totalParticipants: registrations.length,
        });
      } else if (page === "2") {
        return HttpResponse.json({
          head: [{ label: "name" }],
          body: registrations.slice(20),
          total: registrations.length,
          totalParticipants: registrations.length,
        });
      } else {
        throw Error(`Unexpected page: ${page}`);
      }
    }),
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        formFields: [],
      });
    }),
    http.post("/regifair/v1/admin/events/1/registrations/21", () => {
      return new Response(null, { status: 204 });
    }),
    http.post("/regifair/v1/admin/events/1/registrations/20", () => {
      return new Response(null, { status: 204 });
    })
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route
          path="/event/:eventId/registrations"
          element={<ListRegistrations waiting={false} />}
        />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByRole("cell", { name: "name1" })).toBeVisible();
  expect(await screen.findByRole("cell", { name: "name2" })).toBeVisible();
  expect(await screen.findByRole("cell", { name: "name20" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(20);

  // Go to page 2
  await user.click(screen.getByRole("button", { name: "Go to page 2" }));
  expect(await screen.findByRole("cell", { name: "name21" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(1);

  // Delete registration 21
  registrations.splice(20);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await user.click(await screen.findByRole("button", { name: "Confirm" }));

  // Verify that it goes back to page 1
  expect(await screen.findByRole("cell", { name: "name1" })).toBeVisible();
  expect(await screen.findByRole("cell", { name: "name2" })).toBeVisible();
  expect(await screen.findByRole("cell", { name: "name20" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(20);

  // Delete registration 20
  registrations.splice(19);
  await user.click(screen.getAllByRole("button", { name: "Delete" })[19]);
  await user.click(await screen.findByRole("button", { name: "Confirm" }));
  expect(await screen.findByRole("cell", { name: "name1" })).toBeVisible();
  expect(await screen.findByRole("cell", { name: "name19" })).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(19);

  server.restoreHandlers();
});
