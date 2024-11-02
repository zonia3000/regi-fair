import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  http.get("/regifair/v1/admin/settings", () => {
    return HttpResponse.json({
      defaultAdminEmail: "test@example.com",
      defaultAutoremovePeriod: 30,
      defaultExtraEmailContent: "extra content",
      fromEmail: "noreply@localhost",
    });
  }),
];

export const server = setupServer(...handlers);
