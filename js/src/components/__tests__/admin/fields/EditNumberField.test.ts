import { editEventTest } from "../../__base__/EditEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';

editEventTest('EditNumberField', async () => {

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Number' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Number field');
  await userEvent.type(screen.getByRole('textbox', { name: 'Description (optional)' }), 'Number field description');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Required' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);
});
