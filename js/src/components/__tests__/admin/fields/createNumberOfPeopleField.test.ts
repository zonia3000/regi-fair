import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

createEventTest('Create required number of people field with description', async () => {

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Number of people' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Number of people field');
  await userEvent.type(screen.getByRole('textbox', { name: 'Description (optional)' }), 'Number of people field description');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Required' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Number of people field');
  expect(cells[1].textContent).toEqual('number');
  expect(cells[2].textContent).toEqual('Yes');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Number of people field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('Number of people field description');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(true);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('number');
  expect(requestBody.formFields[0].label).toEqual('Number of people field');
  expect(requestBody.formFields[0].description).toEqual('Number of people field description');
  expect(requestBody.formFields[0].extra.useAsNumberOfPeople).toEqual(true);
  expect(requestBody.formFields[0].extra.max).toEqual(undefined);
  expect(requestBody.formFields[0].required).toEqual(true);
});

createEventTest('Create optional number of people field with max value and without description', async () => {

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Number of people' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Number of people field');
  await userEvent.type(screen.getByRole('spinbutton', { name: 'Maximum value (optional)' }), '3');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Number of people field');
  expect(cells[1].textContent).toEqual('number');
  expect(cells[2].textContent).toEqual('No');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Number of people field');
  expect((screen.getByRole('spinbutton', { name: 'Maximum value (optional)' }) as HTMLInputElement).value).toEqual('3');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(false);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('number');
  expect(requestBody.formFields[0].label).toEqual('Number of people field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].extra.useAsNumberOfPeople).toEqual(true);
  expect(requestBody.formFields[0].extra.max).toEqual(3);
  expect(requestBody.formFields[0].required).toEqual(false);
});

createEventTest('Unsetting selected number of people field reset field type', async () => {

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Number of people' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Number of people field');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await userEvent.click(screen.getByRole('button', { name: 'Number' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Number field');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('number');
  expect(requestBody.formFields[0].label).toEqual('Number field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].extra).toEqual(undefined);
  expect(requestBody.formFields[0].required).toEqual(false);
});
