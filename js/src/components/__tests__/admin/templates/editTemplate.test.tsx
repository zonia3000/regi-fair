import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react'
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import EditTemplate from '../../../admin/templates/EditTemplate';
import { server } from '../../__mocks__/api';
import { TemplateConfiguration } from '../../../classes/template';

test('Edit template', async () => {

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
        "extraEmailContent": "template extra email content"
      });
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

  await screen.findByText('Edit template');

  let requestBody: TemplateConfiguration;
  server.use(
    http.post('/wpoe/v1/admin/templates/1', async ({ request }) => {
      requestBody = await request.json() as TemplateConfiguration;
      return HttpResponse.json({});
    })
  );

  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('template name');
  expect(screen.getByRole('checkbox', { name: 'Autoremove user data after the event' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Allow the users to edit or delete their registrations' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Notify an administrator by e-mail when a new registration is created' })).toBeChecked();
  expect(screen.getByRole('textbox', { name: 'Administrator e-mail address' })).toHaveValue('template@example.com');
  expect(screen.getByRole('checkbox', { name: 'Add custom message to confirmation e-mail' })).toBeChecked();
  expect(screen.getByRole('textbox', { name: 'Custom confirmation e-mail content' })).toHaveValue('template extra email content');

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(requestBody.id).toEqual(1);
  expect(requestBody.name).toEqual('template name');
  expect(requestBody.autoremove).toEqual(true);
  expect(requestBody.autoremovePeriod).toEqual(30);
  expect(requestBody.waitingList).toEqual(false);
  expect(requestBody.editableRegistrations).toEqual(true);
  expect(requestBody.adminEmail).toEqual('template@example.com');
  expect(requestBody.extraEmailContent).toEqual('template extra email content');
  expect(requestBody.formFields.length).toEqual(1);
  expect(requestBody.formFields[0].fieldType).toEqual('text');
  expect(requestBody.formFields[0].label).toEqual('text field');
  expect(requestBody.formFields[0].description).toEqual(undefined);
  expect(requestBody.formFields[0].required).toEqual(true);

  server.restoreHandlers();
});