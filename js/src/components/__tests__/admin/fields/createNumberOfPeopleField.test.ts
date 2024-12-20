import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EventConfiguration } from "../../../classes/event";
import { NumberField } from "../../../classes/fields";

createEventTest(
  "Create required number of people field with description",
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
    await user.click(screen.getByRole("button", { name: "Number of people" }));
    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Number of people field",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Description (optional)" }),
      "Number of people field description",
    );
    await user.click(screen.getByRole("checkbox", { name: "Required" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Number of people field");
    expect(cells[1].textContent).toEqual("number");
    expect(cells[2].textContent).toEqual("Yes");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
      "Number of people field",
    );
    expect(
      screen.getByRole("textbox", { name: "Description (optional)" }),
    ).toHaveValue("Number of people field description");
    expect(screen.getByRole("checkbox", { name: "Required" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("number");
    expect(requestBody.formFields[0].label).toEqual("Number of people field");
    expect(requestBody.formFields[0].description).toEqual(
      "Number of people field description",
    );
    expect(
      (requestBody.formFields[0] as NumberField).extra.useAsNumberOfPeople,
    ).toEqual(true);
    expect((requestBody.formFields[0] as NumberField).extra.max).toEqual(
      undefined,
    );
    expect(requestBody.formFields[0].required).toEqual(true);
  },
);

createEventTest(
  "Create optional number of people field with max value and without description",
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
    await user.click(screen.getByRole("button", { name: "Number of people" }));
    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Number of people field",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: "Maximum value (optional)" }),
      "3",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Number of people field");
    expect(cells[1].textContent).toEqual("number");
    expect(cells[2].textContent).toEqual("No");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
      "Number of people field",
    );
    expect(
      screen.getByRole("spinbutton", { name: "Maximum value (optional)" }),
    ).toHaveValue(3);
    expect(
      screen.getByRole("checkbox", { name: "Required" }),
    ).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("number");
    expect(requestBody.formFields[0].label).toEqual("Number of people field");
    expect(requestBody.formFields[0].description).toEqual(undefined);
    expect(
      (requestBody.formFields[0] as NumberField).extra.useAsNumberOfPeople,
    ).toEqual(true);
    expect((requestBody.formFields[0] as NumberField).extra.max).toEqual(3);
    expect(requestBody.formFields[0].required).toEqual(false);
  },
);

createEventTest(
  "Unsetting selected number of people field reset field type",
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
    await user.click(screen.getByRole("button", { name: "Number of people" }));
    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Number of people field",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Number" }));
    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Number field",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("number");
    expect(requestBody.formFields[0].label).toEqual("Number field");
    expect(requestBody.formFields[0].description).toEqual(undefined);
    expect(requestBody.formFields[0].extra).toEqual(undefined);
    expect(requestBody.formFields[0].required).toEqual(false);
  },
);
