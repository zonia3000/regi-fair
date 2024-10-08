import { expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createEventTest } from "../../__base__/createEvent.setup";
import { EventConfiguration } from "../../../classes/event";

createEventTest(
  "Validate base event fields",
  async () => {
    const user = userEvent.setup();

    const saveBtn = screen.getByRole("button", { name: "Save" });
    await user.click(saveBtn);

    expect(screen.getAllByText("Field is required").length).toEqual(1);

    await user.type(
      screen.getByRole("textbox", { name: "Name" }),
      "Event name",
    );

    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2050-01-01" },
    });

    const maxParticipantsCheckbox = screen.getByRole("checkbox", {
      name: "Set a maximum number of participants",
    });
    await user.click(maxParticipantsCheckbox);
    expect(maxParticipantsCheckbox).toBeChecked();

    const availableSeatsInput = screen.getByRole("spinbutton", {
      name: "Total available seats",
    });
    expect(availableSeatsInput).toBeVisible();
    expect(availableSeatsInput).not.toBeValid();

    await user.click(saveBtn);
    expect(screen.getAllByText("Field is required").length).toEqual(1);

    await user.type(availableSeatsInput, "300");

    const adminEmailInput = screen.getByRole("textbox", {
      name: "Administrator e-mail address",
    });
    await user.clear(adminEmailInput);

    await user.click(saveBtn);
    expect(screen.getAllByText("Field is required").length).toEqual(1);

    await user.type(adminEmailInput, "admin@example.com");
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.name).toEqual("Event name");
    expect(requestBody.date).toEqual("2050-01-01T00:00:00.000Z");
    expect(requestBody.adminEmail).toEqual("admin@example.com");
    expect(requestBody.maxParticipants).toEqual(300);
    expect(requestBody.formFields.length).toEqual(0);
  },
);
