'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { fetchApi, DeviceDetail, MetricEntry, formatBytes, formatRelativeTime, formatDate } from '@/lib/api';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const deviceId = unwrappedParams.id;
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [metrics, setMetrics] = useState<{metrics: MetricEntry[]} | null>(null);
  const [metricsRange, setMetricsRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Custom Fields Editing State
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customFields, setCustomFields] = useState({
    annotatedUser: '',
    annotatedAssetId: '',
    annotatedLocation: '',
    notes: '',
  });
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [chromeReports, setChromeReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchDevice = async () => {
    try {
      const deviceResp = await fetchApi<DeviceDetail>(`/devices/${deviceId}`);
      setDevice(deviceResp);
      // Initialize Edit State
      setCustomFields({
        annotatedUser: deviceResp.assigned_user || '',
        annotatedAssetId: deviceResp.asset?.asset_tag || '', // Assuming asset_tag is the annotated_asset_id
        annotatedLocation: deviceResp.annotated_location || '',
        notes: deviceResp.notes || '',
      });
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('디바이스 정보를 불러오지 못했습니다.');
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const reports = await fetchApi<any[]>(`/devices/${deviceId}/reports`);
      setChromeReports(reports);
    } catch (err) {
      console.error('Failed to fetch Chrome reports', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDevice(), // Call the new fetchDevice function
      fetchApi<{metrics: MetricEntry[]}>(`/devices/${deviceId}/metrics?range=${metricsRange}`).catch(() => ({ metrics: [] }))
    ]).then(([, metricsResp]) => { // Only metricsResp is needed here, device is set by fetchDevice
      setMetrics(metricsResp);
    }).catch(err => {
      console.error(err);
      setError('데이터를 불러오는데 실패했습니다.');
    }).finally(() => {
      setLoading(false);
    });
    fetchReports();
  }, [deviceId, metricsRange]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await fetchApi('/sync/devices', { method: 'POST' });
      // Re-fetch after sync
      await fetchDevice();
    } catch (err) {
      console.error(err);
      alert('일시적인 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCustomFields = async () => {
    setIsSavingCustom(true);
    try {
      await fetchApi(`/devices/${deviceId}/custom-fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customFields),
      });
      // Update local state smoothly without full reload
      setDevice(prev => prev ? {
        ...prev,
        assigned_user: customFields.annotatedUser,
        annotated_asset_id: customFields.annotatedAssetId,
        annotated_location: customFields.annotatedLocation,
        notes: customFields.notes,
      } : null);
      setIsEditingCustom(false);
    } catch (err) {
      console.error('Failed to update custom fields', err);
      alert('필드 업데이트 중 오류가 발생했습니다. (Google Admin 권한을 확인하세요)');
    } finally {
      setIsSavingCustom(false);
    }
  };

  if (loading || (!device && !error)) {
    return (
      <DashboardLayout>
        <div className="max-w-[1400px] mx-auto animate-fade-in-up">
          <div className="card text-center py-16">
            <p className="text-lg font-semibold text-[#999]">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !device) {
    return (
      <DashboardLayout>
        <div className="max-w-[1400px] mx-auto animate-fade-in-up">
          <div className="card text-center py-16 text-red-500 font-semibold">
            {error || '디바이스를 찾을 수 없습니다.'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hw = device.hardware_info || {};

  // Display & Peripheral values
  const displayCount = hw.displayInfo ? `${hw.displayInfo.length}대` : null;
  const touchScreen = hw.displayInfo?.find((d: any) => d.isInternal && d.isTouchScreen) ? '지원됨' : '-';
  const audioOutput = hw.audioStatusReport?.[hw.audioStatusReport.length-1]?.outputDeviceInfo?.[0] || {};
  const audioInput = hw.audioStatusReport?.[hw.audioStatusReport.length-1]?.inputDeviceInfo?.[0] || {};
  const peripheralCount = hw.peripheralRequests ? `${hw.peripheralRequests.length}개` : null;

  // RAM
  const ramTotalObj = hw.systemRamTotal ? parseInt(hw.systemRamTotal) : 0;
  const ramFreeObj = hw.systemRamFreeReports?.length > 0 ? parseInt(hw.systemRamFreeReports[hw.systemRamFreeReports.length - 1].systemRamFreeInfo[0]) : 0;
  const ramUsedObj = ramTotalObj > 0 && ramFreeObj > 0 ? ramTotalObj - ramFreeObj : 0;
  const ramPctObj = ramTotalObj > 0 ? Math.round((ramUsedObj / ramTotalObj) * 100) : 0;

  // Disk
  const diskCapObj = hw.diskSpaceUsage?.capacityBytes ? parseInt(hw.diskSpaceUsage.capacityBytes) : 0;
  const diskUsedObj = hw.diskSpaceUsage?.usedBytes ? parseInt(hw.diskSpaceUsage.usedBytes) : 0;
  const diskFreeObj = diskCapObj > 0 ? diskCapObj - diskUsedObj : 0;
  const diskPctObj = diskCapObj > 0 ? Math.round((diskUsedObj / diskCapObj) * 100) : 0;

  // CPU
  const cpuInfo = hw.cpuInfo?.[0] || {};
  
  // Find most recent util and temp instead of just taking the last array item
  let lastUtilReport = null;
  let lastTempReport = null;
  if (hw.cpuStatusReports && Array.isArray(hw.cpuStatusReports)) {
    for (let i = hw.cpuStatusReports.length - 1; i >= 0; i--) {
      const report = hw.cpuStatusReports[i];
      if (!lastUtilReport && report.cpuUtilizationPercentageInfo) lastUtilReport = report;
      if (!lastTempReport && report.cpuTemperatureInfo) lastTempReport = report;
      if (lastUtilReport && lastTempReport) break;
    }
  }

  const cpuTemps = lastTempReport?.cpuTemperatureInfo || [];
  const cpuUtil = lastUtilReport?.cpuUtilizationPercentageInfo?.[0] !== undefined ? lastUtilReport.cpuUtilizationPercentageInfo[0] : '-';
  const cpuAvgTemp = cpuTemps.length > 0 ? Math.round(cpuTemps.reduce((a: number, t: any) => a + t.temperature, 0) / cpuTemps.length) : '-';

  const actionLabel: Record<string, { label: string; color: string }> = {
    synced: { label: '동기화', color: '#42A5F5' },
    status_changed: { label: '상태 변경', color: '#FF6F00' },
    linked: { label: '자산 연결', color: '#2E7D32' },
    assigned: { label: '배정', color: '#7B1FA2' },
    created: { label: '생성', color: '#6B7280' },
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-fade-in-up">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/devices" className="hover:text-[#FF6F00]">디바이스 관리</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-medium">{device.model}</span>
        </div>

        {/* Header Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6F00] to-[#FFB74D] flex items-center justify-center text-3xl text-white shadow-lg">
                💻
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-[#1A1A1A]">{device.model}</h1>
                  <span className={`badge ${device.status === 'ACTIVE' ? 'badge-active' : device.status === 'DISABLED' ? 'badge-disabled' : 'badge-deprovisioned'}`}>
                    {device.status}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] mt-1">
                  SN: {device.serial_number}
                  {device.asset && <> · 자산번호: <span className="text-[#42A5F5] font-medium">{device.asset.asset_tag}</span></>}
                  {device.assigned_user && <> · 사용자: <span className="font-medium">{device.assigned_user}</span></>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column (2 cols) */}
          <div className="col-span-2 space-y-6">
            
            {/* Storage (저장용량) */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">💾 저장용량</h3>
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">저장용량 사용량</p>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-lg font-bold">{diskPctObj}% of {(diskCapObj / 1073741824).toFixed(2)} GB</span>
                  <span className="text-xs text-[#6B7280]">
                    {(diskUsedObj / 1073741824).toFixed(2)} GB in use · {(diskFreeObj / 1073741824).toFixed(2)} GB available
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-bar-fill" style={{ width: `${diskPctObj}%`, background: diskPctObj > 80 ? '#EF5350' : '#42A5F5' }}></div>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-[#6B7280]">디스크 모델:</span> <span className="font-medium">{hw.diskVolumeReports?.[0]?.volumeInfo?.[0]?.volumeId || '알 수 없음'}</span>
              </div>
            </div>

            {/* Memory (메모리) */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">🧠 메모리</h3>
              <div className="mb-2">
                <p className="text-sm font-medium mb-1">메모리 사용량</p>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-lg font-bold">{ramPctObj}% of {(ramTotalObj / 1073741824).toFixed(2)} GB</span>
                  <span className="text-xs text-[#6B7280]">
                    {(ramUsedObj / 1073741824).toFixed(2)} GB in use · {(ramFreeObj / 1073741824).toFixed(2)} GB available
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-bar-fill" style={{ width: `${ramPctObj}%`, background: ramPctObj > 80 ? '#EF5350' : '#66BB6A' }}></div>
                </div>
              </div>
            </div>

            {/* CPU */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">⚙️ CPU</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-[#6B7280] mb-1">CPU 사용률</p>
                  <p className="text-lg font-bold">{cpuUtil}%</p>
                </div>
                <div>
                  <p className="text-[#6B7280] mb-1">평균 온도</p>
                  <p className="text-lg font-bold">{cpuAvgTemp}°C</p>
                </div>
              </div>
              <div className="space-y-2 text-sm bg-[#F9F9F9] p-4 rounded-lg border border-[#EEE]">
                <InfoRow label="CPU 모델" value={cpuInfo.model || device.cpu_model || '-'} />
                <InfoRow label="아키텍처" value={cpuInfo.architecture?.toUpperCase() || '-'} />
                <InfoRow label="최대 클럭 속도" value={cpuInfo.maxClockSpeedKhz ? `${cpuInfo.maxClockSpeedKhz.toLocaleString()} kHz` : '-'} />
                <div className="pt-2 mt-2 border-t border-[#E5E7EB]">
                  <p className="text-xs font-semibold text-[#6B7280] mb-2">세부 온도</p>
                  {cpuTemps.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {cpuTemps.slice(0, 5).map((t: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">{t.label.trim()}</span>
                          <span className="font-medium">{t.temperature}° C</span>
                        </div>
                      ))}
                      {cpuTemps.length > 5 && (
                        <div className="flex justify-between text-xs text-[#999]">
                          <span>+ {cpuTemps.length - 5} more</span>
                        </div>
                      )}
                    </div>
                  ) : <p className="text-xs text-[#999]">센서 데이터 없음</p>}
                </div>
              </div>
            </div>

            {/* Display, Audio, Peripherals */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">🖥️ 기기 제원 (관리콘솔 확장)</h3>
              <div className="grid grid-cols-3 gap-6">
                {displayCount && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#FF6F00] uppercase tracking-wide mb-3">디스플레이</h4>
                    <div className="space-y-2 text-sm">
                      <InfoRow label="연결 수" value={displayCount} />
                      <InfoRow label="터치 스크린" value={touchScreen} />
                    </div>
                  </div>
                )}
                {(Object.keys(audioOutput).length > 0 || Object.keys(audioInput).length > 0) && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#FF6F00] uppercase tracking-wide mb-3">오디오</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#6B7280]">출력</span>
                        <span className="font-medium">{audioOutput?.deviceName || 'Speaker'} ({audioOutput?.volume || 75}%)</span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="text-xs text-[#6B7280]">입력</span>
                        <span className="font-medium">{audioInput?.deviceName || 'Internal Mic'} ({audioInput?.gain || 50}%)</span>
                      </div>
                    </div>
                  </div>
                )}
                {peripheralCount && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#FF6F00] uppercase tracking-wide mb-3">주변기기</h4>
                    <div className="space-y-2 text-sm">
                      <InfoRow label="연결 수" value={peripheralCount} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline (System) */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">📋 시스템 설정 변경 이력</h3>
              <div className="space-y-0">
                {device.history?.length > 0 ? device.history.map((h) => {
                  const info = actionLabel[h.action] || { label: h.action, color: '#6B7280' };
                  return (
                    <div key={h.id} className="timeline-item">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: info.color }}>
                              {info.label}
                            </span>
                            <span className="text-xs text-[#999]">{formatDate(h.created_at)}</span>
                          </div>
                          <p className="text-sm text-[#4B5563] mt-1">{h.new_value}</p>
                          {h.old_value && <p className="text-xs text-[#999] mt-0.5">이전: {h.old_value}</p>}
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-[#999]">활동 이력이 없습니다.</p>}
              </div>
            </div>
          </div>

          {/* Right Column (1 col) */}
          <div className="space-y-6">
            {/* Custom Info */}
            <div className="card border-[#FFA726] transition-all" style={{ borderWidth: '1px' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[15px] text-[#FF6F00]">📝 맞춤 입력란</h3>
                {!isEditingCustom ? (
                  <button onClick={() => setIsEditingCustom(true)} className="text-xs text-[#FF6F00] hover:bg-[#FFF3E0] px-2 py-1 rounded transition-colors">
                    수정
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button onClick={() => setIsEditingCustom(false)} className="text-xs text-[#6B7280] hover:bg-[#F3F4F6] px-2 py-1 rounded transition-colors" disabled={isSavingCustom}>
                      취소
                    </button>
                    <button onClick={handleSaveCustomFields} className="text-xs bg-[#FF6F00] text-white hover:bg-[#E65100] px-2 py-1 rounded transition-colors" disabled={isSavingCustom}>
                      {isSavingCustom ? '저장 중...' : '저장'}
                    </button>
                  </div>
                )}
              </div>
              
              {!isEditingCustom ? (
                <div className="space-y-3 text-sm">
                  <InfoRow label="사용자" value={device.assigned_user || '-'} />
                  <InfoRow label="자산번호" value={device.annotated_asset_id || '-'} />
                  <InfoRow label="위치" value={device.annotated_location || '-'} />
                  <InfoRow label="메모" value={device.notes || '-'} />
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col">
                    <label className="text-xs text-[#6B7280] mb-1">사용자</label>
                    <input type="text" value={customFields.annotatedUser} onChange={e => setCustomFields(p => ({...p, annotatedUser: e.target.value}))} className="border border-[#D1D5DB] rounded px-2 py-1 focus:outline-none focus:border-[#FF6F00] focus:ring-1 focus:ring-[#FF6F00] text-sm" placeholder="이메일 입력" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-[#6B7280] mb-1">자산번호</label>
                    <input type="text" value={customFields.annotatedAssetId} onChange={e => setCustomFields(p => ({...p, annotatedAssetId: e.target.value}))} className="border border-[#D1D5DB] rounded px-2 py-1 focus:outline-none focus:border-[#FF6F00] focus:ring-1 focus:ring-[#FF6F00] text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-[#6B7280] mb-1">위치</label>
                    <input type="text" value={customFields.annotatedLocation} onChange={e => setCustomFields(p => ({...p, annotatedLocation: e.target.value}))} className="border border-[#D1D5DB] rounded px-2 py-1 focus:outline-none focus:border-[#FF6F00] focus:ring-1 focus:ring-[#FF6F00] text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-[#6B7280] mb-1">메모</label>
                    <textarea value={customFields.notes} onChange={e => setCustomFields(p => ({...p, notes: e.target.value}))} className="border border-[#D1D5DB] rounded px-2 py-1 h-16 resize-none focus:outline-none focus:border-[#FF6F00] focus:ring-1 focus:ring-[#FF6F00] text-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Device Info */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">📋 기본 정보</h3>
              <div className="space-y-3 text-sm">
                <InfoRow label="모델" value={device.model} />
                <InfoRow label="시리얼번호" value={device.serial_number} />
                <InfoRow label="최초 등록일" value={formatDate(device.enrollment_time)} />
                <InfoRow label="마지막 동기화" value={formatRelativeTime(device.last_google_sync)} />
                <InfoRow label="마지막 활동" value={formatRelativeTime(device.last_activity_time)} />
              </div>
            </div>

            {/* OS Info */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">🖥️ OS & 하드웨어</h3>
              <div className="space-y-3 text-sm">
                <InfoRow label="Chrome OS" value={`v${device.os_version}`} />
                <InfoRow label="Platform" value={device.platform_version} />
                <InfoRow label="Firmware" value={device.firmware_version?.split('.').slice(0, 2).join('.')} />
                <InfoRow label="Boot Mode" value={device.boot_mode} />
              </div>
            </div>

            {/* Network */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">🌐 네트워크 상태</h3>
              <div className="space-y-3 text-sm">
                <InfoRow label="연결 상태" value="알 수 없음" />
                <InfoRow label="네트워크 연결 유형" value={device.network?.network_type === 'ethernet' ? '이더넷' : 'Wi-Fi'} />
                <InfoRow label="LAN IP 주소" value={hw.lastKnownNetwork?.[0]?.ipAddress || device.network?.lan_ip || '-'} />
                <InfoRow label="WAN IP 주소" value={hw.lastKnownNetwork?.[0]?.wanIpAddress || device.network?.wan_ip || '-'} />
              </div>
              
              <h3 className="font-semibold text-[15px] mt-6 mb-4">🌐 네트워크 정보</h3>
              <div className="space-y-3 text-sm">
                <InfoRow label="네트워크 기기 유형" value={hw.ethernetMacAddress ? '이더넷 기기' : '무선 기기'} />
                <hr className="border-[#E5E7EB] my-2" />
                <div className="flex justify-between items-start text-xs rounded-lg p-3 bg-[#F9F9F9] border border-[#EEE]">
                  <span className="text-[#6B7280] w-[140px] shrink-0 font-medium pt-1">MAC 주소</span>
                  <div className="flex-1 text-right font-medium space-y-1">
                    {hw.ethernetMacAddress && <p>{hw.ethernetMacAddress} (Ethernet)</p>}
                    {hw.macAddress && <p>{hw.macAddress} (WiFi)</p>}
                    {!hw.ethernetMacAddress && !hw.macAddress && device.network?.mac_address && (
                       <p>{device.network.mac_address} ({device.network.network_type})</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* History (Chrome) */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[15px]">📅 활동 이력 (Chrome 텔레메트리)</h3>
                {chromeReports.length > 5 && (
                  <Link href={`/devices/${device.id}/activities`} className="text-xs text-[#FF6F00] hover:underline font-medium">
                    전체 보기 →
                  </Link>
                )}
              </div>
              {loadingReports ? (
                <p className="text-sm text-[#999] text-center py-4">이력을 불러오는 중...</p>
              ) : chromeReports.length > 0 ? (
                <div className="space-y-3">
                  {chromeReports.slice(0, 5).map((report, idx) => (
                    <div key={idx} className="flex gap-3 text-sm border-b border-[#F3F4F6] pb-3 last:border-0 last:pb-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-[#111827]">
                          {report.events?.[0]?.name?.replace(/_/g, ' ') || 'Status Update'}
                        </p>
                        <ul className="text-[#6B7280] text-xs mt-1 space-y-0.5">
                          {report.events?.[0]?.parameters?.filter((p: any) => !['DEVICE_NAME', 'DIRECTORY_DEVICE_ID', 'CUSTOMER_ID'].includes(p.name)).slice(0, 3).map((p: any, i: number) => (
                            <li key={i}><span className="font-medium">{p.name}:</span> {p.value || p.intValue || p.boolValue}</li>
                          ))}
                          {report.events?.[0]?.parameters?.length > 3 && <li className="text-[10px] text-[#999]">+ {report.events[0].parameters.length - 3} more details</li>}
                        </ul>
                        <p className="text-[#A1A1AA] text-[11px] mt-1.5">{formatDate(report.id?.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#999] text-center py-4">검색된 활동 이력이 없습니다.</p>
              )}
            </div>
            
            {/* Users */}
            <div className="card">
              <h3 className="font-semibold text-[15px] mb-4">👤 최근 사용자</h3>
              {device.device_users?.length > 0 ? (
                <div className="space-y-2">
                  {device.device_users.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[#FFF8F0]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6F00] to-[#FFB74D] flex items-center justify-center text-white text-xs font-bold">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.email}</p>
                        <p className="text-xs text-[#999]">{u.type} · {formatRelativeTime(u.last_seen)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#999]">사용자 정보 없음</p>
              )}
            </div>

            {/* Asset Info */}
            {device.asset && (
              <div className="card" style={{ borderColor: '#42A5F5', borderWidth: '1.5px' }}>
                <h3 className="font-semibold text-[15px] mb-4">📦 연결된 자산</h3>
                <div className="space-y-3 text-sm">
                  <InfoRow label="자산번호" value={device.asset.asset_tag} highlight />
                  <InfoRow label="이름" value={device.asset.name} />
                  <InfoRow label="구매일" value={formatDate(device.asset.purchase_date)} />
                  <InfoRow label="구매가" value={device.asset.purchase_cost ? `₩${device.asset.purchase_cost.toLocaleString()}` : '-'} />
                  <InfoRow label="보증만료" value={formatDate(device.asset.warranty_expiry)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string | number | null; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-[#6B7280] text-[13px]">{label}</span>
      <span className={`text-right font-medium text-[13px] max-w-[60%] break-all ${highlight ? 'text-[#42A5F5] font-semibold' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}
