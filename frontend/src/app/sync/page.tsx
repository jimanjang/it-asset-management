'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { formatDate, formatRelativeTime, fetchApi, SyncLog, SyncStatus } from '@/lib/api';
import { useState, useEffect } from 'react';

export default function SyncPage() {
  console.log('Rendering SyncPage component...');
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      fetchApi<SyncStatus>('/sync/status'),
      fetchApi<SyncLog[]>('/sync/logs?limit=20')
    ]).then(([statusRes, logsRes]) => {
      setSync(statusRes);
      setLogs(logsRes);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async (type: string) => {
    setSyncing(true);
    try {
      await fetchApi(`/sync/devices?type=${type}`, { method: 'POST' });
      // Reload logs after a brief delay
      setTimeout(loadData, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">🔄 동기화 관리</h1>
          <p className="text-sm text-[#6B7280] mt-1">Google Admin → 내부 시스템 디바이스 동기화 관리</p>
        </div>

        {/* Sync Status Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-[15px] mb-1">동기화 상태</h3>
              {!loading && sync && (
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${sync.googleApiConfigured ? 'bg-[#2E7D32]' : 'bg-[#FFA726] animate-pulse-dot'}`}></span>
                  <span className="text-sm text-[#6B7280]">
                    {sync.googleApiConfigured ? 'Google API 연동 완료' : 'Mock 모드 (Google API 미설정)'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                className="btn-secondary text-sm"
                disabled={syncing}
                onClick={() => handleSync('delta')}
              >
                {syncing ? '⏳ 진행 중...' : '⚡ Delta Sync'}
              </button>
              <button
                className="btn-primary text-sm"
                disabled={syncing}
                onClick={() => handleSync('full')}
              >
                {syncing ? '⏳ 진행 중...' : '🔄 Full Sync'}
              </button>
            </div>
          </div>

          {/* Sync Strategy Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FFF8F0] border border-[#F3E8DE]">
              <p className="text-xs text-[#6B7280] mb-1">Delta Sync</p>
              <p className="text-sm font-semibold">매 15분</p>
              <p className="text-xs text-[#999] mt-1">변경분만 동기화</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FFF8F0] border border-[#F3E8DE]">
              <p className="text-xs text-[#6B7280] mb-1">Full Sync</p>
              <p className="text-sm font-semibold">매일 02:00</p>
              <p className="text-xs text-[#999] mt-1">전체 디바이스 동기화</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FFF8F0] border border-[#F3E8DE]">
              <p className="text-xs text-[#6B7280] mb-1">Rate Limit</p>
              <p className="text-sm font-semibold">2,400 QPM</p>
              <p className="text-xs text-[#999] mt-1">Exponential Backoff</p>
            </div>
          </div>
        </div>

        {/* API Configuration Guide */}
        {!loading && sync && !sync.googleApiConfigured && (
          <div className="card mb-6 border-[#FFA726]" style={{ background: '#FFF8E1' }}>
            <h3 className="font-semibold text-[15px] mb-3">⚙️ Google API 설정 가이드</h3>
            <div className="space-y-2 text-sm text-[#4B5563]">
              <p>1. <a href="https://console.cloud.google.com" target="_blank" className="text-[#FF6F00] underline">Google Cloud Console</a>에서 Service Account 생성</p>
              <p>2. Admin SDK API 활성화</p>
              <p>3. <a href="https://admin.google.com" target="_blank" className="text-[#FF6F00] underline">Google Admin Console</a>에서 Domain-wide Delegation 설정</p>
              <p className="pl-4 text-xs text-[#999]">스코프: <code className="bg-[#F3F4F6] px-1 rounded">https://www.googleapis.com/auth/admin.directory.device.chromeos.readonly</code></p>
              <p>4. Service Account JSON 키 파일을 <code className="bg-[#F3F4F6] px-1 rounded">backend/.env</code>에 설정</p>
              <p>5. <code className="bg-[#F3F4F6] px-1 rounded">GOOGLE_DELEGATED_ADMIN</code>에 Super Admin 이메일 설정</p>
            </div>
          </div>
        )}

        {/* Sync Logs */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F3E8DE]">
            <h3 className="font-semibold text-[15px]">동기화 이력</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#FFF8F0] border-b border-[#F3E8DE]">
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280]">시간</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280]">타입</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280]">상태</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-[#6B7280]">발견</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-[#6B7280]">생성</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-[#6B7280]">업데이트</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-[#6B7280]">변경없음</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-[#6B7280]">소요시간</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#999]">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#999]">
                    동기화 이력이 없습니다.
                  </td>
                </tr>
              ) : logs.map((log) => {
                const duration = log.completed_at && log.started_at
                  ? Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)
                  : '-';
                return (
                  <tr key={log.id} className="table-row border-b border-[#F9F0E7]">
                    <td className="py-3 px-5 text-sm">{formatRelativeTime(log.started_at)}</td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${log.sync_type === 'full' ? 'bg-[#E3F2FD] text-[#1565C0]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                        {log.sync_type}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`badge ${log.status === 'completed' ? 'badge-active' : 'badge-deprovisioned'}`}>
                        {log.status === 'completed' ? '✅ 완료' : '❌ 실패'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-sm text-right font-medium">{log.devices_found}</td>
                    <td className="py-3 px-5 text-sm text-right text-[#2E7D32]">{log.devices_created > 0 ? `+${log.devices_created}` : '-'}</td>
                    <td className="py-3 px-5 text-sm text-right text-[#FF6F00]">{log.devices_updated > 0 ? log.devices_updated : '-'}</td>
                    <td className="py-3 px-5 text-sm text-right text-[#999]">{log.devices_unchanged}</td>
                    <td className="py-3 px-5 text-sm text-right text-[#6B7280]">{duration}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
