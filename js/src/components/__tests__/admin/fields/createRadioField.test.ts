import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { EventConfiguration } from "../../../classes/event";
import { RadioField } from "../../../classes/fields";

createEventTest(
  "Create required radio field with description",
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
    await user.click(screen.getByRole("button", { name: "Radio" }));
    await user.type(
      screen.getByRole("textbox", { name: "Description (optional)" }),
      "Radio field description",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 1" }),
      "option1",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 2" }),
      "option2",
    );
    await user.click(screen.getByRole("checkbox", { name: "Required" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // check invalid empty label
    expect(screen.getAllByText("Field is required").length).toEqual(1);
    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Radio field",
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Radio field");
    expect(cells[1].textContent).toEqual("radio");
    expect(cells[2].textContent).toEqual("Yes");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(
      (screen.getByRole("textbox", { name: "Label" }) as HTMLInputElement)
        .value,
    ).toEqual("Radio field");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Description (optional)",
        }) as HTMLInputElement
      ).value,
    ).toEqual("Radio field description");
    expect(
      (screen.getByRole("checkbox", { name: "Required" }) as HTMLInputElement)
        .checked,
    ).toEqual(true);
    expect(
      (screen.getByRole("textbox", { name: "Option 1" }) as HTMLInputElement)
        .value,
    ).toEqual("option1");
    expect(
      (screen.getByRole("textbox", { name: "Option 2" }) as HTMLInputElement)
        .value,
    ).toEqual("option2");
    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("radio");
    expect(requestBody.formFields[0].label).toEqual("Radio field");
    expect(requestBody.formFields[0].description).toEqual(
      "Radio field description",
    );
    expect(
      (requestBody.formFields[0] as RadioField).extra.options.length,
    ).toEqual(2);
    expect((requestBody.formFields[0] as RadioField).extra.options[0]).toEqual(
      "option1",
    );
    expect((requestBody.formFields[0] as RadioField).extra.options[1]).toEqual(
      "option2",
    );
    expect(requestBody.formFields[0].required).toEqual(true);
  },
);

createEventTest(
  "Create optional radio field without description and 3 options",
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
    await user.click(screen.getByRole("button", { name: "Radio" }));
    await user.type(
      screen.getByRole("textbox", { name: "Label" }),
      "Radio field",
    );
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.click(screen.getByRole("button", { name: "Add option" }));
    await user.type(
      screen.getByRole("textbox", { name: "Option 1" }),
      "option1",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 2" }),
      "option2",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Option 3" }),
      "option3",
    );
    expect(
      screen.getAllByRole("textbox", { name: /Option \d+/ }).length,
    ).toEqual(4);
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Check invalid empty option
    expect(screen.getByRole("textbox", { name: "Option 4" })).not.toBeValid();
    expect(screen.getAllByText("Field is required").length).toEqual(1);
    await user.type(
      screen.getByRole("textbox", { name: "Option 4" }),
      "option4",
    );
    await user.click(screen.getAllByLabelText("Remove option")[3]);
    expect(
      screen.getAllByRole("textbox", { name: /Option \d+/ }).length,
    ).toEqual(3);
    await user.click(screen.getByRole("button", { name: "Save" }));

    const rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);

    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[0].textContent).toEqual("Radio field");
    expect(cells[1].textContent).toEqual("radio");
    expect(cells[2].textContent).toEqual("No");

    await user.click(within(rows[1]).getByRole("button", { name: "Edit" }));

    expect(
      (screen.getByRole("textbox", { name: "Label" }) as HTMLInputElement)
        .value,
    ).toEqual("Radio field");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Description (optional)",
        }) as HTMLInputElement
      ).value,
    ).toEqual("");
    expect(
      (screen.getByRole("checkbox", { name: "Required" }) as HTMLInputElement)
        .checked,
    ).toEqual(false);
    expect(
      screen.getAllByRole("textbox", { name: /Option \d+/ }).length,
    ).toEqual(3);
    expect(
      (screen.getByRole("textbox", { name: "Option 1" }) as HTMLInputElement)
        .value,
    ).toEqual("option1");
    expect(
      (screen.getByRole("textbox", { name: "Option 2" }) as HTMLInputElement)
        .value,
    ).toEqual("option2");
    expect(
      (screen.getByRole("textbox", { name: "Option 3" }) as HTMLInputElement)
        .value,
    ).toEqual("option3");
    await user.click(screen.getByRole("button", { name: "Save" }));
  },
  (requestBody: EventConfiguration) => {
    expect(requestBody.formFields.length).toEqual(1);
    expect(requestBody.formFields[0].fieldType).toEqual("radio");
    expect(requestBody.formFields[0].label).toEqual("Radio field");
    expect(requestBody.formFields[0].description).toEqual(undefined);
    expect(
      (requestBody.formFields[0] as RadioField).extra.options.length,
    ).toEqual(3);
    expect((requestBody.formFields[0] as RadioField).extra.options[0]).toEqual(
      "option1",
    );
    expect((requestBody.formFields[0] as RadioField).extra.options[1]).toEqual(
      "option2",
    );
    expect((requestBody.formFields[0] as RadioField).extra.options[2]).toEqual(
      "option3",
    );
    expect(requestBody.formFields[0].required).toEqual(false);
  },
);
