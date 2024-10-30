import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/api";
import { HttpResponse, http } from "msw";
import Form from "../../Form";

test("Render dropdown field", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  let requestBody: Record<string, string>;
  server.use(
    http.get("/wpoe/v1/events/1", () => {
      return HttpResponse.json({
        formFields: [
          {
            id: 1,
            fieldType: "dropdown",
            label: "myfield",
            required: false,
            description: "mydescription",
            extra: {
              options: ["A", "B"],
              multiple: false,
            },
          },
        ],
      });
    }),
    http.post("/wpoe/v1/events/1", async ({ request }) => {
      requestBody = (await request.json()) as Record<string, string>;
      return HttpResponse.json({ remaining: null });
    }),
  );

  const user = userEvent.setup();

  render(
    <Form
      disabled={false}
      admin={false}
      eventId={1}
      setLoading={setLoading}
      loading={loading}
    />,
  );

  await user.click(
    await screen.findByRole("button", { name: "Register to the event" }),
  );

  expect(requestBody["1"]).toEqual("");

  const field = await screen.findByRole("combobox", {
    name: "myfield (optional)",
  });
  expect(field).toBeInTheDocument();
  expect(field).not.toBeDisabled();
  expect(screen.getByText("mydescription")).toBeVisible();

  await user.selectOptions(field, "A");

  await user.click(
    screen.getByRole("button", { name: "Register to the event" }),
  );

  expect(requestBody["1"]).toEqual("A");

  server.restoreHandlers();
});

test("Render dropdown field - multiple", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  let requestBody: Record<string, string>;
  server.use(
    http.get("/wpoe/v1/events/1", () => {
      return HttpResponse.json({
        formFields: [
          {
            id: 1,
            fieldType: "dropdown",
            label: "myfield",
            required: true,
            extra: {
              options: ["A", "B", "C"],
              multiple: true,
            },
          },
        ],
      });
    }),
    http.post("/wpoe/v1/events/1", async ({ request }) => {
      requestBody = (await request.json()) as Record<string, string>;
      return HttpResponse.json({ remaining: null });
    }),
  );

  const user = userEvent.setup();

  render(
    <Form
      disabled={false}
      admin={false}
      eventId={1}
      setLoading={setLoading}
      loading={loading}
    />,
  );

  const field = await screen.findByRole("listbox", { name: "myfield" });
  expect(field).toBeInTheDocument();
  expect(field).not.toBeDisabled();

  await user.selectOptions(field, ["B", "C"]);

  await user.click(
    screen.getByRole("button", { name: "Register to the event" }),
  );

  expect(requestBody["1"]).toEqual(["B", "C"]);

  server.restoreHandlers();
});
