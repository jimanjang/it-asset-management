import { google } from "googleapis";
import { normalizePrivateKey } from "./auth-utils";

/**
 * Helper to get a Google Auth client with optional subject (impersonation).
 */
async function getGoogleAuth(scopes: string[], subject?: string) {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is missing from environment variables");
  }

  let email: string;
  let key: string;

  try {
    // 1. Try treating it as a JSON string
    if (serviceAccountKey.startsWith('{') || serviceAccountKey.startsWith('[')) {
      const parsed = JSON.parse(serviceAccountKey);
      email = parsed.client_email;
      key = parsed.private_key;
    } 
    // 2. Fallback to separate variables if available (backwards compatibility)
    else {
      email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
      key = process.env.GOOGLE_PRIVATE_KEY || "";
    }
  } catch (err: any) {
    throw new Error(`Failed to initialize Google Auth: ${err.message}`);
  }

  if (!email || !key) {
    throw new Error("Missing service account credentials (email or private_key)");
  }

  // Use JWT for reliable domain-wide delegation
  return new google.auth.JWT({
    email,
    key: normalizePrivateKey(key),
    scopes,
    subject
  });
}

/**
 * Checks if a specific user has Super Admin privileges in Google Workspace.
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  const adminEmail = process.env.GOOGLE_DELEGATED_ADMIN || process.env.GOOGLE_ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.error("GOOGLE_DELEGATED_ADMIN (or GOOGLE_ADMIN_EMAIL) is missing from environment variables");
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
    return false;
  }
}
