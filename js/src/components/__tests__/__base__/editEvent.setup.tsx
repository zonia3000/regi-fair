import * as React from 'react';
import { test } from 'vitest';
import { render, screen } from '@testing-library/react'
import EditEvent from '../../admin/events/EditEvent';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { server } from '../__mocks__/api';
import { HttpResponse, http } from 'msw';

/**
 * Base test function starting on "Edit event" page opened
 */
export const editEventTest = (testDescription: string, eventToEdit: any, editEvent: () => Promise<void>, verifyRequestPayload: (body: any) => void) => {

  test(testDescription, async () => {
    server.use(
      http.get('/wpoe/v1/admin/events/1', async () => {
        return HttpResponse.json({ ...eventToEdit, id: 1 });
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

    let body: any;
    server.use(
      http.post('/wpoe/v1/admin/events/1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({});
      })
    );

    await editEvent();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    verifyRequestPayload(body);

    server.restoreHandlers();
  });
};
