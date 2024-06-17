import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react'
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import EditTemplate from '../../../admin/templates/EditTemplate';
import { server } from '../../__mocks__/api';

test('Template not found', async () => {

  server.use(
    http.get('/wpoe/v1/admin/templates/1', async () => {
      return HttpResponse.json({ 'code': 'template_not_found' }, { status: 404 });
    })
  );

  render(
    <MemoryRouter initialEntries={["/template/1"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/template/:templateId" element={<EditTemplate />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByText('Template not found')).toBeInTheDocument();

  server.restoreHandlers();
});

test('Generic error when loading template', async () => {

  server.use(
    http.get('/wpoe/v1/admin/templates/2', async () => {
      return HttpResponse.json({ 'code': 'generic_server_error', message: 'A critical error happened' }, { status: 500 });
    })
  );

  render(
    <MemoryRouter initialEntries={["/template/2"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/template/:templateId" element={<EditTemplate />} />
      </Routes>
    </MemoryRouter>
  );

  const errors = await screen.findAllByText(/A critical error happened/);
  expect(errors[0]).toBeInTheDocument();

  server.restoreHandlers();
});
