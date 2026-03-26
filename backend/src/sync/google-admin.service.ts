import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { google, admin_directory_v1 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Google Admin SDK Service
 * Uses Service Account with Domain-wide Delegation to access Chrome Device API
 */
@Injectable()
export class GoogleAdminService implements OnModuleInit {
  private readonly logger = new Logger(GoogleAdminService.name);
  private directoryService: admin_directory_v1.Admin;
  private isConfigured = false;

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    try {
      const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      const delegatedAdmin = process.env.GOOGLE_DELEGATED_ADMIN;

      if (!keyFilePath || !delegatedAdmin) {
        this.logger.warn(
          'Google Service Account not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_DELEGATED_ADMIN env vars.',
        );
        return;
      }

      let keyFile: any;
      if (fs.existsSync(keyFilePath)) {
        keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      } else {
        // Try parsing as JSON directly
        keyFile = JSON.parse(keyFilePath);
      }

      const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: [
          'https://www.googleapis.com/auth/admin.directory.device.chromeos.readonly',
          'https://www.googleapis.com/auth/admin.directory.device.chromeos',
          'https://www.googleapis.com/auth/admin.reports.audit.readonly',
        ],
        subject: delegatedAdmin, // Domain-wide delegation
      });

      this.directoryService = google.admin({ version: 'directory_v1', auth });
      this.isConfigured = true;
      this.logger.log('✅ Google Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Admin SDK:', error.message);
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Fetch all ChromeOS devices with pagination
   */
  async fetchAllDevices(query?: string): Promise<admin_directory_v1.Schema$ChromeOsDevice[]> {
    if (!this.isConfigured) {
      this.logger.warn('Google Admin SDK not configured, returning mock data');
      return this.getMockDevices();
    }

    const customerId = process.env.GOOGLE_CUSTOMER_ID || 'my_customer';
    const allDevices: admin_directory_v1.Schema$ChromeOsDevice[] = [];
    let pageToken: string | undefined;

    do {
      try {
        const response = await this.directoryService.chromeosdevices.list({
          customerId,
          maxResults: 100,
          projection: 'FULL',
          orderBy: 'lastSync',
          pageToken,
          query,
        });

        if (response.data.chromeosdevices) {
          allDevices.push(...response.data.chromeosdevices);
        }

        pageToken = response.data.nextPageToken || undefined;

        // Rate limit: 500ms between requests
        if (pageToken) {
          await this.sleep(500);
        }
      } catch (error) {
        if (error.code === 429) {
          // Rate limited - exponential backoff
          this.logger.warn('Rate limited, backing off...');
          await this.exponentialBackoff(1);
          continue;
        }
        throw error;
      }
    } while (pageToken);

    this.logger.log(`Fetched ${allDevices.length} ChromeOS devices from Google Admin`);
    return allDevices;
  }

  /**
   * Fetch devices modified since a given time (delta sync)
   */
  async fetchDevicesSince(since: Date): Promise<admin_directory_v1.Schema$ChromeOsDevice[]> {
    const query = `sync:${since.toISOString().split('T')[0]}..`;
    return this.fetchAllDevices(query);
  }

  private async exponentialBackoff(attempt: number, maxAttempt = 6): Promise<void> {
    const delay = Math.min(Math.pow(2, attempt) * 1000, 60000);
    this.logger.warn(`Backoff attempt ${attempt}: waiting ${delay}ms`);
    await this.sleep(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Mock data for development without Google API credentials
   */
  private getMockDevices(): any[] {
    return [
      {
        deviceId: 'mock-device-001',
        serialNumber: 'SN-CHR-001',
        model: 'HP Chromebook 14 G7',
        osVersion: '120.0.6099.314',
        platformVersion: '15662.72.0',
        firmwareVersion: 'Google_Coral.11151.39.0',
        bootMode: 'Verified',
        status: 'ACTIVE',
        lastSync: new Date().toISOString(),
        annotatedUser: 'laika@daangnservice.com',
        annotatedLocation: 'Seoul HQ - 2F',
        annotatedAssetId: 'DS-CHR-001',
        recentUsers: [{ type: 'USER_TYPE_MANAGED', email: 'laika@daangnservice.com' }],
        activeTimeRanges: [{ date: new Date().toISOString().split('T')[0], activeTime: 28800000 }],
        cpuInfo: [{ model: 'Intel Celeron N4020', architecture: 'x86_64', maxClockSpeedKhz: 2800000 }],
        memoryInfo: { totalRam: '4294967296' },
        diskVolumeReports: [{ volumeInfo: [{ storageFree: '15000000000', storageTotal: '32212254720' }] }],
        lastKnownNetwork: [{ ipAddress: '192.168.1.100', wanIpAddress: '203.0.113.50' }],
        macAddress: 'AA:BB:CC:DD:EE:01',
        ethernetMacAddress: 'AA:BB:CC:DD:EE:02',
        orgUnitPath: '/ChromeOS/Seoul',
      },
      {
        deviceId: 'mock-device-002',
        serialNumber: 'SN-CHR-002',
        model: 'Lenovo Chromebook C340',
        osVersion: '119.0.6045.212',
        platformVersion: '15577.58.0',
        firmwareVersion: 'Google_Hatch.12672.91.0',
        bootMode: 'Verified',
        status: 'ACTIVE',
        lastSync: new Date(Date.now() - 86400000).toISOString(),
        annotatedUser: 'willie@daangnservice.com',
        annotatedLocation: 'Seoul HQ - 3F',
        annotatedAssetId: 'DS-CHR-002',
        recentUsers: [{ type: 'USER_TYPE_MANAGED', email: 'willie@daangnservice.com' }],
        cpuInfo: [{ model: 'Intel Core i3-10110U', architecture: 'x86_64', maxClockSpeedKhz: 4100000 }],
        memoryInfo: { totalRam: '8589934592' },
        diskVolumeReports: [{ volumeInfo: [{ storageFree: '40000000000', storageTotal: '64424509440' }] }],
        lastKnownNetwork: [{ ipAddress: '192.168.1.101', wanIpAddress: '203.0.113.51' }],
        macAddress: 'AA:BB:CC:DD:EE:03',
        orgUnitPath: '/ChromeOS/Seoul',
      },
      {
        deviceId: 'mock-device-003',
        serialNumber: 'SN-CHR-003',
        model: 'ASUS Chromebook CX1',
        osVersion: '118.0.5993.130',
        platformVersion: '15514.40.0',
        firmwareVersion: 'Google_Dedede.13606.132.0',
        bootMode: 'Verified',
        status: 'DISABLED',
        lastSync: new Date(Date.now() - 86400000 * 35).toISOString(),
        annotatedUser: '',
        annotatedLocation: 'Warehouse',
        recentUsers: [],
        cpuInfo: [{ model: 'Intel Celeron N4500', architecture: 'x86_64', maxClockSpeedKhz: 2800000 }],
        memoryInfo: { totalRam: '4294967296' },
        diskVolumeReports: [{ volumeInfo: [{ storageFree: '25000000000', storageTotal: '32212254720' }] }],
        macAddress: 'AA:BB:CC:DD:EE:05',
        orgUnitPath: '/ChromeOS/Inactive',
      },
      {
        deviceId: 'mock-device-004',
        serialNumber: 'SN-CHR-004',
        model: 'Samsung Chromebook Plus',
        osVersion: '120.0.6099.314',
        platformVersion: '15662.72.0',
        firmwareVersion: 'Google_Nautilus.11151.39.0',
        bootMode: 'Verified',
        status: 'ACTIVE',
        lastSync: new Date(Date.now() - 3600000).toISOString(),
        annotatedUser: 'noel.park@daangnservice.com',
        annotatedLocation: 'Seoul HQ - 1F',
        annotatedAssetId: 'DS-CHR-004',
        recentUsers: [{ type: 'USER_TYPE_MANAGED', email: 'noel.park@daangnservice.com' }],
        cpuInfo: [{ model: 'Intel Core m3-8100Y', architecture: 'x86_64', maxClockSpeedKhz: 3400000 }],
        memoryInfo: { totalRam: '4294967296' },
        diskVolumeReports: [{ volumeInfo: [{ storageFree: '18000000000', storageTotal: '32212254720' }] }],
        lastKnownNetwork: [{ ipAddress: '192.168.1.102', wanIpAddress: '203.0.113.52' }],
        macAddress: 'AA:BB:CC:DD:EE:07',
        orgUnitPath: '/ChromeOS/Seoul',
      },
      {
        deviceId: 'mock-device-005',
        serialNumber: '5CD9273Q22',
        model: 'HP ProBook 440 G6',
        network: { mac_address: '4C:E1:73:4C:B8:1D', wan_ip: '211.171.249.109', lan_ip: '172.17.15.34' },
        orgUnitPath: '/ChromeOS/Busan',
      },
    ];
  }

  async updateDevice(deviceId: string, data: any): Promise<any> {
    if (!this.isReady()) throw new Error('Google Admin SDK is not ready');
    try {
      const response = await this.directoryService.chromeosdevices.patch({
        customerId: process.env.GOOGLE_CUSTOMER_ID || 'my_customer',
        deviceId,
        requestBody: {
          annotatedUser: data.annotatedUser,
          annotatedLocation: data.annotatedLocation,
          annotatedAssetId: data.annotatedAssetId,
          notes: data.notes,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update device ${deviceId}:`, error.message);
      throw error;
    }
  }

  async getDeviceReports(serialNumber: string): Promise<any[]> {
    if (!this.isReady()) throw new Error('Google Admin SDK is not ready');
    try {
      // NOTE: Requires 'admin.reports.audit.readonly' scope and domain-wide delegation for it
      const reportsService = google.admin({ version: 'reports_v1', auth: this.directoryService.context._options.auth });
      const queryParams: any = {
        userKey: 'all',
        applicationName: 'chrome',
        maxResults: 50,
      };

      if (serialNumber) {
        queryParams.filters = `DEVICE_NAME==${serialNumber}`;
      }

      const response = await reportsService.activities.list(queryParams);
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch device reports', error);
      // Return empty array if scope is missing instead of crashing
      return [];
    }
  }
}
