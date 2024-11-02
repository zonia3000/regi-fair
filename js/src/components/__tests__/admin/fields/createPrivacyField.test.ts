import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EventConfiguration } from "../../../classes/event";
import { HttpResponse, http } from "msw";
import { server } from "../../__mocks__/api";

createEventTest(
  "Create privacy field - privacy policy URL is set",
  async () => {
    server.use(
      http.get("/regifair/v1/admin/settings", () => {
        return HttpResponse.json({
          privacyPolicyUrl: "http://www.example.com/privacy",
        });
      }),
    );

    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "Event name",
    );
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2050-01-01" },
    });

    const addFormFieldBtn = screen.getByRole("button", {
      name: "Add form field",
    });
    await user.click(addFormFieldBtn);
    await user.click(
      await screen.findByRole("button", { name: "Privacy policy" }),
    );

    expect(
      await screen.findByText(/Configured privacy policy URL/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "http://www.example.com/privacy");

    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("privacy");
    expect(cells[1].textContent).toEqual("privacy");
    expect(cells[2].textContent).toEqual("Yes");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));
    expect(
      await screen.findByText(/Configured privacy policy URL/),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("privacy");
    expect(requestBody.formFields[0].label).toEqual("privacy");
    expect(requestBody.formFields[0].required).toEqual(true);
  },
);

createEventTest(
  "Create privacy field - privacy policy URL is not set",
  async () => {
    server.use(
      http.get("/regifair/v1/admin/settings", () => {
        return HttpResponse.json({ privacyPolicyUrl: "" });
      }),
    );

    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "Event name",
    );
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2050-01-01" },
    });

    const addFormFieldBtn = screen.getByRole("button", {
      name: "Add form field",
    });
    await user.click(addFormFieldBtn);
    await user.click(
      await screen.findByRole("button", { name: "Privacy policy" }),
    );

    expect(
      await screen.findAllByText(/No privacy policy URL configured/),
    ).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("privacy");
    expect(cells[1].textContent).toEqual("privacy");
    expect(cells[2].textContent).toEqual("Yes");
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("privacy");
    expect(requestBody.formFields[0].label).toEqual("privacy");
    expect(requestBody.formFields[0].required).toEqual(true);
  },
);
