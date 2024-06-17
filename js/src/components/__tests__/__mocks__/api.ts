import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('/wpoe/v1/admin/settings', () => {
    return HttpResponse.json({
      defaultAdminEmail: 'test@example.com',
      defaultAutoremovePeriod: 30,
      defaultExtraEmailContent: 'extra content',
      defaultTrackIpAddresses: false
    });
  })
];

export const server = setupServer(...handlers);
