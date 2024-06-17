import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { server } from '../../__mocks__/api';
import TemplatesRoot from '../../../admin/templates/TemplatesRoot';

test('Navigate template pages', async () => {

  server.use(
    http.get('/wpoe/v1/admin/templates', async () => {
      return HttpResponse.json([
        { "id": 1, "name": "template1" },
        { "id": 2, "name": "template2" }
      ]);
    })
  );

  server.use(
    http.get('/wpoe/v1/admin/templates/1', async () => {
      return HttpResponse.json({
        "id": 1,
        "name": "template name",
        "formFields": [
          { id: 1, "fieldType": "text", "label": "text field", "required": true }
        ],
        "autoremove": true,
        "autoremovePeriod": "30",
        "waitingList": false,
        "editableRegistrations": true,
        "adminEmail": "template@example.com",
        "extraEmailContent": null
      });
    })
  );

  render(<TemplatesRoot />);
  const user = userEvent.setup();

  expect(await screen.findByText('Event templates')).toBeInTheDocument();

  await user.click(screen.getByText('Add event template'));
  expect(await screen.findByText('Create template')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByText('Event templates')).toBeInTheDocument();

  await user.click(screen.getByText('template1'));
  expect(await screen.findByText('Edit template')).toBeInTheDocument();
});
