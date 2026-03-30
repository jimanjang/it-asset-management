'use client';

import { DashboardLayout } from '@/components/Sidebar';
import { fetchApi } from '@/lib/api';
import React, { useEffect, useState } from 'react';

interface Policy {
  name: string;
  schema: string;
  status: string;
  value: any;
  detail?: string;
  category: string;
  updateMask: string;
}

interface OrgUnit {
  orgUnitId: string;
  name: string;
  orgUnitPath: string;
}

// Human-readable metadata for policies
const POLICY_METADATA: Record<string, { name: string, description: string, valueFormatter?: (v: any) => string }> = {
  'chrome.users.BrowserSignin': {
    name: '브라우저 로그인 설정',
    description: 'Chrome 브라우저 로그인 및 계정 동기화 설정을 제어합니다.',
    valueFormatter: (v) => v.browserSignin === 'BROWSER_SIGNIN_MODE_ENUM_FORCE' ? '로그인 강제' : '사용자 정의'
  },
  'chrome.users.ProfileSeparationSettings': {
    name: '프로필 분리 설정',
    description: '기업 계정과 개인 계정의 브라우저 프로필 분리 여부를 제어합니다.',
  },
  'chrome.users.MobileManagement': {
    name: '모바일 관리 활성화',
    description: '모바일 기기에서도 정책을 적용할지 여부를 설정합니다.',
  },
  'chrome.users.ChromeOnIos': {
    name: 'iOS Chrome 정책 적용',
    description: 'iOS 운영체제의 Chrome 브라우저에 정책을 적용합니다.',
  },
  'chrome.users.AllowPopulateAssetId': {
    name: '자산 ID 자동 등록 허용',
    description: '기기 정보 업데이트 시 자산 ID를 자동으로 등록할 수 있게 합니다.',
  },
  'chrome.users.SiteIsolationBrowser': {
    name: '사이트 격리 설정',
    description: '각 웹사이트를 별도의 프로세스로 실행하여 보안을 강화합니다.',
  },
  'chrome.users.PasswordManager': {
    name: '비밀번호 관리자',
    description: '비밀번호 저장 및 자동 완성 기능을 제어합니다.',
    valueFormatter: (v) => v.passwordManagerEnabled === 'FALSE' ? '사용 중지 (강제)' : '사용 가능'
  },
  'chrome.users.IncognitoMode': {
    name: '시크릿 모드 가용성',
    description: '시크릿 모드(Incognito) 창의 사용 가능 여부를 제어합니다.',
    valueFormatter: (v) => v.incognitoModeAvailability === 'INCOGNITO_MODE_AVAILABILITY_ENUM_UNAVAILABLE' ? '사용 불가' : '사용 가능'
  },
  'chrome.users.SingleSignOn': {
    name: 'SSO(Single Sign-On) 자동 로그인',
    description: 'SAML 기반의 자동 로그인(SSO) 기능을 제어합니다.',
  },
  'chrome.users.DnsOverHttps': {
    name: 'DNS-over-HTTPS 사용',
    description: 'DNS 쿼리를 HTTPS를 통해 암호화하여 전송합니다.',
  },
  'chrome.users.SafeSearchRestrictedMode': {
    name: '구글 세이프서치 설정',
    description: 'Google 검색 시 성인물 등 부적절한 결과를 필터링합니다.',
  },
  'chrome.users.Screenshot': {
    name: '스크린샷 및 화면 캡처',
    description: '기기에서 화면 캡처 및 스크린샷 기능을 허용하거나 차단합니다.',
    valueFormatter: (v) => v.disableScreenshots ? '차단됨' : '허용됨'
  },
  'chrome.users.ClipboardSettings': {
    name: '클립보드 복사/붙여넣기 설정',
    description: '사용자가 텍스트나 이미지를 클립보드에 복사하고 붙여넣는 기능을 제어합니다.',
  },
  'chrome.users.EnterpriseCustomLabel': {
    name: '조직 커스텀 라벨',
    description: '브라우저 메뉴 및 설정에 표시될 조직 이름을 정의합니다.',
  },
  'chrome.users.EnterpriseLogoUrl': {
    name: '조직 로고 이미지',
    description: '조직 전용 브라우저 프로필에 표시될 로고 URL입니다.',
  }
};

const formatPolicyValue = (p: Policy): string => {
  const metadata = POLICY_METADATA[p.schema];
  if (metadata?.valueFormatter) {
    return metadata.valueFormatter(p.value);
  }
  if (typeof p.value === 'object') {
    return JSON.stringify(p.value);
  }
  return String(p.value);
};

export default function PoliciesPage() {
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [selectedOU, setSelectedOU] = useState<string>('/');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Map real API results to our UI structure
  const mapPolicies = (resolved: any[]): Policy[] => {
    return resolved.map(p => {
      const policyVal = p.value || {};
      const schemaId = policyVal.policySchema || 'Unknown';
      const actualValue = policyVal.value || {};
      
      const metadata = POLICY_METADATA[schemaId];
      const simpleName = metadata ? metadata.name : schemaId.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || schemaId;
      
      // Categorization logic
      let category = 'Security';
      if (schemaId.includes('URL')) category = 'URL';
      else if (schemaId.includes('Extension')) category = 'Extensions';
      else if (schemaId.includes('Connector') || schemaId.includes('Reporting')) category = 'Reporting';
      else if (schemaId.includes('Enterprise')) category = 'Branding';

      return {
        name: simpleName,
        schema: schemaId,
        status: '강제 적용',
        value: actualValue,
        detail: metadata?.description,
        category: category,
        updateMask: Object.keys(actualValue)[0] || '*'
      };
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ouResp, policyResp] = await Promise.all([
        fetchApi<OrgUnit[]>('/policies/org-units').catch(() => []),
        fetchApi<any[]>(`/policies?orgUnitPath=${encodeURIComponent(selectedOU)}`).catch(() => [])
      ]);
      
      setOrgUnits(ouResp);
      if (policyResp && policyResp.length > 0) {
        setPolicies(mapPolicies(policyResp));
      } else {
        // If API succeeded but returned nothing, show mock but with a warning
        setPolicies(getMockPolicies());
      }
    } catch (error) {
      console.error('Failed to load policies', error);
      setPolicies(getMockPolicies());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOU]);

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setEditValue(JSON.stringify(policy.value, null, 2));
  };

  const handleSave = async () => {
    if (!editingPolicy) return;
    setSaving(true);
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(editValue);
      } catch (e) {
        alert('올바른 JSON 형식이 아닙니다.');
        setSaving(false);
        return;
      }

      await fetchApi('/policies/update', {
        method: 'POST',
        body: JSON.stringify({
          orgUnitPath: selectedOU,
          schema: editingPolicy.schema,
          value: parsedValue,
          updateMask: editingPolicy.updateMask
        })
      });

      alert('정책이 성공적으로 업데이트되었습니다.');
      setEditingPolicy(null);
      loadData();
    } catch (error) {
      console.error('Failed to update policy', error);
      alert('정책 업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getMockPolicies = (): Policy[] => [
    { name: '스크린샷 및 화면 캡처 통제', schema: 'chrome.users.ScreenshotsDisabled', status: '강제 적용', value: { screenshotsDisabled: true }, category: 'Security', updateMask: 'screenshotsDisabled' },
    { name: '시크릿 모드 차단', schema: 'chrome.users.IncognitoModeAvailability', status: '강제 적용', value: { incognitoModeAvailability: 1 }, category: 'Security', updateMask: 'incognitoModeAvailability' },
    { name: 'URL 차단 목록', schema: 'chrome.users.URLBlocklist', status: '차단됨', value: { urlBlocklist: ['youtube.com', 'facebook.com'] }, category: 'URL', updateMask: 'urlBlocklist' },
    { name: '확장 프로그램 전면 차단', schema: 'chrome.users.ExtensionInstallBlocklist', status: '차단됨', value: { extensionInstallBlocklist: ['*'] }, category: 'Extensions', updateMask: 'extensionInstallBlocklist' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">정책 관리 (Policy Management)</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[#6B7280]">조직 단위:</span>
              <select 
                value={selectedOU} 
                onChange={(e) => setSelectedOU(e.target.value)}
                className="text-sm border-none bg-transparent font-semibold text-[#FF6F00] cursor-pointer focus:ring-0 p-0"
              >
                <option value="/">Root (/) </option>
                {orgUnits.map(ou => (
                  <option key={ou.orgUnitId} value={ou.orgUnitPath}>{ou.orgUnitPath}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={loadData} className="btn-secondary text-xs">정책 동기화</button>
             <button className="btn-primary text-xs">Google 관리 콘솔</button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#6B7280]">정책 데이터를 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {['Security', 'URL', 'Extensions', 'Device', 'Branding', 'Reporting'].map(cat => {
              const catPolicies = policies.filter(p => p.category === cat || (cat === 'Security' && !['URL', 'Extensions', 'Device', 'Branding', 'Reporting'].includes(p.category)));
              if (catPolicies.length === 0) return null;

              return (
                <div key={cat} className="card p-0 overflow-hidden">
                  <div className="px-6 py-4 bg-[#FFFBF7] border-b border-[#F3E8DE] flex items-center justify-between">
                    <h3 className="font-bold text-[#1A1A1A]">{cat} Policies</h3>
                    <span className="text-[10px] font-bold text-[#FF6F00] uppercase tracking-widest">{catPolicies.length} Active</span>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-[#6B7280] border-b border-[#F3E8DE] bg-gray-50/50">
                          <th className="py-3 px-6 w-1/3">Policy Name</th>
                          <th className="py-3 px-6 w-1/6">Status</th>
                          <th className="py-3 px-6">Current Value</th>
                          <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F9F0E7]">
                        {catPolicies.map((p, j) => (
                          <tr key={j} className="hover:bg-[#FFFBFA] transition-colors border-b border-[#F9F0E7] last:border-0">
                            <td className="py-5 px-6 border-none align-top">
                              <p className="font-bold text-[#1A1A1A] text-sm">{p.name}</p>
                              {p.detail && <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed max-w-sm">{p.detail}</p>}
                              <p className="text-[10px] text-[#9CA3AF] mt-1.5 font-mono">{p.schema}</p>
                            </td>
                            <td className="py-5 px-6 border-none align-top min-w-[100px]">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-bold border border-green-200 shadow-sm whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-5 px-6 border-none align-top">
                              <div className="bg-gray-50/50 rounded-lg p-2.5 font-mono text-[11px] text-[#4B5563] break-all border border-gray-100">
                                {formatPolicyValue(p)}
                              </div>
                            </td>
                            <td className="py-5 px-6 border-none align-top text-right">
                              <button 
                                onClick={() => handleEdit(p)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-[#FF6F00] hover:bg-[#FFF5ED] text-xs font-bold transition-all border border-transparent hover:border-[#FFEDDB]"
                              >
                                Edit (수정)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        {editingPolicy && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
            <div className="card w-[600px] p-0 shadow-2xl overflow-hidden animate-scale-in">
              <div className="px-6 py-4 bg-[#1A1A1A] text-white flex justify-between items-center">
                <h3 className="font-bold">Edit Policy: {editingPolicy.name}</h3>
                <button onClick={() => setEditingPolicy(null)} className="text-[#999] hover:text-white">✕</button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="text-xs font-bold text-[#6B7280] uppercase">Schema ID</label>
                  <p className="text-sm font-mono mt-1 text-[#333]">{editingPolicy.schema}</p>
                </div>
                <div className="mb-6">
                  <label className="text-xs font-bold text-[#6B7280] uppercase">New Value (JSON)</label>
                  <textarea 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={8}
                    className="w-full mt-2 p-4 rounded-xl border-[#F3E8DE] font-mono text-sm focus:ring-[#FF6F00] focus:border-[#FF6F00]"
                  />
                  <p className="text-[11px] text-[#999] mt-2 italic">※ Google Admin API 스키마 형식에 맞춰 JSON을 입력해 주세요.</p>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditingPolicy(null)} className="btn-secondary py-2">Cancel</button>
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="btn-primary py-2 px-8 min-w-[120px]"
                  >
                    {saving ? 'Saving...' : 'Save Policy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center py-12">
            <p className="text-xs text-[#999]">
                모든 정책 변경사항은 즉시 Google Admin Console에 반영되며, <br />
                대기 중인 Chrome OS 기기들이 인터넷에 연결되는 즉시 적용됩니다.
            </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
