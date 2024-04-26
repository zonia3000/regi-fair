export function extractError(err: unknown): string {
  if (typeof err === 'object' && 'message' in err) {
    return err.message as string;
  }
  return 'Unexpected error';
}