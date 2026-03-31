import { google } from "googleapis";
import { normalizePrivateKey } from "./auth-utils";

/**
 * Helper to get a Google Auth client with optional subject (impersonation).
 */
async function getGoogleAuth(scopes: string[], subject?: string) {
  // Use JWT for reliable domain-wide delegation
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes,
    subject
  });
}

/**
 * Checks if a specific user has Super Admin privileges in Google Workspace.
 * Requires Admin SDK API enabled and Service Account with Domain-Wide Delegation.
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("GOOGLE_ADMIN_EMAIL is missing from environment variables");
    return false;
  }

  try {
    const auth = await getGoogleAuth(
      ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      adminEmail
    );

    const admin = google.admin({ version: "directory_v1", auth: auth as any });

    const res = await admin.users.get({ userKey: email });
    const isAdmin = res.data.isAdmin || false;
    
    console.log(`[Admin Check] ${email} -> isAdmin: ${isAdmin}`);
    return isAdmin;
  } catch (error: any) {
    console.error(`[Admin Check Error] Failed for ${email}:`, error.message);
    // If the account does not exist or API fails, assume not an admin
    return false;
  }
}
