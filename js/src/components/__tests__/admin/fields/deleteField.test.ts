import { editEventTest } from "../../__base__/editEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

editEventTest('Delete field', {
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
    }]
}, async () => {
  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(3);

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  await userEvent.click(within(rows[2]).getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('text');
});
