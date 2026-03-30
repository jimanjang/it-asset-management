import { Injectable, Logger } from '@nestjs/common';
import { GoogleAdminService } from '../sync/google-admin.service';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  private readonly DEFAULT_SCHEMAS = [
    'chrome.users.BrowserSignin',
    'chrome.users.ProfileSeparationSettings',
    'chrome.users.MobileManagement',
    'chrome.users.ChromeOnIos',
    'chrome.users.AllowPopulateAssetId',
    'chrome.users.SiteIsolationBrowser',
    'chrome.users.PasswordManager',
    'chrome.users.IncognitoMode',
    'chrome.users.SingleSignOn',
    'chrome.users.SingleSignOnLoginFrequency',
    'chrome.users.SamlLockScreenOfflineSigninTimeLimitDays',
    'chrome.users.SamlLockScreenReauthenticationEnabled',
    'chrome.users.SingleSignOnPasswordSynchronization',
    'chrome.users.LockScreenAutoStartOnlineReauth',
    'chrome.users.DnsOverHttps',
    'chrome.users.SafeSearchRestrictedMode',
    'chrome.users.Screenshot',
    'chrome.users.ClipboardSettings',
    'chrome.users.EnterpriseCustomLabel',
    'chrome.users.EnterpriseLogoUrl',
  ];

  constructor(private googleAdmin: GoogleAdminService) {}

  async getPolicies(orgUnitPath: string = '/', schemas: string[] = []) {
    // 1. Find the Org Unit ID from path
    let targetOU;
    
    if (orgUnitPath === '/') {
        try {
            targetOU = await this.googleAdmin.getRootOrgUnit();
        } catch (e) {
            this.logger.error('Failed to resolve root OU:', e.message);
        }
    }

    if (!targetOU) {
        const ous = await this.googleAdmin.listOrgUnits();
        targetOU = ous.find(ou => ou.orgUnitPath === orgUnitPath);
    }

    if (!targetOU) {
        throw new Error(`Organizational Unit not found: ${orgUnitPath}`);
    }

    let ouId: string | undefined;
    
    // Handle list response or single object
    if ((targetOU as any).organizationUnits && (targetOU as any).organizationUnits.length > 0) {
        ouId = (targetOU as any).organizationUnits[0].parentOrgUnitId;
    } else {
        ouId = targetOU.orgUnitId || (targetOU as any).id || (targetOU as any).name;
    }

    // Strip 'id:' prefix if present (Chrome Policy API usually expects numeric)
    if (ouId && ouId.startsWith('id:')) {
        ouId = ouId.substring(3);
    }

    if (!ouId) {
        throw new Error(`Could not determine ID for Org Unit: ${orgUnitPath}`);
    }

    const targetResource = `orgunits/${ouId}`;
    this.logger.log(`Resolving policies for target: ${targetResource}`);

    // 2. Resolve policies (passing defaults if empty)
    const activeSchemas = schemas.length > 0 ? schemas : this.DEFAULT_SCHEMAS;
    return this.googleAdmin.resolvePolicies(targetResource, activeSchemas);
  }

  async updatePolicy(orgUnitPath: string, schema: string, value: any, updateMask: string) {
    let targetOU;
    
    if (orgUnitPath === '/') {
        try {
            targetOU = await this.googleAdmin.getRootOrgUnit();
        } catch (e) {
            this.logger.error('Failed to resolve root OU for update:', e.message);
        }
    }

    if (!targetOU) {
        const ous = await this.googleAdmin.listOrgUnits();
        targetOU = ous.find(ou => ou.orgUnitPath === orgUnitPath);
    }

    if (!targetOU) {
        throw new Error(`Organizational Unit not found: ${orgUnitPath}`);
    }

    const ouId = targetOU.orgUnitId || (targetOU as any).id || (targetOU as any).name;
    const targetResource = `orgunits/${ouId}`;
    this.logger.debug(`Updating policy for target: ${targetResource}`);
    return this.googleAdmin.updatePolicy(targetResource, schema, value, updateMask);
  }

  async getOrgUnits() {
    return this.googleAdmin.listOrgUnits();
  }
}
