'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { fetchApi, DashboardSummary, SyncStatus, DeviceSummary, formatRelativeTime, formatBytes } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#FF6F00', '#FFB74D', '#2E7D32', '#66BB6A', '#42A5F5'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [recentDevices, setRecentDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi<DashboardSummary>('/dashboard/summary').catch(() => null),
      fetchApi<SyncStatus>('/sync/status').catch(() => null),
      fetchApi<{data: DeviceSummary[]}>('/devices?limit=5').catch(() => ({ data: [] }))
    ]).then(([dashboardResp, syncResp, devicesResp]) => {
      if (dashboardResp) setData(dashboardResp);
      if (syncResp) setSync(syncResp);
      if (devicesResp?.data) setRecentDevices(devicesResp.data);
      setLoading(false);
    });
  }, []);

  if (loading || !data || !sync) return <DashboardLayout><div className="p-8">데이터를 불러오는 중입니다...</div></DashboardLayout>;

  const pieData = data.osVersions.map((v) => ({
    name: v.version.split('.').slice(0, 2).join('.'),
    value: parseInt(v.count),
  }));

  const modelData = data.models.map((m) => ({
    name: m.model.replace('Chromebook ', 'CB '),
    count: parseInt(m.count),
  }));

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Chrome OS Flex 디바이스 현황 및 자산 관리 요약</p>
        </div>

        {/* Sync Status Banner */}
        <div className="card mb-6 flex items-center justify-between" style={{ background: sync.googleApiConfigured ? '#E8F5E9' : '#FFF3E0', borderColor: sync.googleApiConfigured ? '#C8E6C9' : '#FFE0B2' }}>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${sync.isSyncing ? 'bg-[#FF6F00] animate-pulse-dot' : sync.googleApiConfigured ? 'bg-[#2E7D32]' : 'bg-[#FFA726]'}`}></span>
            <div>
              <p className="text-sm font-semibold">
                {sync.isSyncing ? '동기화 진행 중...' : sync.googleApiConfigured ? '✅ Google API 연동 완료' : '⚠️ Google API 미연동 (Mock 데이터 사용 중)'}
              </p>
              {sync.lastSync && (
                <p className="text-xs text-[#6B7280] mt-0.5">
                  마지막 동기화: {formatRelativeTime(sync.lastSync.completed_at)} · 업데이트: {sync.lastSync.devices_updated}대
                </p>
              )}
            </div>
          </div>
          <Link href="/sync" className="btn-secondary text-xs py-2 px-4">동기화 관리</Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💻</span>
              <span className="stat-label">전체 디바이스</span>
            </div>
            <span className="stat-value">{data.devices.total}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✅</span>
              <span className="stat-label">활성 디바이스</span>
            </div>
            <span className="stat-value text-[#2E7D32]">{data.devices.active}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔗</span>
              <span className="stat-label">자산 연결됨</span>
            </div>
            <span className="stat-value text-[#42A5F5]">{data.assets.linked}</span>
          </div>
          <div className="stat-card" style={data.problems.inactive + data.problems.disabled > 0 ? { borderColor: '#EF5350', background: '#FFF5F5' } : {}}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <span className="stat-label">주의 필요</span>
            </div>
            <span className="stat-value text-[#EF5350]">{data.problems.inactive + data.problems.disabled}</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* OS Version Distribution */}
          <div className="card">
            <h3 className="font-semibold text-[15px] mb-4">OS 버전 분포</h3>
            <div className="flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {data.osVersions.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                    <span className="text-[#6B7280] flex-1 truncate">v{v.version.split('.').slice(0, 2).join('.')}</span>
                    <span className="font-semibold">{v.count}대</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model Distribution */}
          <div className="card">
            <h3 className="font-semibold text-[15px] mb-4">모델 분포</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={modelData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF6F00" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Problem Devices Section */}
        <div className="card mb-6">
          <h3 className="font-semibold text-[15px] mb-4">⚠️ 주의 필요 디바이스</h3>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/devices?inactiveDays=30" className="p-4 rounded-xl bg-[#FFF3E0] hover:bg-[#FFE0B2] transition-colors group">
              <p className="text-2xl font-bold text-[#E65100]">{data.problems.inactive}</p>
              <p className="text-xs text-[#6B7280] mt-1 group-hover:text-[#E65100]">30일+ 미사용 디바이스</p>
            </Link>
            <Link href="/devices?status=DISABLED" className="p-4 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] transition-colors group">
              <p className="text-2xl font-bold text-[#C62828]">{data.problems.disabled}</p>
              <p className="text-xs text-[#6B7280] mt-1 group-hover:text-[#C62828]">비활성 디바이스</p>
            </Link>
            <Link href="/devices?hasAsset=false" className="p-4 rounded-xl bg-[#E3F2FD] hover:bg-[#BBDEFB] transition-colors group">
              <p className="text-2xl font-bold text-[#1565C0]">{data.problems.unlinked}</p>
              <p className="text-xs text-[#6B7280] mt-1 group-hover:text-[#1565C0]">자산 미연결 디바이스</p>
            </Link>
          </div>
        </div>

        {/* Recent Devices Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[15px]">최근 동기화 디바이스</h3>
            <Link href="/devices" className="text-sm text-[#FF6F00] font-medium hover:underline">전체 보기 →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3E8DE]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">디바이스</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">사용자</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">상태</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">자산</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">마지막 동기화</th>
                </tr>
              </thead>
              <tbody>
                {recentDevices.map((d) => (
                  <tr key={d.id} className="table-row border-b border-[#F9F0E7]">
                    <td className="py-3 px-4">
                      <Link href={`/devices/${d.id}`} className="hover:text-[#FF6F00]">
                        <p className="text-sm font-medium">{d.model}</p>
                        <p className="text-xs text-[#999]">{d.serial_number}</p>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#6B7280]">{d.assigned_user || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${d.status === 'ACTIVE' ? 'badge-active' : d.status === 'DISABLED' ? 'badge-disabled' : 'badge-deprovisioned'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {d.asset ? (
                        <span className="text-[#42A5F5] font-medium">{d.asset.asset_tag}</span>
                      ) : (
                        <span className="text-[#999]">미연결</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#6B7280]">{formatRelativeTime(d.last_google_sync)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
