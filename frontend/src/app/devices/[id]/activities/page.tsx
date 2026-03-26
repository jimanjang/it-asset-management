'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { fetchApi, formatDate, formatRelativeTime } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ActivityLog {
  id: string;
  action: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

const actionLabel: Record<string, { label: string; color: string }> = {
  CREATE: { label: '등록', color: '#10B981' },
  UPDATE: { label: '수정', color: '#3B82F6' },
  SYNC: { label: '동기화', color: '#FF6F00' },
  DELETE: { label: '삭제', color: '#EF4444' },
};

export default function DeviceActivitiesPage() {
  const { id } = useParams();
  const [device, setDevice] = useState<any>(null);
  const [chromeReports, setChromeReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetchApi<any>(`/devices/${id}`),
      fetchApi<any[]>(`/devices/${id}/reports`)
    ]).then(([deviceData, reports]) => {
      setDevice(deviceData);
      setChromeReports(reports);
    }).catch(err => {
      console.error('Failed to load activities:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) return <DashboardLayout><div className="p-8 text-center text-[#999]">데이터를 불러오는 중입니다...</div></DashboardLayout>;
  if (!device) return <DashboardLayout><div className="p-8 text-center text-[#999]">디바이스 정보를 찾을 수 없습니다.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-[1000px] mx-auto animate-fade-in-up">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 text-sm text-[#6B7280]">
          <Link href="/devices" className="hover:text-[#FF6F00]">디바이스 관리</Link>
          <span>›</span>
          <Link href={`/devices/${device.id}`} className="hover:text-[#FF6F00]">{device.model}</Link>
          <span>›</span>
          <span className="font-semibold text-[#1A1A1A]">전체 활동 이력</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">📅 전체 활동 이력</h1>
            <p className="text-sm text-[#6B7280] mt-1">{device.model} ({device.serial_number})의 모든 활동 기록</p>
          </div>
          <Link href={`/devices/${device.id}`} className="btn-secondary text-sm">기본 정보로 돌아가기</Link>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Chrome Telemetry Logs */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              🖥️ Chrome 텔레메트리 로그
              <span className="text-xs font-normal text-[#999] bg-[#F3F4F6] px-2 py-0.5 rounded-full">{chromeReports.length}건</span>
            </h3>
            
            <div className="space-y-6">
              {chromeReports.length > 0 ? chromeReports.map((report, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-[#F3F4F6] hover:bg-[#FDFCFB] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#EBF5FF] flex items-center justify-center text-xl shrink-0">
                    {report.events?.[0]?.name?.includes('PERIPHERAL') ? '🔌' : '⚙️'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-[#111827]">
                        {report.events?.[0]?.name?.replace(/_/g, ' ') || 'Status Update'}
                      </h4>
                      <span className="text-xs text-[#A1A1AA]">{formatDate(report.id?.time)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white rounded-lg p-3 border border-[#F3F4F6] mt-2">
                      {report.events?.[0]?.parameters?.filter((p: any) => !['DEVICE_NAME', 'DIRECTORY_DEVICE_ID', 'CUSTOMER_ID'].includes(p.name)).map((p: any, i: number) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] text-[#999] uppercase font-bold tracking-tight">{p.name}</span>
                          <span className="text-sm text-[#4B5563] break-all">{p.value || p.intValue || p.boolValue?.toString() || '-'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-[#999]">
                      <span className="w-4 h-4 rounded-full bg-[#F3F4F6] flex items-center justify-center">👤</span>
                      <span>Actor: {report.actor?.email}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 bg-[#F9FAFB] rounded-2xl border border-dashed border-[#E5E7EB]">
                  <p className="text-sm text-[#999]">구글 관리 콘솔에서 전달된 로그가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* System Audit Logs */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              📋 시스템 설정 변경 이력
              <span className="text-xs font-normal text-[#999] bg-[#F3F4F6] px-2 py-0.5 rounded-full">{device.history?.length || 0}건</span>
            </h3>
            
            <div className="space-y-4">
              {device.history?.length > 0 ? device.history.map((h: any) => {
                const info = actionLabel[h.action] || { label: h.action, color: '#6B7280' };
                return (
                  <div key={h.id} className="flex gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: info.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ background: info.color }}>
                          {info.label}
                        </span>
                        <span className="text-xs text-[#999]">{formatDate(h.created_at)}</span>
                      </div>
                      <p className="text-sm text-[#4B5563] font-medium mt-2">{h.new_value}</p>
                      {h.old_value && (
                        <p className="text-xs text-[#999] mt-1 p-2 bg-white rounded border border-[#EEE] inline-block italic">
                          이전 값: {h.old_value}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-12 bg-[#F9FAFB] rounded-2xl border border-dashed border-[#E5E7EB]">
                  <p className="text-sm text-[#999]">어드민에 의해 발생한 시스템 변경 이력이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
