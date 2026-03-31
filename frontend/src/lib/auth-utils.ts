/**
 * Normalizes a Google Private Key string.
 * Handles escaped newlines and RAW strings from .env files,
 * ensuring the private key is in a format that the Google Auth library can process.
 */
export function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;

  // Handle both literal \n characters and escaped \\n strings
  return key.split(String.raw`\n`).join("\n").replace(/\\n/g, "\n");
}
