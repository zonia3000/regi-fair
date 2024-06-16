import { editEventTest } from "../../__base__/editEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

editEventTest('Change field position', {
  "name": "test",
  "date": "2050-01-01",
  "formFields":
    [{
      "id": 1,
      "label": "Text field",
      "fieldType": "text",
      "required": true
    },
    {
      "id": 2,
      "label": "Email field",
      "fieldType": "email",
      "required": true
    },
    {
      "id": 3,
      "label": "Number field",
      "fieldType": "number",
      "required": true
    }]
}, async () => {
  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(4);

  await userEvent.click(within(rows[1]).getByLabelText('Move field down'));
  await userEvent.click(within(rows[3]).getByLabelText('Move field up'));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(3);
  expect(requestBody.formFields[0].fieldType).toEqual('email');
  expect(requestBody.formFields[1].fieldType).toEqual('number');
  expect(requestBody.formFields[2].fieldType).toEqual('text');
});