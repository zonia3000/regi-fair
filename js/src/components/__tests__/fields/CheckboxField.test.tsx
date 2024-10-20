import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/api";
import { HttpResponse, http } from "msw";
import Form from "../../Form";

test("Render checkbox field", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  let requestBody: Record<string, string>;
  server.use(
    http.get("/wpoe/v1/events/1", async () => {
      return HttpResponse.json({
        formFields: [
          {
            id: 1,
            fieldType: "checkbox",
            label: "myfield",
            required: false,
            description: "mydescription",
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

  expect(requestBody["1"]).toEqual(false);

  const field = await screen.findByRole("checkbox", { name: "myfield" });
  expect(field).toBeInTheDocument();
  expect(field).not.toBeDisabled();
  expect(screen.getByText("mydescription")).toBeVisible();

  await user.click(field);

  await user.click(
    screen.getByRole("button", { name: "Register to the event" }),
  );

  expect(requestBody["1"]).toEqual(true);

  server.restoreHandlers();
});
