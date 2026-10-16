import { AxiosError } from "axios";

/** A readable message for a failed request. */
export function errorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (!err.response) return "The server is not reachable. Check that the backend is running.";
    const msg = (err.response.data as { message?: string } | undefined)?.message;
    return msg || `${err.response.status} ${err.response.statusText}`;
  }
  return err instanceof Error ? err.message : "Unexpected error";
}
