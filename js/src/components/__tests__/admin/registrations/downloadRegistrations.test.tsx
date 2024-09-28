import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react'
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { server } from '../../__mocks__/api';
import ListRegistrations from '../../../admin/events/registrations/ListRegistrations';
import userEvent from '@testing-library/user-event';

test('Download registrations', async () => {

  const user = userEvent.setup();

  let downloadCalled = false;

  server.use(
    http.get('/wpoe/v1/admin/events/1/registrations', async () => {
      return HttpResponse.json({
        head: [],
        body: [],
        total: 0,
        totalParticipants: 0
      });
    }),
    http.get('/wpoe/v1/admin/events/1/registrations/download', async () => {
      downloadCalled = true;
      return HttpResponse.text('');
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

  const downloadButton = await screen.findByRole('button', { name: 'Download CSV' });

  await user.click(downloadButton);

  await waitFor(() => {
    expect(downloadCalled).toBeTruthy();
  });

  server.restoreHandlers();
});
