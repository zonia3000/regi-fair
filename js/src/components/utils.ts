import { Field } from "./classes/fields";

export function extractError(err: unknown): string {
  if (typeof err === 'object' && 'message' in err) {
    return err.message as string;
  }
  return 'Unexpected error';
}

/**
 * Prepares the fields to be used as request body in API calls,
 * removing all the invalid or read-only properties.
 */
export function cleanupFields(fields: Field[]): Field[] {
  return fields.map(f => ({
    ...f,
    description: f.description || undefined,
    position: undefined,
    validators: undefined,
    extra: f.extra || undefined
  }));
}