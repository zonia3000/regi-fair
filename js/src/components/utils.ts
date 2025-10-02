import { EventConfiguration } from "./classes/event";
import { Field } from "./classes/fields";

export function checkErrorCode(err: unknown, expectedCode: string) {
  if (typeof err === "object" && "code" in err) {
    return err.code === expectedCode;
  }
  return false;
}

export function extactFieldErrors(err: unknown): Record<number, string> {
  if (
    typeof err === "object" &&
    "data" in err &&
    typeof err.data === "object" &&
    "fieldsErrors" in err.data &&
    typeof err.data.fieldsErrors === "object"
  ) {
    return err.data.fieldsErrors as Record<number, string>;
  }
  return {};
}

export function extractError(err: unknown): string {
  if (typeof err === "object" && "message" in err) {
    return err.message as string;
  }
  return "Unexpected error";
}

export function getDefaultFieldValue(
  field: Field
): string | string[] | boolean {
  switch (field.fieldType) {
    case "checkbox":
    case "privacy":
      return false;
    case "dropdown":
      if ("multiple" in field.extra && field.extra.multiple) {
        return [] as string[];
      }
      return "";
    default:
      return "";
  }
}

/**
 * Prepares the fields to be used as request body in API calls,
 * removing all the invalid or read-only properties.
 */
export function cleanupFields(
  fields: Array<Field & { position?: number }>
): Field[] {
  return fields.map((f) => ({
    ...f,
    description: f.description || undefined,
    position: undefined,
    extra: f.extra || undefined,
  }));
}

export function isNumberOfPeopleField(field: Field): boolean {
  return (
    field.extra &&
    "useAsNumberOfPeople" in field.extra &&
    field.extra.useAsNumberOfPeople == true
  );
}

export function hasConfirmationAddressFields(eventConfig: EventConfiguration) {
  return (
    eventConfig.formFields.filter(
      (f) =>
        f.fieldType === "email" &&
        f.extra &&
        "confirmationAddress" in f.extra &&
        f.extra.confirmationAddress === true
    ).length > 0
  );
}
