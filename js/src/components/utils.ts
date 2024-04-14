export function extractError(err: unknown): string {
  if (typeof err === 'object' && 'error' in err) {
    return err.error as string;
  }
  return 'Unexpected error';
}