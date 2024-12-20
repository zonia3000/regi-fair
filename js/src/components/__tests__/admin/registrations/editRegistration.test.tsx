import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";
import EditRegistration from "../../../admin/events/registrations/EditRegistration";
import userEvent from "@testing-library/user-event";

test("Event not found", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json(
        {
          code: "event_not_found",
          message: "Event not found",
        },
        { status: 404 },
      );
    }),
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route
          path="/event/:eventId/registrations/:registrationId"
          element={<EditRegistration />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    (await screen.findAllByText("Registration not found"))[0],
  ).toBeInTheDocument();

  server.restoreHandlers();
});

test("Registration not found", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        id: 1,
        name: "test",
        formFields: [
          { id: 1, fieldType: "text", label: "name", required: true },
        ],
      });
    }),
  );

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations/1", () => {
      return HttpResponse.json(
        {
          code: "registration_not_found",
          message: "Registration not found",
        },
        { status: 404 },
      );
    }),
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route
          path="/event/:eventId/registrations/:registrationId"
          element={<EditRegistration />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    (await screen.findAllByText("Registration not found"))[0],
  ).toBeInTheDocument();

  server.restoreHandlers();
});

test("Update registration without email field", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        id: 1,
        name: "test",
        formFields: [
          { id: 1, fieldType: "text", label: "name", required: true },
        ],
      });
    }),
  );

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations/1", () => {
      return HttpResponse.json({ values: { 1: "foo" } });
    }),
  );

  let requestBody: Record<string, string>;
  server.use(
    http.post(
      "/regifair/v1/admin/events/1/registrations/1&sendEmail=false",
      async ({ request }) => {
        requestBody = (await request.json()) as Record<string, string>;
        return new Response(null, { status: 204 });
      },
    ),
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<div>BACK</div>} />
        <Route
          path="/event/:eventId/registrations/:registrationId"
          element={<EditRegistration />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText(/Edit registration/)).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "name" })).toHaveValue("foo");

  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox"), "bar");
  await user.click(screen.getByRole("button", { name: "Update" }));

  expect(requestBody["1"]).toEqual("foobar");
  expect(await screen.findByText(/BACK/)).toBeInTheDocument();

  server.restoreHandlers();
});

test("Update registration with email field", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        id: 1,
        name: "test",
        formFields: [
          {
            id: 1,
            fieldType: "email",
            label: "email",
            required: true,
            extra: { confirmationAddress: true },
          },
        ],
      });
    }),
  );

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations/1", () => {
      return HttpResponse.json({ values: { 1: "foo@example.com" } });
    }),
  );

  let requestBody: Record<string, string>;
  server.use(
    http.post(
      "/regifair/v1/admin/events/1/registrations/1&sendEmail=true",
      async ({ request }) => {
        requestBody = (await request.json()) as Record<string, string>;
        return new Response(null, { status: 204 });
      },
    ),
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<div>BACK</div>} />
        <Route
          path="/event/:eventId/registrations/:registrationId"
          element={<EditRegistration />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText(/Edit registration/)).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "email" })).toHaveValue(
    "foo@example.com",
  );
  expect(screen.getByRole("checkbox")).toBeChecked();

  const user = userEvent.setup();
  await user.clear(screen.getByRole("textbox"));
  await user.type(screen.getByRole("textbox"), "bar@example.com");
  await user.click(screen.getByRole("button", { name: "Update" }));

  expect(requestBody["1"]).toEqual("bar@example.com");
  expect(await screen.findByText(/BACK/)).toBeInTheDocument();

  server.restoreHandlers();
});

test("Update registration failing validation", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        id: 1,
        name: "test",
        availableSeats: 3,
        formFields: [
          {
            id: 1,
            fieldType: "email",
            label: "email",
            required: true,
            extra: { confirmationAddress: true },
          },
        ],
      });
    }),
  );

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations/1", () => {
      return HttpResponse.json({ values: { 1: "foo@example.com" } });
    }),
  );

  let requestBody: Record<string, string>;
  server.use(
    http.post(
      "/regifair/v1/admin/events/1/registrations/1&sendEmail=false",
      async ({ request }) => {
        requestBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json(
          {
            code: "invalid_form_fields",
            data: { fieldsErrors: { 1: "Field is required" } },
          },
          { status: 400 },
        );
      },
    ),
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route
          path="/event/:eventId/registrations/:registrationId"
          element={<EditRegistration />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText(/Edit registration/)).toBeInTheDocument();
  expect(
    (await screen.findAllByText(/There are still 3 seats available/))[0],
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "email" })).toHaveValue(
    "foo@example.com",
  );
  expect(screen.getByRole("checkbox")).toBeChecked();

  const user = userEvent.setup();
  await user.click(screen.getByRole("checkbox"));
  await user.clear(screen.getByRole("textbox"));
  await user.click(screen.getByRole("button", { name: "Update" }));

  expect(requestBody["1"]).toEqual("");

  expect(await screen.findByText("Field is required")).toBeInTheDocument();

  server.restoreHandlers();
});

test("Display confirmed registration", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        id: 1,
        name: "test",
        availableSeats: 3,
        formFields: [
          { id: 1, fieldType: "text", label: "name", required: true },
        ],
      });
    }),
  );

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations/1", () => {
      return HttpResponse.json({ values: { 1: "foo" }, waitingList: false });
    }),
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/event/1/registrations/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<div>BACK</div>} />
        <Route
          path="/event/:eventId/registrations/:registrationId"
          element={<EditRegistration />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    (await screen.findAllByText(/There are still 3 seats available/))[0],
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByText(/BACK/)).toBeInTheDocument();

  server.restoreHandlers();
});

test("Display registration in waiting list", async () => {
  server.use(
    http.get("/regifair/v1/admin/events/1", () => {
      return HttpResponse.json({
        id: 1,
        name: "test",
        availableSeats: 0,
        formFields: [
          { id: 1, fieldType: "text", label: "name", required: true },
        ],
      });
    }),
  );

  server.use(
    http.get("/regifair/v1/admin/events/1/registrations/1", () => {
      return HttpResponse.json({ values: { 1: "foo" }, waitingList: true });
    }),
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/event/1/registrations/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route
          path="/event/:eventId/registrations/waiting"
          element={<div>BACK</div>}
        />
        <Route
          path="/event/:eventId/registrations/:registrationId"
          element={<EditRegistration />}
        />
      </Routes>
    </MemoryRouter>,
  );

  expect(
    await screen.findByText(/This registration is in the waiting list/),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(await screen.findByText(/BACK/)).toBeInTheDocument();

  server.restoreHandlers();
});
