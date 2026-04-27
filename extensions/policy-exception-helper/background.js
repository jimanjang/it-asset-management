/**
 * Policy Exception Helper - Background Service Worker
 * Monitors downloads for policy-based blocks and offers exception requests.
 */

const DASHBOARD_URL = 'https://it-asset-managementdaangnservice.vercel.app'; // Production URL

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === 'interrupted') {
    // Check if the reason is policy related (SERVER_FORBIDDEN, FILE_ACCESS_DENIED, etc.)
    chrome.downloads.search({ id: delta.id }, (results) => {
      if (results && results[0]) {
        const item = results[0];
        console.log('Download interrupted:', item);

        // Common errors for policy blocks: 'FILE_ACCESS_DENIED', 'SERVER_BAD_CONTENT', 'NETWORK_FAILED'
        if (item.error === 'FILE_ACCESS_DENIED' || item.error === 'SERVER_FORBIDDEN') {
          showExceptionNotification(item);
        }
      }
    });
  }
});

function showExceptionNotification(item) {
  const notificationId = `exception-req-${item.id}`;
  
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'icon128.png', // Placeholder if not exist
    title: '다운로드가 차단되었습니다',
    message: `${item.filename || '파일'}의 다운로드가 사내 정책에 의해 차단되었습니다. 예외 승인을 요청하시겠습니까?`,
    buttons: [
      { title: '승인 요청 페이지 열기' },
      { title: '닫기' }
    ],
    priority: 2
  });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId.startsWith('exception-req-') && buttonIndex === 0) {
    const downloadId = parseInt(notificationId.replace('exception-req-', ''));
    
    chrome.downloads.search({ id: downloadId }, (results) => {
      if (results && results[0]) {
        const item = results[0];
        const requestUrl = `${DASHBOARD_URL}/requests/download-exception?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(item.filename)}`;
        chrome.tabs.create({ url: requestUrl });
      }
    });
  }
});
