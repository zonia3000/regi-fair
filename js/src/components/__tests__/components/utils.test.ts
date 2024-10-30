import { expect, test } from "vitest";
import { cleanupFields } from "../../utils";

test("cleanupFields", () => {
  const [cleanedField] = cleanupFields([
    {
      label: "text",
      fieldType: "text",
      required: true,
      description: null,
      extra: null,
      position: 1,
    },
  ]);
  expect(cleanedField.description).toBeUndefined();
  expect(cleanedField).toHaveProperty("position", undefined);
  expect(cleanedField.extra).toBeUndefined();
});
