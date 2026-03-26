'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { fetchApi, formatDate } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function GlobalActivitiesPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<any[]>('/devices/activities/all?limit=100')
      .then(setReports)
      .catch(err => console.error('Failed to load global activities:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">📅 활동 이력 (전체)</h1>
          <p className="text-sm text-[#6B7280] mt-1">모든 Chrome OS Flex 디바이스의 실시간 이벤트 로그</p>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F3E8DE] bg-[#FFF8F0] flex justify-between items-center">
            <h3 className="font-semibold text-[15px]">실시간 Chrome 텔레메트리</h3>
            <span className="text-xs text-[#999]">{reports.length}개의 최근 이벤트</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3E8DE] text-left">
                  <th className="py-3 px-6 text-xs font-semibold text-[#6B7280] uppercase">시간</th>
                  <th className="py-3 px-6 text-xs font-semibold text-[#6B7280] uppercase">디바이스</th>
                  <th className="py-3 px-6 text-xs font-semibold text-[#6B7280] uppercase">이벤트</th>
                  <th className="py-3 px-6 text-xs font-semibold text-[#6B7280] uppercase">상세 정보</th>
                  <th className="py-3 px-6 text-xs font-semibold text-[#6B7280] uppercase">사용자</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#999]">데이터를 불러오는 중입니다...</td>
                  </tr>
                ) : reports.length > 0 ? reports.map((report, idx) => {
                  const event = report.events?.[0] || {};
                  const serial = event.parameters?.find((p: any) => p.name === 'DEVICE_NAME')?.value || 'Unknown';
                  return (
                    <tr key={idx} className="border-b border-[#F9F0E7] hover:bg-[#FDFCFB] transition-colors">
                      <td className="py-4 px-6 text-xs text-[#6B7280] whitespace-nowrap">
                        {formatDate(report.id?.time)}
                      </td>
                      <td className="py-4 px-6">
                        <Link href={`/devices?search=${serial}`} className="text-sm font-medium text-[#1A1A1A] hover:text-[#FF6F00] hover:underline">
                          {serial}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold ${
                          event.name?.includes('ADDED') ? 'bg-green-100 text-green-700' : 
                          event.name?.includes('REMOVED') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {event.name?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {event.parameters?.filter((p: any) => !['DEVICE_NAME', 'DIRECTORY_DEVICE_ID', 'CUSTOMER_ID', 'TIMESTAMP'].includes(p.name)).slice(0, 2).map((p: any, i: number) => (
                            <span key={i} className="text-[10px] bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[#6B7280]">
                              {p.name}: {p.value || p.intValue || p.boolValue}
                            </span>
                          ))}
                          {event.parameters?.length > 5 && <span className="text-[10px] text-[#BBB]">...</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#6B7280] truncate max-w-[150px]">
                        {report.actor?.email}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#999]">표시할 활동 이력이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
