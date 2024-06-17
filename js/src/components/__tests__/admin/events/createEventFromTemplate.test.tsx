import * as React from 'react';
import { expect } from 'vitest';
import { render, screen } from '@testing-library/react'
import { within } from '@testing-library/dom';
import { server } from '../../__mocks__/api';
import { HttpResponse, http } from "msw";
import { test } from 'vitest';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import EditEvent from '../../../admin/events/EditEvent';
import userEvent from '@testing-library/user-event';

test('Create event from template', async () => {

  server.use(
    http.get('/wpoe/v1/admin/templates/1', async () => {
      return HttpResponse.json({
        id: 1,
        autoremove: true,
        formFields: [
          { id: 1, fieldType: 'text', label: 'text field', required: true }
        ],
        adminEmail: 'template@example.com',
        editableRegistrations: true,
        extraEmailContent: 'template email content'
      });
    })
  );

  render(
    <MemoryRouter initialEntries={["/event/new?template=1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByText('Create event');

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  const cells = within(rows[1]).getAllByRole('cell');
  expect(cells[0].textContent).toEqual('text field');
  expect(cells[1].textContent).toEqual('text');
  expect(cells[2].textContent).toEqual('Yes');

  expect(screen.getByRole('checkbox', { name: 'Set a maximum number of participants' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Autoremove user data after the event' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).toBeChecked();
  expect(screen.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('template@example.com');
  expect(screen.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).toBeChecked();
  expect(screen.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('template email content');

  let requestBody: any;
  server.use(
    http.post('/wpoe/v1/admin/events', async ({ request }) => {
      requestBody = await request.json();
      return HttpResponse.json({ id: 1 });
    })
  );

  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Event name');
  await userEvent.type(screen.getByText('Date'), '2050-01-01');

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(requestBody.id).toEqual(null);
  expect(requestBody.adminEmail).toEqual('template@example.com');
  expect(requestBody.editableRegistrations).toEqual(true);
  expect(requestBody.autoremove).toEqual(true);
  expect(requestBody.autoremovePeriod).toEqual(30);
  expect(requestBody.maxParticipants).toEqual(null);
  expect(requestBody.waitingList).toEqual(false);
  expect(requestBody.extraEmailContent).toEqual('template email content');
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('text');
  expect(requestBody.formFields[0].label).toEqual('text field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].required).toEqual(true);

  server.restoreHandlers();
});
