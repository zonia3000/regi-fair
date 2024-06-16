import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

createEventTest('Create required text field with description', async () => {
  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Text' }));

  // Check empty label validation
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('textbox', { name: 'Label' })).not.toBeValid();

  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Text field');
  await userEvent.type(screen.getByRole('textbox', { name: 'Description (optional)' }), 'Text field description');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Required' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Text field');
  expect(cells[1].textContent).toEqual('text');
  expect(cells[2].textContent).toEqual('Yes');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Text field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('Text field description');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(true);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('text');
  expect(requestBody.formFields[0].label).toEqual('Text field');
  expect(requestBody.formFields[0].description).toEqual('Text field description');
  expect(requestBody.formFields[0].required).toEqual(true);
});

createEventTest('Create optional text field without description', async () => {

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Text' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Text field');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Text field');
  expect(cells[1].textContent).toEqual('text');
  expect(cells[2].textContent).toEqual('No');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Text field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(false);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('text');
  expect(requestBody.formFields[0].label).toEqual('Text field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].required).toEqual(false);
});
