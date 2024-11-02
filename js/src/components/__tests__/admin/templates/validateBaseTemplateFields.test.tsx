import * as React from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import EditTemplate from "../../../admin/templates/EditTemplate";
import { server } from "../../__mocks__/api";
import { TemplateConfiguration } from "../../../classes/template";

test("Validate base template fields", async () => {
  render(
    <MemoryRouter initialEntries={["/template/new"]}>
      <Routes>
        <Route path="/" element={<div></div>} />
        <Route path="/template/:templateId" element={<EditTemplate />} />
      </Routes>
    </MemoryRouter>,
  );

  await screen.findByText("Create template");

  let requestBody: TemplateConfiguration;
  server.use(
    http.post("/regifair/v1/admin/templates", async ({ request }) => {
      requestBody = (await request.json()) as TemplateConfiguration;
      return HttpResponse.json({ id: 1 });
    }),
  );

  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getAllByText("Field is required").length).toEqual(1);

  const adminEmailInput = screen.getByRole("textbox", {
    name: "Administrator e-mail address",
  });
  await user.clear(adminEmailInput);

  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getAllByText("Field is required").length).toEqual(2);

  await user.type(adminEmailInput, "admin@example.com");
  await user.type(
    screen.getByRole("textbox", { name: "Name" }),
    "Template name",
  );

  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(requestBody.name).toEqual("Template name");
  expect(requestBody.adminEmail).toEqual("admin@example.com");

  server.restoreHandlers();
});
