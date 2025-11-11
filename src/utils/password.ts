/**
 * Password Utilities
 *
 * Functions for securely hashing and verifying passwords using bcrypt.
 */
import bcrypt from "bcrypt";

/**
 * Hashes a plain text password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Verifies a plain text password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
