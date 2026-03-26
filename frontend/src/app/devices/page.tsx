'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { fetchApi, DeviceSummary } from '@/lib/api';
import { formatRelativeTime, formatBytes } from '@/lib/api';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';

export default function DevicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState('');
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ data: DeviceSummary[] }>('/devices')
      .then((res) => setDevices(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = devices;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.serial_number.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.assigned_user?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter(d => d.status === statusFilter);
    if (assetFilter === 'linked') result = result.filter(d => d.asset_id);
    if (assetFilter === 'unlinked') result = result.filter(d => !d.asset_id);
    return result;
  }, [search, statusFilter, assetFilter, devices]);

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">💻 디바이스 관리</h1>
            <p className="text-sm text-[#6B7280] mt-1">Chrome OS Flex 디바이스 목록 및 상태 관리</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => {}}>📥 내보내기</button>
            <Link href="/sync" className="btn-primary text-sm">🔄 동기화</Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="시리얼번호, 모델, 사용자 검색..."
                className="input-field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">전체 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="DISABLED">비활성</option>
              <option value="DEPROVISIONED">해제됨</option>
            </select>
            <select
              className="input-field w-[160px]"
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
            >
              <option value="">자산 연결 전체</option>
              <option value="linked">연결됨</option>
              <option value="unlinked">미연결</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-[#999] mb-3 px-1">{filtered.length}개 디바이스</p>

        {/* Device Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((d) => {
            const isInactive = d.last_activity_time && (Date.now() - new Date(d.last_activity_time).getTime() > 30 * 86400000);
            return (
              <Link
                key={d.id}
                href={`/devices/${d.id}`}
                className="card flex items-center gap-6 group cursor-pointer"
                style={isInactive ? { borderLeft: '4px solid #FFA726' } : d.status === 'DISABLED' ? { borderLeft: '4px solid #EF5350' } : {}}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center text-2xl flex-shrink-0">
                  💻
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-[15px] text-[#1A1A1A] group-hover:text-[#FF6F00] transition-colors">{d.model}</h3>
                    <span className={`badge ${d.status === 'ACTIVE' ? 'badge-active' : d.status === 'DISABLED' ? 'badge-disabled' : 'badge-deprovisioned'}`}>
                      {d.status}
                    </span>
                    {isInactive && <span className="badge badge-warning">30일+ 미사용</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span>SN: {d.serial_number}</span>
                    <span>·</span>
                    <span>{d.assigned_user || '미배정'}</span>
                    <span>·</span>
                    <span>{d.location || '-'}</span>
                    <span>·</span>
                    <span>OS {d.os_version}</span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <p className="text-xs text-[#999] mb-0.5">자산</p>
                    {d.asset ? (
                      <p className="text-sm font-semibold text-[#42A5F5]">{d.asset.asset_tag}</p>
                    ) : (
                      <p className="text-sm text-[#CCC]">미연결</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#999] mb-0.5">CPU</p>
                    <p className="text-sm font-medium">{d.cpu_model?.split(' ').slice(-1)[0] || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#999] mb-0.5">RAM</p>
                    <p className="text-sm font-medium">{formatBytes(d.ram_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#999] mb-0.5">마지막 동기화</p>
                    <p className="text-sm font-medium">{formatRelativeTime(d.last_google_sync)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {loading && (
          <div className="card text-center py-16">
            <p className="text-lg font-semibold text-[#999]">데이터를 불러오는 중입니다...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-[#999]">검색 결과가 없습니다</p>
            <p className="text-sm text-[#CCC] mt-1">다른 검색어나 필터를 시도해보세요</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
