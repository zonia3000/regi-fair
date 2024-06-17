import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

createEventTest('Create required number field with description', async () => {

  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Event name');
  await userEvent.type(screen.getByText('Date'), '2050-01-01');

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Number' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Number field');
  await userEvent.type(screen.getByRole('textbox', { name: 'Description (optional)' }), 'Number field description');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Required' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Number field');
  expect(cells[1].textContent).toEqual('number');
  expect(cells[2].textContent).toEqual('Yes');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Number field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('Number field description');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(true);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('number');
  expect(requestBody.formFields[0].label).toEqual('Number field');
  expect(requestBody.formFields[0].description).toEqual('Number field description');
  expect(requestBody.formFields[0].extra).toEqual(undefined);
  expect(requestBody.formFields[0].required).toEqual(true);
});

createEventTest('Create optional number field without description and with min/max', async () => {

  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Event name');
  await userEvent.type(screen.getByText('Date'), '2050-01-01');

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Number' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Number field');
  await userEvent.type(screen.getByRole('spinbutton', { name: 'Minimum value (optional)' }), '5');
  await userEvent.type(screen.getByRole('spinbutton', { name: 'Maximum value (optional)' }), '10');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Number field');
  expect(cells[1].textContent).toEqual('number');
  expect(cells[2].textContent).toEqual('No');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Number field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(false);
  expect((screen.getByRole('spinbutton', { name: 'Minimum value (optional)' }) as HTMLInputElement).value).toEqual('5');
  expect((screen.getByRole('spinbutton', { name: 'Maximum value (optional)' }) as HTMLInputElement).value).toEqual('10');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('number');
  expect(requestBody.formFields[0].label).toEqual('Number field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].extra.min).toEqual(5);
  expect(requestBody.formFields[0].extra.max).toEqual(10);
  expect(requestBody.formFields[0].required).toEqual(false);
});
