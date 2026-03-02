/**
 * Shared DB helpers for the service layer.
 */

/**
 * Coerces SQL aggregate results to a number.
 * Drizzle may return bigint for COUNT/SUM results depending on the driver.
 * Handles bigint, string, number, and null/undefined — always returns a number.
 */
export function toNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "number") return value;
  return 0;
}
