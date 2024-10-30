import * as React from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../__mocks__/api";
import { HttpResponse, http } from "msw";
import EventRegistration from "../../users/EventRegistration";

describe("Event registration", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  test("Edit existing registration", async () => {
    window.location.hash = "#registration=1234";

    let requestBody: Record<string, string>;
    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          editableRegistrations: true,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
      http.get("/wpoe/v1/events/1/1234", () => {
        return HttpResponse.json({ values: { 1: "myvalue" } });
      }),
      http.post("/wpoe/v1/events/1/1234", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json({ remaining: null });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const field1 = await screen.findByRole("textbox", { name: "myfield" });
    expect(field1).toHaveValue("myvalue");

    const msg1 = screen.getAllByText(
      /You are editing an existing registration/,
    );
    expect(msg1.length).toBeGreaterThan(1);

    const user = userEvent.setup();
    await user.type(field1, "-updated");
    await user.click(
      screen.getByRole("button", { name: "Update the registration" }),
    );

    expect(requestBody["1"]).toEqual("myvalue-updated");

    const msg2 = screen.getAllByText(/Your registration has been updated/);
    expect(msg2.length).toBeGreaterThan(1);

    server.restoreHandlers();
  });

  test("Delete existing registration", async () => {
    window.location.hash = "#registration=1234";

    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          editableRegistrations: true,
          availableSeats: 2,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
      http.get("/wpoe/v1/events/1/1234", () => {
        return HttpResponse.json({ values: { 1: "myvalue" } });
      }),
      http.post("/wpoe/v1/events/1/1234", () => {
        return HttpResponse.json({ remaining: 3 });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const field1 = await screen.findByRole("textbox", { name: "myfield" });
    expect(field1).toHaveValue("myvalue");

    const msg1 = screen.getAllByText(
      /You are editing an existing registration/,
    );
    expect(msg1.length).toBeGreaterThan(0);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Delete the registration" }),
    );

    const modal = screen.getByRole("dialog", {
      name: "Confirm registration deletion",
    });
    expect(modal).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    const msg2 = screen.getAllByText(/Your registration has been deleted/);
    expect(msg2.length).toBeGreaterThan(0);

    server.restoreHandlers();
  });

  test("Opening existing registration with no more seats available", async () => {
    window.location.hash = "#registration=1234";

    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          editableRegistrations: true,
          availableSeats: 0,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
      http.get("/wpoe/v1/events/1/1234", () => {
        return HttpResponse.json({ values: { 1: "myvalue" } });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const field1 = await screen.findByRole("textbox", { name: "myfield" });
    expect(field1).toHaveValue("myvalue");

    const msg1 = screen.getAllByText(
      /You are editing an existing registration/,
    );
    expect(msg1.length).toBeGreaterThan(0);
    const msg2 = screen.getAllByText(/There are no more seats available/);
    expect(msg2.length).toBeGreaterThan(0);

    server.restoreHandlers();
  });

  test("Open event with available seats", async () => {
    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          availableSeats: 10,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const msg = await screen.findAllByText(
      /There are still 10 seats available/,
    );
    expect(msg.length).toBeGreaterThan(0);

    const field1 = await screen.findByRole("textbox", { name: "myfield" });
    expect(field1).toBeInTheDocument();

    server.restoreHandlers();
  });

  test("Open event without available seats", async () => {
    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          availableSeats: 0,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const msg = await screen.findAllByText(/there are no more seats available/);
    expect(msg.length).toBeGreaterThan(0);

    const fields = screen.queryAllByRole("textbox", { name: "myfield" });
    expect(fields.length).toBe(0);

    server.restoreHandlers();
  });

  test("Register the last seat", async () => {
    let requestBody: Record<string, string>;
    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          availableSeats: 1,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
      http.post("/wpoe/v1/events/1", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json({ remaining: 0 });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const msg1 = await screen.findAllByText(
      /there are no more seats available/,
    );
    expect(msg1.length).toBeGreaterThan(0);

    const field = await screen.findByRole("textbox", { name: "myfield" });

    const user = userEvent.setup();
    await user.type(field, "foo");
    await user.click(
      screen.getByRole("button", { name: "Register to the event" }),
    );

    expect(requestBody["1"]).toEqual("foo");

    const msg2 = await screen.findAllByText(/You took the last seat available/);
    expect(msg2.length).toBeGreaterThan(0);

    server.restoreHandlers();
  });

  test("Join the waiting list", async () => {
    let requestBody: Record<string, string>;
    let requestUrl: string;
    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          availableSeats: 0,
          waitingList: true,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
      http.post("/wpoe/v1/events/1", async ({ request }) => {
        requestUrl = request.url;
        requestBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json({ remaining: 0 });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const msg1 = await screen.findAllByText(
      /You can only join the waiting list/,
    );
    expect(msg1.length).toBeGreaterThan(0);

    const field = await screen.findByRole("textbox", { name: "myfield" });

    const user = userEvent.setup();
    await user.type(field, "foo");
    await user.click(
      screen.getByRole("button", { name: "Join the waiting list" }),
    );

    expect(requestBody["1"]).toEqual("foo");
    expect(requestUrl).toContain("waitingList=true");

    const msg2 = await screen.findAllByText(
      /Your registration has been submitted/,
    );
    expect(msg2.length).toBeGreaterThan(0);

    server.restoreHandlers();
  });

  test("Editing event in waiting list", async () => {
    window.location.hash = "#registration=5555";

    server.use(
      http.get("/wpoe/v1/events/1", () => {
        return HttpResponse.json({
          editableRegistrations: true,
          availableSeats: 0,
          formFields: [
            { id: 1, fieldType: "text", label: "myfield", required: true },
          ],
        });
      }),
      http.get("/wpoe/v1/events/1/5555", () => {
        return HttpResponse.json({
          values: { 1: "myvalue" },
          waitingList: true,
        });
      }),
    );

    render(<EventRegistration eventId={1} />);

    const field1 = await screen.findByRole("textbox", { name: "myfield" });
    expect(field1).toHaveValue("myvalue");

    const msg1 = screen.getAllByText(
      /You are editing an existing registration/,
    );
    expect(msg1.length).toBeGreaterThan(0);
    const msg2 = screen.getAllByText(
      /This registration is in the waiting list/,
    );
    expect(msg2.length).toBeGreaterThan(0);

    server.restoreHandlers();
  });
});
