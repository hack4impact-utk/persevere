import { randomInt } from "node:crypto";

import { compare, hash } from "bcrypt";

/**
 * Generates a secure random password
 * @param length - Length of the password (default: 12)
 * @returns A secure random password with letters, numbers, and special characters
 */
export function generateSecurePassword(length = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + special;

  // Ensure at least one character from each category
  const chars: string[] = [
    lowercase[randomInt(lowercase.length)],
    uppercase[randomInt(uppercase.length)],
    numbers[randomInt(numbers.length)],
    special[randomInt(special.length)],
  ];

  // Fill the rest randomly
  for (let i = chars.length; i < length; i++) {
    chars.push(allChars[randomInt(allChars.length)]);
  }

  // Fisher-Yates shuffle for uniform randomness
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/**
 * Hashes a password using bcrypt
 * @param password - Plain text password to hash
 * @param saltRounds - Number of salt rounds (default: 10)
 * @returns Hashed password
 */
export async function hashPassword(
  password: string,
  saltRounds = 10,
): Promise<string> {
  return hash(password, saltRounds);
}

/**
 * Verifies a password against a hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return compare(password, hashedPassword);
}
