import * as React from 'react';
import { expect, test } from 'vitest';
import { act, render, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { server } from '../../__mocks__/api';
import ListRegistrations from '../../../admin/events/registrations/ListRegistrations';
import { userEvent } from '@testing-library/user-event';

test('Delete registration', async () => {

  let registrations = [[1, '2024-09-15 20:27:03', 'mario']];

  server.use(
    http.get('/wpoe/v1/admin/events/1/registrations', async () => {
      return HttpResponse.json({
        head: [{ label: 'name' }],
        body: registrations,
        total: 1,
        totalParticipants: 1
      });
    })
  );

  server.use(
    http.post('/wpoe/v1/admin/events/1/registrations/1', async () => {
      registrations = [];
      return new Response(null, { status: 204 });
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

  expect(await screen.findByText(/Registrations for the event/)).toBeInTheDocument();

  const user = userEvent.setup();
  expect(screen.getAllByRole('row')).toHaveLength(2);

  await user.click(screen.getByRole('button', { name: 'Delete' }));
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm' }));

  expect(registrations).toHaveLength(0);
  expect.poll(() => screen.getAllByRole('row')).toHaveLength(1);

  server.restoreHandlers();
});

test('Error happens while deleting a registration', async () => {

  server.use(
    http.get('/wpoe/v1/admin/events/1/registrations', async () => {
      return HttpResponse.json({
        head: [{ label: 'name' }],
        body: [[1, '2024-09-15 20:27:03', 'mario']],
        total: 1,
        totalParticipants: 1
      });
    })
  );

  server.use(
    http.post('/wpoe/v1/admin/events/1/registrations/1', async () => {
      return HttpResponse.json({ code: 'generic_error', message: 'A critical error happened' }, { status: 500 });
    })
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/event/1/registrations"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/event/:eventId/registrations" element={<ListRegistrations waiting={false} />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByText(/Registrations for the event/)).toBeInTheDocument();

  expect(await screen.findAllByRole('row')).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm' }));

  const errors = await screen.findAllByText(/A critical error happened/);
  expect(errors[0]).toBeInTheDocument();

  server.restoreHandlers();
});
