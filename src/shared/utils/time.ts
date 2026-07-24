// One clock for the whole app. Timestamps are ISO-8601 strings so they sort
// lexicographically and survive JSON/SQLite round-trips unchanged.
export function now(): string {
  return new Date().toISOString();
}
