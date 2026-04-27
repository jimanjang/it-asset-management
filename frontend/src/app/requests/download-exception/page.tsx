'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExceptionRequest } from '@/lib/api';

export default function DownloadExceptionPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createExceptionRequest({ url, reason, filename, requesterEmail });
      setSubmitted(true);
      // Optional: redirect or show success
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0f1115] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">정상적으로 신청되었습니다</h1>
          <p className="text-gray-400 mb-8">
            관리자가 승인하면 슬랙으로 알림이 전송됩니다.<br />
            보통 10분 내에 처리됩니다.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-2xl font-medium"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />

      <div className="max-w-xl w-full relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-4">
            다운로드 예외 승인 신청
          </h1>
          <p className="text-gray-400">
            업무상 필요한 대용량 파일 또는 암호화 압축 파일의 다운로드가 차단된 경우,<br />
            관리자 승인을 통해 한시적으로 허용받을 수 있습니다.
          </p>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-2xl space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">신청자 이메일 (필수)</label>
            <input
              required
              type="email"
              placeholder="user@daangnservice.com"
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-2xl p-4 outline-none placeholder:text-gray-600"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">파일 URL (필수)</label>
            <input
              required
              type="url"
              placeholder="https://example.com/large-file.zip"
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-2xl p-4 outline-none placeholder:text-gray-600"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">파일명 (선택)</label>
            <input
              type="text"
              placeholder="업무_데이터_백업.zip"
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-2xl p-4 outline-none placeholder:text-gray-600"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">신청 사유 (필수)</label>
            <textarea
              required
              rows={4}
              placeholder="해당 파일이 업무에 왜 필요한지 상세히 기재해 주세요."
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-2xl p-4 outline-none placeholder:text-gray-600 resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all transform active:scale-95 ${
              loading 
                ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
              </span>
            ) : '승인 요청하기'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          모든 신청 내역은 보안 감사를 위해 기록되며, 승인 시 한시적으로 다운로드가 허용됩니다.
        </p>
      </div>
    </div>
  );
}
