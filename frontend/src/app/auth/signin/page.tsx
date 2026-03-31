'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F3]">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-[#F3E8DE]">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-[#FFF3E0] rounded-2xl mb-4">
            <span className="text-4xl text-[#FF6F00]">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">IT Asset Management</h1>
          <p className="text-[#6B7280] mt-2 text-sm">
            당근서비스 워크 자산 및 디바이스 관리 시스템
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#FFF9F5] rounded-xl border border-[#FFE0B2] text-xs text-[#E65100]">
            <p className="font-semibold mb-1">접근 권한 안내</p>
            <p>이 시스템은 Google Workspace 슈퍼 관리자 계정으로만 접근 가능합니다.</p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-[#D1D5DB] rounded-xl text-[#374151] font-medium hover:bg-[#F9FAFB] transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#6B7280] rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                Google 계정으로 로그인
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#F3E8DE] text-center">
          <p className="text-[11px] text-[#9CA3AF]">
            &copy; 2026 당근서비스 IT Operations. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
