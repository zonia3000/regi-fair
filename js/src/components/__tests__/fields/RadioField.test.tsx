import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/api";
import { HttpResponse, http } from "msw";
import Form from "../../Form";

test("Render required radio field", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  let requestBody: Record<string, string>;
  server.use(
    http.get("/regifair/v1/events/1", () => {
      return HttpResponse.json({
        formFields: [
          {
            id: 1,
            fieldType: "radio",
            label: "myfield",
            required: true,
            description: "mydescription",
            extra: { options: ["option1", "option2"] },
          },
        ],
      });
    }),
    http.post("/regifair/v1/events/1", async ({ request }) => {
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

  const field1 = await screen.findByRole("radio", { name: "option1" });
  expect(field1).toBeInTheDocument();
  expect(field1).not.toBeDisabled();

  const field2 = await screen.findByRole("radio", { name: "option2" });
  expect(field2).toBeInTheDocument();
  expect(field2).not.toBeDisabled();

  expect(screen.getByText("mydescription")).toBeVisible();

  const user = userEvent.setup();
  await user.click(field2);

  await user.click(
    screen.getByRole("button", { name: "Register to the event" }),
  );

  expect(requestBody["1"]).toEqual("option2");

  server.restoreHandlers();
});
