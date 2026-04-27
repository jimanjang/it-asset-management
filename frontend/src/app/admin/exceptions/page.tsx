'use client';

import React, { useEffect, useState } from 'react';
import { 
  getExceptionHistory, 
  approveException, 
  rejectException, 
  ExceptionRequest, 
  ExceptionStatus,
  formatDate,
  formatRelativeTime
} from '@/lib/api';

export default function AdminExceptionsPage() {
  const [requests, setRequests] = useState<ExceptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const data = await getExceptionHistory(100);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('승인하시겠습니까? (기본 60분간 허용됩니다)')) return;
    setProcessingId(id);
    try {
      await approveException(id);
      await loadHistory();
    } catch (error) {
      alert('승인 중 오류 발생');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('반려 사유를 입력하세요:');
    if (reason === null) return;
    setProcessingId(id);
    try {
      await rejectException(id, reason);
      await loadHistory();
    } catch (error) {
      alert('반려 중 오류 발생');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: ExceptionStatus) => {
    switch (status) {
      case ExceptionStatus.PENDING: return 'bg-yellow-500/20 text-yellow-500';
      case ExceptionStatus.APPROVED: return 'bg-green-500/20 text-green-500';
      case ExceptionStatus.REJECTED: return 'bg-red-500/20 text-red-500';
      case ExceptionStatus.EXPIRED: return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">다운로드 예외 승인 관리</h1>
            <p className="text-gray-400 text-sm">업무상 예외 신청 내역을 검토하고 승인 여부를 결정합니다.</p>
          </div>
          <button 
            onClick={loadHistory}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            새로고침
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">요청자 / 사유</th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">파일 / 링크</th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">신청 시각</th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">상태</th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-6 max-w-xs">
                        <div className="text-sm font-semibold mb-1">{req.requesterEmail}</div>
                        <div className="text-xs text-gray-400 line-clamp-2">{req.reason}</div>
                      </td>
                      <td className="p-6 max-w-sm">
                        <div className="text-sm text-blue-400 font-medium mb-1 truncate">
                          {req.filename || '업로드된 파일'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono truncate">{req.url}</div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm text-gray-300">{formatDate(req.createdAt)}</div>
                        <div className="text-xs text-gray-500">{formatRelativeTime(req.createdAt)}</div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-6">
                        {req.status === ExceptionStatus.PENDING ? (
                          <div className="flex gap-2">
                            <button
                              disabled={!!processingId}
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold shadow-lg shadow-green-900/20 transition-all disabled:opacity-50"
                            >
                              승인
                            </button>
                            <button
                              disabled={!!processingId}
                              onClick={() => handleReject(req.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
                            >
                              반려
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {req.adminEmail ? `${req.adminEmail} 처리됨` : '-'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-gray-500">신청 내역이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
