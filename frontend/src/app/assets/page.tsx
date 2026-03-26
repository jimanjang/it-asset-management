'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { formatDate, fetchApi, AssetSummary } from '@/lib/api';

const statusColors: Record<string, string> = {
  active: 'badge-active',
  in_stock: 'badge bg-blue-50 text-blue-700',
  maintenance: 'badge badge-warning',
  disposed: 'badge badge-deprovisioned',
};

export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ data: AssetSummary[] }>('/assets')
      .then(res => setAssets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = assets.filter(a =>
    !search || a.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.serial_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = assets.reduce((acc, a) => acc + (a.purchase_cost || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">📦 자산 관리</h1>
            <p className="text-sm text-[#6B7280] mt-1">IT 자산 등록 및 디바이스 매핑 관리</p>
          </div>
          <button className="btn-primary text-sm">+ 자산 등록</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <span className="stat-label">전체 자산</span>
            <span className="stat-value">{assets.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">사용 중</span>
            <span className="stat-value text-[#2E7D32]">{assets.filter(a => a.status === 'active').length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">디바이스 연결</span>
            <span className="stat-value text-[#42A5F5]">{assets.filter(a => a.device_linked || a.device).length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">총 구매비용</span>
            <span className="stat-value text-[15px]">₩{totalCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <input
            type="text"
            placeholder="자산번호, 이름, 시리얼번호 검색..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FFF8F0] border-b border-[#F3E8DE]">
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">자산번호</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">이름</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">카테고리</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">시리얼번호</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">상태</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">디바이스</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">위치</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-[#6B7280] uppercase">구매가</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#999]">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#999]">
                    표시할 자산이 없습니다.
                  </td>
                </tr>
              ) : filtered.map((a) => (
                <tr key={a.id} className="table-row border-b border-[#F9F0E7]">
                  <td className="py-3 px-5">
                    <span className="text-sm font-semibold text-[#FF6F00]">{a.asset_tag}</span>
                  </td>
                  <td className="py-3 px-5 text-sm">{a.name}</td>
                  <td className="py-3 px-5">
                    <span className="text-xs px-2 py-1 rounded bg-[#F3F4F6] text-[#6B7280]">{a.category}</span>
                  </td>
                  <td className="py-3 px-5 text-xs text-[#6B7280] font-mono">{a.serial_number}</td>
                  <td className="py-3 px-5">
                    <span className={statusColors[a.status] || 'badge'}>{a.status}</span>
                  </td>
                  <td className="py-3 px-5">
                    {a.device_linked || a.device ? (
                      <span className="text-xs text-[#2E7D32] font-medium">✅ 연결됨</span>
                    ) : (
                      <span className="text-xs text-[#999]">미연결</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-sm text-[#6B7280]">{a.location}</td>
                  <td className="py-3 px-5 text-sm text-right font-medium">
                    {a.purchase_cost ? `₩${a.purchase_cost.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
