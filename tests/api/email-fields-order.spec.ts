import { expect, test } from "@playwright/test";
import { adminAuthStateFile, getNonceAndCookiesForApi } from "../utils";
import { searchMessage } from "../mailpit-client";

test.use({ storageState: adminAuthStateFile });

test("Email notification fields order", async ({ page, context, request }) => {
  const { nonce, cookies } = await getNonceAndCookiesForApi(page, context);

  const eventName = Math.random().toString(36).substring(7);

  let eventId: number;
  let field1Id: number;
  await test.step("Create event", async () => {
    const response = await request.post(
      "/index.php?rest_route=/regifair/v1/admin/events",
      {
        headers: {
          Cookie: cookies,
          "X-WP-Nonce": nonce,
        },
        data: {
          name: eventName,
          date: "2030-01-01T00:00:00.000Z",
          autoremove: true,
          autoremovePeriod: 30,
          waitingList: false,
          editableRegistrations: true,
          adminEmail: "admin@example.com",
          formFields: [
            {
              label: "privacy",
              fieldType: "privacy",
              required: true,
            },
          ],
          extraEmailContent: "extracontent",
        },
      }
    );
    expect(response.status()).toEqual(201);
    const body = await response.json();
    eventId = body.id;
    field1Id = body.formFields[0].id;
  });

  let field2Id: number;
  await test.step("Add new field as first field", async () => {
    const response = await request.put(
      `/index.php?rest_route=/regifair/v1/admin/events/${eventId}`,
      {
        headers: {
          Cookie: cookies,
          "X-WP-Nonce": nonce,
        },
        data: {
          name: eventName,
          date: "2030-01-01T00:00:00.000Z",
          autoremove: true,
          autoremovePeriod: 30,
          waitingList: false,
          editableRegistrations: true,
          adminEmail: "admin@example.com",
          formFields: [
            {
              label: "foo",
              fieldType: "text",
              required: true,
            },
            {
              id: field1Id,
              label: "privacy",
              fieldType: "privacy",
              required: true,
            },
          ],
        },
      }
    );
    expect(response.status()).toEqual(200);
    const body = await response.json();
    field2Id = body.formFields[0].id;
  });

  let registrationToken: string;
  await test.step("Create registration", async () => {
    const response = await request.post(
      `/index.php?rest_route=/regifair/v1/events/${eventId}`,
      {
        data: { [field1Id]: true, [field2Id]: "bar" },
      }
    );
    expect(response.status()).toEqual(201);
    const body = await response.json();
    registrationToken = body.token;
  });

  await test.step("Verify admin is notified by email and fields are sorted correctly", async () => {
    const message = await searchMessage(
      request,
      `New registration for the event "${eventName}"`
    );
    expect(message.To[0].Address).toEqual("admin@example.com");
    expect(message.Text).toContain(`* *foo* : bar
* *Privacy policy* : Accepted`);
  });

  await test.step("Delete test event", async () => {
    const deleteEventResponse = await request.delete(
      `/index.php?rest_route=/regifair/v1/admin/events/${eventId}`,
      {
        headers: {
          Cookie: cookies,
          "X-WP-Nonce": nonce,
        },
      }
    );
    expect(deleteEventResponse.status()).toEqual(204);
  });
});
