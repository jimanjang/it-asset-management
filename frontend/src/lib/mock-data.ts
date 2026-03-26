// Mock data for development without backend
import { DashboardSummary, DeviceSummary, DeviceDetail, SyncStatus } from './api';

export const mockDashboard: DashboardSummary = {
  devices: { total: 150, active: 142, disabled: 5, deprovisioned: 3 },
  assets: { total: 145, linked: 138, unlinked: 12 },
  problems: { inactive: 8, disabled: 5, unlinked: 12 },
  lastSync: { completedAt: new Date(Date.now() - 300000).toISOString(), devicesUpdated: 12, devicesCreated: 0 },
  osVersions: [
    { version: '120.0.6099.314', count: '85' },
    { version: '119.0.6045.212', count: '35' },
    { version: '118.0.5993.130', count: '20' },
    { version: '117.0.5938.92', count: '10' },
  ],
  models: [
    { model: 'HP Chromebook 14 G7', count: '45' },
    { model: 'Lenovo Chromebook C340', count: '35' },
    { model: 'Samsung Chromebook Plus', count: '30' },
    { model: 'ASUS Chromebook CX1', count: '25' },
    { model: 'Acer Chromebook 514', count: '15' },
  ],
};

export const mockDevices: DeviceSummary[] = [
  {
    id: '1', google_device_id: 'mock-001', serial_number: 'SN-CHR-001',
    model: 'HP Chromebook 14 G7', os_version: '120.0.6099.314',
    platform_version: '15662.72.0', firmware_version: 'Google_Coral.11151.39.0',
    boot_mode: 'Verified', cpu_model: 'Intel Celeron N4020', ram_total: 4294967296,
    status: 'ACTIVE', compliance_status: 'COMPLIANT',
    assigned_user: 'laika@daangnservice.com', location: 'Seoul HQ - 2F',
    enrollment_time: '2024-01-15T09:00:00Z',
    last_google_sync: new Date(Date.now() - 300000).toISOString(),
    last_activity_time: new Date(Date.now() - 900000).toISOString(),
    last_synced_at: new Date(Date.now() - 300000).toISOString(),
    asset_id: 'a1', asset: { id: 'a1', asset_tag: 'DS-CHR-001', name: 'HP Chromebook 14', category: 'laptop', manufacturer: 'HP', model: 'Chromebook 14 G7', serial_number: 'SN-CHR-001', status: 'active', purchase_date: '2024-01-10', purchase_cost: 450000, warranty_expiry: '2027-01-10', location: 'Seoul HQ' },
  },
  {
    id: '2', google_device_id: 'mock-002', serial_number: 'SN-CHR-002',
    model: 'Lenovo Chromebook C340', os_version: '119.0.6045.212',
    platform_version: '15577.58.0', firmware_version: 'Google_Hatch.12672.91.0',
    boot_mode: 'Verified', cpu_model: 'Intel Core i3-10110U', ram_total: 8589934592,
    status: 'ACTIVE', compliance_status: 'COMPLIANT',
    assigned_user: 'willie@daangnservice.com', location: 'Seoul HQ - 3F',
    enrollment_time: '2024-02-20T10:30:00Z',
    last_google_sync: new Date(Date.now() - 86400000).toISOString(),
    last_activity_time: new Date(Date.now() - 3600000).toISOString(),
    last_synced_at: new Date(Date.now() - 300000).toISOString(),
    asset_id: 'a2', asset: { id: 'a2', asset_tag: 'DS-CHR-002', name: 'Lenovo C340', category: 'laptop', manufacturer: 'Lenovo', model: 'Chromebook C340', serial_number: 'SN-CHR-002', status: 'active', purchase_date: '2024-02-15', purchase_cost: 680000, warranty_expiry: '2027-02-15', location: 'Seoul HQ' },
  },
  {
    id: '3', google_device_id: 'mock-003', serial_number: 'SN-CHR-003',
    model: 'ASUS Chromebook CX1', os_version: '118.0.5993.130',
    platform_version: '15514.40.0', firmware_version: 'Google_Dedede.13606.132.0',
    boot_mode: 'Verified', cpu_model: 'Intel Celeron N4500', ram_total: 4294967296,
    status: 'DISABLED', compliance_status: 'NON_COMPLIANT',
    assigned_user: '', location: 'Warehouse',
    enrollment_time: '2023-06-01T08:00:00Z',
    last_google_sync: new Date(Date.now() - 86400000 * 35).toISOString(),
    last_activity_time: new Date(Date.now() - 86400000 * 35).toISOString(),
    last_synced_at: new Date(Date.now() - 300000).toISOString(),
    asset_id: null,
  },
  {
    id: '4', google_device_id: 'mock-004', serial_number: 'SN-CHR-004',
    model: 'Samsung Chromebook Plus', os_version: '120.0.6099.314',
    platform_version: '15662.72.0', firmware_version: 'Google_Nautilus.11151.39.0',
    boot_mode: 'Verified', cpu_model: 'Intel Core m3-8100Y', ram_total: 4294967296,
    status: 'ACTIVE', compliance_status: 'COMPLIANT',
    assigned_user: 'noel.park@daangnservice.com', location: 'Seoul HQ - 1F',
    enrollment_time: '2024-03-10T11:00:00Z',
    last_google_sync: new Date(Date.now() - 3600000).toISOString(),
    last_activity_time: new Date(Date.now() - 7200000).toISOString(),
    last_synced_at: new Date(Date.now() - 300000).toISOString(),
    asset_id: 'a4', asset: { id: 'a4', asset_tag: 'DS-CHR-004', name: 'Samsung Plus', category: 'laptop', manufacturer: 'Samsung', model: 'Chromebook Plus', serial_number: 'SN-CHR-004', status: 'active', purchase_date: '2024-03-05', purchase_cost: 520000, warranty_expiry: '2027-03-05', location: 'Seoul HQ' },
  },
  {
    id: '5', google_device_id: 'mock-005', serial_number: 'SN-CHR-005',
    model: 'Acer Chromebook 514', os_version: '117.0.5938.92',
    platform_version: '15393.63.0', firmware_version: 'Google_Brya.15425.32.0',
    boot_mode: 'Verified', cpu_model: 'Intel Core i5-1235U', ram_total: 8589934592,
    status: 'ACTIVE', compliance_status: 'COMPLIANT',
    assigned_user: 'alex@daangnservice.com', location: 'Busan Office',
    enrollment_time: '2024-04-01T09:00:00Z',
    last_google_sync: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_activity_time: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_synced_at: new Date(Date.now() - 300000).toISOString(),
    asset_id: 'a5', asset: { id: 'a5', asset_tag: 'DS-CHR-005', name: 'Acer 514', category: 'laptop', manufacturer: 'Acer', model: 'Chromebook 514', serial_number: 'SN-CHR-005', status: 'active', purchase_date: '2024-03-25', purchase_cost: 780000, warranty_expiry: '2027-03-25', location: 'Busan Office' },
  },
];

export const mockDeviceDetail: DeviceDetail = {
  ...mockDevices[0],
  network: { mac_address: 'AA:BB:CC:DD:EE:01', lan_ip: '192.168.1.100', wan_ip: '203.0.113.50', network_type: 'wifi' },
  latestMetrics: { cpu_usage: 35.2, memory_usage: 68.5, disk_total: 32212254720, disk_used: 18253611008, temperature: 45.0, collected_at: new Date().toISOString() },
  device_users: [{ email: 'laika@daangnservice.com', type: 'enrolled', last_seen: new Date().toISOString() }],
  history: [
    { id: 'h1', action: 'synced', old_value: '', new_value: 'Device synced from Google Admin', changed_by: 'sync_worker', created_at: new Date(Date.now() - 300000).toISOString() },
    { id: 'h2', action: 'status_changed', old_value: 'DISABLED', new_value: 'ACTIVE', changed_by: 'sync_worker', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'h3', action: 'linked', old_value: '', new_value: 'Auto-linked via serial: SN-CHR-001', changed_by: 'system', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: 'h4', action: 'assigned', old_value: '', new_value: 'Assigned to laika@daangnservice.com', changed_by: 'admin', created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: 'h5', action: 'created', old_value: '', new_value: 'Asset DS-CHR-001 created', changed_by: 'admin', created_at: new Date(Date.now() - 86400000 * 60).toISOString() },
  ],
};

export const mockSyncStatus: SyncStatus = {
  isSyncing: false,
  lastSync: {
    id: 's1', sync_type: 'delta', status: 'completed',
    devices_found: 5, devices_created: 0, devices_updated: 3, devices_unchanged: 2,
    started_at: new Date(Date.now() - 360000).toISOString(),
    completed_at: new Date(Date.now() - 300000).toISOString(),
  },
  googleApiConfigured: false,
};

export const mockMetrics = {
  deviceId: '1',
  range: '24h',
  metrics: Array.from({ length: 24 }, (_, i) => ({
    cpu_usage: 20 + Math.random() * 40,
    memory_usage: 50 + Math.random() * 30,
    disk_used: 17000000000 + Math.random() * 2000000000,
    disk_total: 32212254720,
    temperature: 38 + Math.random() * 15,
    collected_at: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
  })),
};
