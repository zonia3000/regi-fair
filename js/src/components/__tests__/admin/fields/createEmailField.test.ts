import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { EventConfiguration } from "../../../classes/event";
import { EmailField } from "../../../classes/fields";

createEventTest('Create required email field with description', async () => {

  const user = userEvent.setup();

  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Event name');
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2050-01-01' } });

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await user.click(addFormFieldBtn);
  await user.click(screen.getByRole('button', { name: 'E-mail' }));
  await user.type(screen.getByRole('textbox', { name: 'Label' }), 'Email field');
  await user.type(screen.getByRole('textbox', { name: 'Description (optional)' }), 'Email field description');
  await user.click(screen.getByRole('checkbox', { name: 'Required' }));
  expect((screen.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail when the user register to the event' }) as HTMLInputElement).checked).toEqual(true);
  await user.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Email field');
  expect(cells[1].textContent).toEqual('email');
  expect(cells[2].textContent).toEqual('Yes');

  await user.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Email field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('Email field description');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(true);
  await user.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: EventConfiguration) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('email');
  expect(requestBody.formFields[0].label).toEqual('Email field');
  expect(requestBody.formFields[0].description).toEqual('Email field description');
  expect((requestBody.formFields[0] as EmailField).extra.confirmationAddress).toEqual(true);
  expect(requestBody.formFields[0].required).toEqual(true);
});

createEventTest('Create optional email field without description', async () => {

  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Event name');
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2050-01-01' } });

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await user.click(addFormFieldBtn);
  await user.click(screen.getByRole('button', { name: 'E-mail' }));
  await user.type(screen.getByRole('textbox', { name: 'Label' }), 'Email field');
  await user.click(screen.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail when the user register to the event' }));
  await user.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Email field');
  expect(cells[1].textContent).toEqual('email');
  expect(cells[2].textContent).toEqual('No');

  await user.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Email field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(false);
  expect((screen.getByRole('checkbox', { name: 'Use this address to send confirmation e-mail when the user register to the event' }) as HTMLInputElement).checked).toEqual(false);
  await user.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: EventConfiguration) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('email');
  expect(requestBody.formFields[0].label).toEqual('Email field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect((requestBody.formFields[0] as EmailField).extra.confirmationAddress).toEqual(false);
  expect(requestBody.formFields[0].required).toEqual(false);
});
