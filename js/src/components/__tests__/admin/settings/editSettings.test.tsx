import * as React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import Settings from '../../../admin/settings/Settings';
import { server } from '../../__mocks__/api';

test('Edit settings', async () => {

  let body: any;
  server.use(
    http.post('/wpoe/v1/admin/settings', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ defaultExtraEmailContent: '' });
    })
  );

  render(<Settings />);

  await screen.findByText('Settings');

  const adminEmailInput = screen.getByRole('textbox', { name: 'Default event admin e-mail address' });
  const autoremovePeriodInput = screen.getByRole('spinbutton', { name: 'Default autoremove period' });
  const extraEmailContentInput = screen.getByRole('textbox', { name: 'Default extra content for confirmation e-mail messages' });
  const trackIpCheckbox = screen.getByRole('checkbox', { name: 'Track IP addresses during the registration' });

  expect(adminEmailInput).toHaveValue('test@example.com');
  expect(autoremovePeriodInput).toHaveValue(30);
  expect(extraEmailContentInput).toHaveValue('extra content');
  expect(trackIpCheckbox).not.toBeChecked();

  const user = userEvent.setup();

  await user.clear(adminEmailInput);
  await user.type(adminEmailInput, 'foo@example.com');
  await user.clear(autoremovePeriodInput);
  await user.type(autoremovePeriodInput, '10');
  await user.clear(extraEmailContentInput);
  await user.type(extraEmailContentInput, 'foobar');
  await user.click(trackIpCheckbox);

  await user.click(screen.getByRole('button', { name: 'Save' }));

  await screen.findAllByText('Settings updated');

  expect(body.defaultAdminEmail).toEqual('foo@example.com');
  expect(body.defaultAutoremovePeriod).toEqual(10);
  expect(body.defaultExtraEmailContent).toEqual('foobar');
  expect(body.defaultTrackIpAddresses).toEqual(true);
});
