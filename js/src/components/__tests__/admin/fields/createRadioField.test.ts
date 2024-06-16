import { createEventTest } from "../../__base__/createEvent.setup";
import { expect } from 'vitest';
import { screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

createEventTest('Create required radio field with description', async () => {

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Radio' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Radio field');
  await userEvent.type(screen.getByRole('textbox', { name: 'Description (optional)' }), 'Radio field description');
  await userEvent.type(screen.getByRole('textbox', { name: 'Option 1' }), 'option1');
  await userEvent.type(screen.getByRole('textbox', { name: 'Option 2' }), 'option2');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Required' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Radio field');
  expect(cells[1].textContent).toEqual('radio');
  expect(cells[2].textContent).toEqual('Yes');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Radio field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('Radio field description');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(true);
  expect((screen.getByRole('textbox', { name: 'Option 1' }) as HTMLInputElement).value).toEqual('option1');
  expect((screen.getByRole('textbox', { name: 'Option 2' }) as HTMLInputElement).value).toEqual('option2');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('radio');
  expect(requestBody.formFields[0].label).toEqual('Radio field');
  expect(requestBody.formFields[0].description).toEqual('Radio field description');
  expect(requestBody.formFields[0].extra.options.length).toEqual(2);
  expect(requestBody.formFields[0].extra.options[0]).toEqual('option1');
  expect(requestBody.formFields[0].extra.options[1]).toEqual('option2');
  expect(requestBody.formFields[0].required).toEqual(true);
});

createEventTest('Create optional radio field without description and 3 options', async () => {

  const addFormFieldBtn = screen.getByRole('button', { name: 'Add form field' });
  await userEvent.click(addFormFieldBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Radio' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Label' }), 'Radio field');
  await userEvent.click(screen.getByRole('button', { name: 'Add option' }));
  await userEvent.click(screen.getByRole('button', { name: 'Add option' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Option 1' }), 'option1');
  await userEvent.type(screen.getByRole('textbox', { name: 'Option 2' }), 'option2');
  await userEvent.type(screen.getByRole('textbox', { name: 'Option 3' }), 'option3');
  expect(screen.getAllByRole('textbox', { name: /Option \d+/ }).length).toEqual(4);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('textbox', { name: 'Option 4' })).not.toBeValid();
  await userEvent.type(screen.getByRole('textbox', { name: 'Option 4' }), 'option4');
  await userEvent.click(screen.getAllByLabelText('Remove option')[3]);
  expect(screen.getAllByRole('textbox', { name: /Option \d+/ }).length).toEqual(3);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('Radio field');
  expect(cells[1].textContent).toEqual('radio');
  expect(cells[2].textContent).toEqual('No');

  await userEvent.click(within(rows[1]).getByRole('button', { name: 'Edit' }));

  expect((screen.getByRole('textbox', { name: 'Label' }) as HTMLInputElement).value).toEqual('Radio field');
  expect((screen.getByRole('textbox', { name: 'Description (optional)' }) as HTMLInputElement).value).toEqual('');
  expect((screen.getByRole('checkbox', { name: 'Required' }) as HTMLInputElement).checked).toEqual(false);
  expect(screen.getAllByRole('textbox', { name: /Option \d+/ }).length).toEqual(3);
  expect((screen.getByRole('textbox', { name: 'Option 1' }) as HTMLInputElement).value).toEqual('option1');
  expect((screen.getByRole('textbox', { name: 'Option 2' }) as HTMLInputElement).value).toEqual('option2');
  expect((screen.getByRole('textbox', { name: 'Option 3' }) as HTMLInputElement).value).toEqual('option3');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

}, (requestBody: any) => {
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('radio');
  expect(requestBody.formFields[0].label).toEqual('Radio field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].extra.options.length).toEqual(3);
  expect(requestBody.formFields[0].extra.options[0]).toEqual('option1');
  expect(requestBody.formFields[0].extra.options[1]).toEqual('option2');
  expect(requestBody.formFields[0].extra.options[2]).toEqual('option3');
  expect(requestBody.formFields[0].required).toEqual(false);
});
