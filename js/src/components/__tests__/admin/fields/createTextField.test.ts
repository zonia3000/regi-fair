import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EventConfiguration } from "../../../classes/event";

createEventTest(
  "Create required text field with description",
  async () => {
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
    await user.click(screen.getByRole("button", { name: "Text" }));

    // Check empty label validation
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("textbox", { name: "Label" })).not.toBeValid();
    expect(screen.getAllByText("Field is required").length).toEqual(1);

    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Text field",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Description (optional)" }),
      "Text field description",
    );
    await user.click(screen.getByRole("checkbox", { name: "Required" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Text field");
    expect(cells[1].textContent).toEqual("text");
    expect(cells[2].textContent).toEqual("Yes");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
      "Text field",
    );
    expect(
      screen.getByRole("textbox", { name: "Description (optional)" }),
    ).toHaveValue("Text field description");
    expect(screen.getByRole("checkbox", { name: "Required" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("text");
    expect(requestBody.formFields[0].label).toEqual("Text field");
    expect(requestBody.formFields[0].description).toEqual(
      "Text field description",
    );
    expect(requestBody.formFields[0].required).toEqual(true);
  },
);

createEventTest(
  "Create optional text field without description",
  async () => {
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
    await user.click(screen.getByRole("button", { name: "Text" }));
    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Text field",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Text field");
    expect(cells[1].textContent).toEqual("text");
    expect(cells[2].textContent).toEqual("No");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
      "Text field",
    );
    expect(
      screen.getByRole("textbox", { name: "Description (optional)" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("checkbox", { name: "Required" }),
    ).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("text");
    expect(requestBody.formFields[0].label).toEqual("Text field");
    expect(requestBody.formFields[0].description).toEqual(undefined);
    expect(requestBody.formFields[0].required).toEqual(false);
  },
);
