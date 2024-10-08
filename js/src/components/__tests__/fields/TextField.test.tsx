import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/api";
import { HttpResponse, http } from "msw";
import Form from "../../Form";

test("Render required text field", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  server.use(
    http.get("/wpoe/v1/events/1", async () => {
      return HttpResponse.json({
        formFields: [
          { id: 1, fieldType: "text", label: "myfield", required: true },
        ],
      });
    }),
  );

  render(
    <Form
      disabled={false}
      admin={false}
      eventId={1}
      setLoading={setLoading}
      loading={loading}
    />,
  );

  const field = await screen.findByRole("textbox", { name: "myfield" });
  expect(field).toBeInTheDocument();
  expect(field).not.toBeDisabled();

  server.restoreHandlers();
});

test("Render optional text field, disabled", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  server.use(
    http.get("/wpoe/v1/events/1", async () => {
      return HttpResponse.json({
        formFields: [
          { id: 1, fieldType: "text", label: "myfield", required: false },
        ],
      });
    }),
  );

  render(
    <Form
      disabled={true}
      admin={false}
      eventId={1}
      setLoading={setLoading}
      loading={loading}
    />,
  );

  const field = await screen.findByRole("textbox", {
    name: "myfield (optional)",
  });
  expect(field).toBeInTheDocument();
  expect(field).toBeDisabled();

  server.restoreHandlers();
});

test("Edit text field", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  let requestBody: Record<string, string>;
  server.use(
    http.get("/wpoe/v1/events/1", async () => {
      return HttpResponse.json({
        formFields: [
          { id: 1, fieldType: "text", label: "myfield", required: true },
        ],
      });
    }),
    http.post("/wpoe/v1/events/1", async ({ request }) => {
      requestBody = (await request.json()) as Record<string, string>;
      return HttpResponse.json({ remaining: null });
    }),
  );

  render(
    <Form
      disabled={false}
      admin={false}
      eventId={1}
      setLoading={setLoading}
      loading={loading}
    />,
  );

  const field = await screen.findByRole("textbox", { name: "myfield" });
  expect(field).toBeInTheDocument();
  expect(field).not.toBeDisabled();

  const user = userEvent.setup();

  await user.type(field, "foo");

  await user.click(
    screen.getByRole("button", { name: "Register to the event" }),
  );

  expect(requestBody["1"]).toEqual("foo");

  server.restoreHandlers();
});
