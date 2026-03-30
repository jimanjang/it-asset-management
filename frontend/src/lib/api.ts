const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Types
export interface DeviceListResponse {
  data: DeviceSummary[];
  meta: PaginationMeta;
}

export interface DeviceSummary {
  id: string;
  google_device_id: string;
  serial_number: string;
  model: string;
  os_version: string;
  platform_version: string;
  firmware_version: string;
  boot_mode: string;
  cpu_model: string;
  ram_total: number;
  status: 'ACTIVE' | 'DISABLED' | 'DEPROVISIONED';
  compliance_status: string;
  assigned_user: string;
  location: string;
  enrollment_time: string;
  last_google_sync: string;
  last_activity_time: string;
  last_synced_at: string;
  asset_id: string | null;
  asset?: AssetSummary;
  annotated_location?: string;
  annotated_asset_id?: string;
  notes?: string;
  mac_address?: string;
  hardware_info?: any;
}

export interface DeviceDetail extends DeviceSummary {
  network: NetworkInfo | null;
  latestMetrics: MetricEntry | null;
  device_users: DeviceUserEntry[];
  history: HistoryEntry[];
}

export interface AssetSummary {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  purchase_date: string;
  purchase_cost: number;
  warranty_expiry: string;
  location: string;
  device?: any;
  device_linked?: boolean;
}

export interface NetworkInfo {
  mac_address: string;
  lan_ip: string;
  wan_ip: string;
  network_type: string;
}

export interface MetricEntry {
  cpu_usage: number | null;
  memory_usage: number | null;
  disk_total: number | null;
  disk_used: number | null;
  temperature: number | null;
  collected_at: string;
}

export interface DeviceUserEntry {
  email: string;
  type: string;
  last_seen: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  created_at: string;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  devices_found: number;
  devices_created: number;
  devices_updated: number;
  devices_unchanged: number;
  error_message?: string;
  started_at: string;
  completed_at: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSync: SyncLog | null;
  googleApiConfigured: boolean;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardSummary {
  devices: { total: number; active: number; disabled: number; deprovisioned: number };
  assets: { total: number; linked: number; unlinked: number };
  problems: { inactive: number; disabled: number; unlinked: number };
  lastSync: { completedAt: string; devicesUpdated: number; devicesCreated: number } | null;
  osVersions: { version: string; count: string }[];
  models: { model: string; count: string }[];
}

// Duplicated SyncStatus removed to avoid merge conflicts

// Format helpers
export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '알 수 없음';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 30) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
