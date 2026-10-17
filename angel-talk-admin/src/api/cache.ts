/**
 * Pages show the data they had last time immediately and refresh it in the background,
 * so moving between pages of the admin panel does not wait for the server every time.
 */
const store = new Map<string, unknown>();

export function peek<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function keep<T>(key: string, data: T): T {
  store.set(key, data);
  return data;
}
