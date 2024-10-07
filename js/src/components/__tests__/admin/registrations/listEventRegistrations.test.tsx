import * as React from 'react';
import { expect, test } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react'
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { server } from '../../__mocks__/api';
import ListRegistrations from '../../../admin/events/registrations/ListRegistrations';
import { userEvent } from '@testing-library/user-event';

test('Event not found', async () => {

  server.use(
    http.get('/wpoe/v1/admin/events/1/registrations', async () => {
      return HttpResponse.json({
        'code': 'event_not_found',
        'message': 'Event not found'
      }, { status: 404 });
    })
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<ListRegistrations waiting={false} />} />
      </Routes>
    </MemoryRouter>
  );

  expect((await screen.findAllByText('Event not found'))[0]).toBeInTheDocument();

  server.restoreHandlers();
});

test('List registrations', async () => {

  server.use(
    http.get('/wpoe/v1/admin/events/1/registrations', async () => {
      return HttpResponse.json({
        head: [{ label: 'name', 'deleted': false }],
        body: [
          [1, '2024-09-15 20:27:03', 'mario'],
          [2, '2024-09-15 22:30:00', 'paola']
        ],
        total: 2,
        totalParticipants: 2
      });
    })
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<ListRegistrations waiting={false} />} />
      </Routes>
    </MemoryRouter>
  );

  const rows = await screen.findAllByRole('row');

  expect(rows).toHaveLength(3);

  server.restoreHandlers();
});

test('List registrations with deleted records', async () => {

  const user = userEvent.setup();

  server.use(
    http.get('/wpoe/v1/admin/events/1/registrations', async () => {
      return HttpResponse.json({
        head: [{ label: 'name', 'deleted': false }, { label: 'email', deleted: true }],
        body: [
          [1, '2024-09-15 20:27:03', 'mario', 'mario@example.com'],
          [2, '2024-09-15 22:30:00', 'paola', 'paola@example.com']
        ],
        total: 2,
        totalParticipants: 2
      });
    })
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<ListRegistrations waiting={false} />} />
      </Routes>
    </MemoryRouter>
  );

  const rows = await screen.findAllByRole('row');

  expect(rows).toHaveLength(3);

  expect(screen.queryByText('email (deleted)')).toBeNull();
  expect(screen.queryByText('mario@example.com')).toBeNull();

  const deletedFieldsCheckbox = screen.getByRole('checkbox', { name: 'Show deleted fields' });
  expect(deletedFieldsCheckbox).not.toBeChecked();
  user.click(deletedFieldsCheckbox);

  expect(screen.queryByText('email (deleted)')).toBeDefined();
  expect(screen.queryByText('mario@example.com')).toBeDefined();

  server.restoreHandlers();
});

test('List registrations with waiting list', async () => {

  const user = userEvent.setup();

  server.use(
    http.get('/wpoe/v1/admin/events/1/registrations', async ({ request }) => {
      const url = new URL(request.url);
      const waitingList = url.searchParams.get('waitingList');
      if (waitingList === 'true') {
        return HttpResponse.json({
          eventName: 'test',
          head: [{ label: 'name', 'deleted': false }],
          body: [
            [3, '2024-09-15 20:27:03', 'gianna']
          ],
          total: 1,
          totalParticipants: 2,
          totalWaiting: 1
        });
      }
      return HttpResponse.json({
        eventName: 'test',
        head: [{ label: 'name', 'deleted': false }],
        body: [
          [1, '2024-09-15 20:27:03', 'mario'],
          [2, '2024-09-15 22:30:00', 'paola']
        ],
        total: 2,
        totalParticipants: 2,
        totalWaiting: 1
      });
    })
  );

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<ListRegistrations waiting={false} />} />
        <Route path="/event/:eventId/registrations/waiting" element={<ListRegistrations waiting={true} />} />
      </Routes>
    </MemoryRouter>
  );

  expect((await screen.findByText('Registrations for the event "test"'))).toBeInTheDocument();
  expect(await screen.findAllByRole('row')).toHaveLength(3);

  await act(async () => {
    const waitingListLink = screen.getByRole('button', { name: '1' });
    await user.click(waitingListLink);
  });

  await waitFor(() => screen.queryByText(/Waiting list for the event "test"/));

  expect(await screen.findAllByRole('row')).toHaveLength(2);

  await act(async () => {
    const confirmedRegistrationsLink = screen.getByRole('button', { name: '2' });
    await user.click(confirmedRegistrationsLink);
  });

  await waitFor(() => screen.queryByText(/Registrations for the event "test"/));
  expect(await screen.findAllByRole('row')).toHaveLength(3);

  server.restoreHandlers();
});
