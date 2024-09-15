import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react'
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { server } from '../../__mocks__/api';
import ListRegistrations from '../../../admin/events/registrations/ListRegistrations';

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
        <Route path="/event/:eventId/registrations" element={<ListRegistrations />} />
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
        <Route path="/event/:eventId/registrations" element={<ListRegistrations />} />
      </Routes>
    </MemoryRouter>
  );

  const rows = await screen.findAllByRole('row');

  expect(rows).toHaveLength(3);

  server.restoreHandlers();
});
