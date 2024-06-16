import * as React from 'react';
import { test } from 'vitest';
import { render, screen } from '@testing-library/react'
import EditEvent from '../../admin/events/EditEvent';
import { createMemoryHistory } from 'history'
import { Route, Routes, MemoryRouter } from 'react-router-dom';

/**
 * Base test function starting on "Create event" page opened
 */
export const editEventTest = (testDescription: string, impl: () => Promise<void>) => {

  test(testDescription, async () => {

    const history = createMemoryHistory();
    history.push('/event/new');

    render(
      <MemoryRouter initialEntries={["/event/new"]}>
        <Routes>
          <Route path="/event/:eventId" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Create event');

    await impl();
  });
};
