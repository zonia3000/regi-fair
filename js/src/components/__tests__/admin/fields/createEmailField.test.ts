import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

createEventTest('Create required email field with description', async () => {

  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Event name');
  await userEvent.type(screen.getByText('Date'), '2050-01-01');

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'E-mail' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Email field');
  await userEvent.type(screen.getByRole('textbox', { name: 'Description (optional)' }), 'Email field description');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Required' }));
  expect((screen.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail when the user register to the event' }) as HTMLInputElement).checked).toEqual(true);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Email field');
  expect(cells[1].textContent).toEqual('email');
  expect(cells[2].textContent).toEqual('Yes');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Email field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('Email field description');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(true);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('email');
  expect(requestBody.formFields[0].label).toEqual('Email field');
  expect(requestBody.formFields[0].description).toEqual('Email field description');
  expect(requestBody.formFields[0].extra.confirmationAddress).toEqual(true);
  expect(requestBody.formFields[0].required).toEqual(true);
});

createEventTest('Create optional email field without description', async () => {

  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Event name');
  await userEvent.type(screen.getByText('Date'), '2050-01-01');

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'E-mail' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Email field');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail when the user register to the event' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Email field');
  expect(cells[1].textContent).toEqual('email');
  expect(cells[2].textContent).toEqual('No');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Email field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(false);
  expect((screen.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail when the user register to the event' }) as HTMLInputElement).checked).toEqual(false);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('email');
  expect(requestBody.formFields[0].label).toEqual('Email field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].extra.confirmationAddress).toEqual(false);
  expect(requestBody.formFields[0].required).toEqual(false);
});
