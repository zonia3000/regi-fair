import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EventConfiguration } from "../../../classes/event";
import { DropdownField } from "../../../classes/fields";

createEventTest(
  "Create dropdown field, single with description",
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
    await user.click(screen.getByRole("button", { name: "Dropdown" }));

    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.click(screen.getByRole("button", { name: "Add option" }));

    // Check empty label and options validation
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("textbox", { name: "Label" })).not.toBeValid();
    expect(screen.getAllByText("Field is required").length).toEqual(3);

    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Dropdown field",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Description (optional)" }),
      "Dropdown field description",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 1" }),
      "option1",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 2" }),
      "option2",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Dropdown field");
    expect(cells[1].textContent).toEqual("dropdown");
    expect(cells[2].textContent).toEqual("No");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
      "Dropdown field",
    );
    expect(
      screen.getByRole("textbox", { name: "Description (optional)" }),
    ).toHaveValue("Dropdown field description");
    expect(screen.getByRole("textbox", { name: "Option 1" })).toHaveValue(
      "option1",
    );
    expect(screen.getByRole("textbox", { name: "Option 2" })).toHaveValue(
      "option2",
    );
    expect(
      screen.getByRole("checkbox", { name: "Multiple" }),
    ).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    const field = requestBody.formFields[0] as DropdownField;
    expect(field.fieldType).toEqual("dropdown");
    expect(field.label).toEqual("Dropdown field");
    expect(field.description).toEqual("Dropdown field description");
    expect(field.extra.multiple).toEqual(false);
    expect(field.extra.options).toEqual(["option1", "option2"]);
    expect(field.required).toEqual(false);
  },
);

createEventTest(
  "Create dropdown field, multiple without description",
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
    await user.click(screen.getByRole("button", { name: "Dropdown" }));

    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.click(screen.getByRole("checkbox", { name: "Multiple" }));
    await user.click(screen.getByRole("checkbox", { name: "Required" }));

    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Dropdown field",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 1" }),
      "option1",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 2" }),
      "option2",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Dropdown field");
    expect(cells[1].textContent).toEqual("dropdown");
    expect(cells[2].textContent).toEqual("Yes");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
      "Dropdown field",
    );
    expect(
      screen.getByRole("textbox", { name: "Description (optional)" }),
    ).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Option 1" })).toHaveValue(
      "option1",
    );
    expect(screen.getByRole("textbox", { name: "Option 2" })).toHaveValue(
      "option2",
    );
    expect(screen.getByRole("checkbox", { name: "Multiple" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Required" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    const field = requestBody.formFields[0] as DropdownField;
    expect(field.fieldType).toEqual("dropdown");
    expect(field.label).toEqual("Dropdown field");
    expect(field.description).toEqual(undefined);
    expect(field.extra.multiple).toEqual(true);
    expect(field.extra.options).toEqual(["option1", "option2"]);
    expect(field.required).toEqual(true);
  },
);
