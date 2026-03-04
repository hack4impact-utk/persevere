/**
 * Validates and parses an ID from a string parameter.
 * Returns null if the ID is invalid (not a positive integer).
 */
export function validateAndParseId(id: string): number | null {
  // Check if the ID is a non-empty string of digits
  if (!/^\d+$/.test(id)) {
    return null;
  }

  const parsed = Number.parseInt(id, 10);

  // Ensure it's a valid positive integer within PostgreSQL INT range
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 2_147_483_647) {
    return null;
  }

  return parsed;
}
