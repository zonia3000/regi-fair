import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/api";
import { HttpResponse, http } from "msw";
import Form from "../../Form";

test("Render privacy field", async () => {
  let loading = false;
  const setLoading = (l: boolean) => (loading = l);

  let requestBody: Record<string, string>;
  server.use(
    http.get("/wpoe/v1/events/1", () => {
      return HttpResponse.json({
        formFields: [
          {
            id: 1,
            fieldType: "privacy",
            label: "myfield",
            required: true,
            extra: {
              url: "http://www.example.com/privacy",
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

  const field = await screen.findByRole("checkbox", {
    name: "I accept the privacy policy",
  });
  expect(field).toBeInTheDocument();
  expect(field).not.toBeDisabled();

  const link = screen.getByRole("link", { name: "privacy policy" });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute("href", "http://www.example.com/privacy");

  await user.click(field);

  await user.click(
    screen.getByRole("button", { name: "Register to the event" }),
  );

  expect(requestBody["1"]).toEqual(true);

  server.restoreHandlers();
});
