import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react'
import EditEvent from '../../../admin/events/EditEvent';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { server } from '../../__mocks__/api';
import { HttpResponse, http } from 'msw';

test('Deleting saved "number of people" field is forbidden', async () => {

  server.use(
    http.get('/wpoe/v1/admin/events/1', async () => {
      return HttpResponse.json({
        "name": "test",
        "date": "2050-01-01",
        "formFields":
          [
            {
              "id": 1,
              "label": "Name",
              "fieldType": "text",
              "required": true
            },
            {
              "id": 2,
              "label": "Number of people",
              "fieldType": "number",
              "required": true,
              "extra": { "useAsNumberOfPeople": true }
            }
          ],
        "hasResponses": true,
        "maxParticipants": 100,
        "adminEmail": "admin@example.com",
        "extraEmailContent": "extra content"
      });
    })
  );

  render(
    <MemoryRouter initialEntries={["/event/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByText('Edit event');

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(3);
  const cells1 = within(rows[1]).getAllByRole('cell');
  expect(cells1[0]).toHaveTextContent('Name');
  const cells2 = within(rows[2]).getAllByRole('cell');
  expect(cells2[0]).toHaveTextContent('Number of people');
  expect(within(rows[1]).queryByRole('button', { name: 'Delete' })).toBeDefined();
  expect(within(rows[2]).queryByRole('button', { name: 'Delete' })).toBeNull();

  server.restoreHandlers();
});

test('It is possible to delete not already saved "number of people" field', async () => {

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/event/new"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByText('Create event');

  await user.click(screen.getByRole('button', { name: 'Add form field' }));

  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Number of people' }));
  await user.type(within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Label' }), 'people');
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));

  const rows = screen.getAllByRole('row');
  expect(rows.length).toEqual(2);

  await user.click(screen.getByRole('button', { name: 'Add form field' }));
  expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Number of people' })).toBeNull();
  await user.click(within(screen.getByRole('dialog')).getByLabelText('Close'));

  const deleteBtn = await within(rows[1]).findByRole('button', { name: 'Delete' });

  await user.click(deleteBtn);
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));

  await user.click(screen.getByRole('button', { name: 'Add form field' }));
  expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Number of people' })).toBeDefined();
});
