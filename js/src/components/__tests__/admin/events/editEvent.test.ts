import { editEventTest } from "../../__base__/editEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import { EventConfiguration } from "../../../classes/event";

editEventTest('Open existing event for editing', {
  "name": "test",
  "date": "2050-01-01",
  "formFields":
    [{
      "id": 1,
      "label": "Number field",
      "fieldType": "number",
      "required": true
    }],
  "hasResponses": true,
  "maxParticipants": 100,
  "adminEmail": "admin@example.com",
  "extraEmailContent": "extra content"
}, async () => {
  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);
  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Number field');
  expect(cells[1].textContent).toEqual('number');
  expect(cells[2].textContent).toEqual('Yes');

  expect(screen.getAllByText(/this event has already some registrations/)[0]).toBeInTheDocument();

  expect(screen.getByRole('checkbox', { name: 'Set a maximum number of participants' })).toBeChecked();
  expect(screen.getByRole('spinbutton', { name: 'Total available seats' })).toHaveValue(100);
  expect(screen.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).toBeChecked();
  expect(screen.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('admin@example.com');
  expect(screen.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).toBeChecked();
  expect(screen.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('extra content');

}, (requestBody: EventConfiguration) => {
  expect(requestBody.name).toEqual('test');
  expect(requestBody.date).toEqual('2050-01-01T00:00:00.000Z');
  expect(requestBody.maxParticipants).toEqual(100);
  expect(requestBody.adminEmail).toEqual('admin@example.com');
  expect(requestBody.extraEmailContent).toEqual('extra content');
  expect(requestBody.formFields[0].fieldType).toEqual('number');
  expect(requestBody.formFields[0].label).toEqual('Number field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].required).toEqual(true);
});
