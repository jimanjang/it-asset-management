/**
 * Quick test script to verify Google Admin SDK Service Account + DWD
 * Run: node test-google-api.js
 */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testConnection() {
  console.log('🔍 Testing Google Admin SDK connection...\n');

  // 1. Load service account
  const keyFilePath = path.resolve(__dirname, 'service-account.json');
  if (!fs.existsSync(keyFilePath)) {
    console.error('❌ service-account.json not found');
    return;
  }
  const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
  console.log('✅ Service Account loaded:', keyFile.client_email);
  console.log('   Project ID:', keyFile.project_id);

  // 2. Create JWT auth with delegation
  const delegatedAdmin = 'laika@daangnservice.com';
  const auth = new google.auth.JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.device.chromeos.readonly',
      'https://www.googleapis.com/auth/admin.directory.device.chromeos',
    ],
    subject: delegatedAdmin,
  });

  console.log('   Delegated Admin:', delegatedAdmin);
  console.log('');

  // 3. Test API call
  const directoryService = google.admin({ version: 'directory_v1', auth });
  const customerId = 'C00ip82ka';

  try {
    console.log('📡 Calling chromeosdevices.list...');
    console.log('   Customer ID:', customerId);
    console.log('');

    const response = await directoryService.chromeosdevices.list({
      customerId,
      maxResults: 5,
      projection: 'FULL',
      orderBy: 'lastSync',
    });

    const devices = response.data.chromeosdevices || [];
    console.log(`\n✅ SUCCESS! Found ${devices.length} ChromeOS device(s)`)

    if (devices.length > 0) {
      console.log('\n--- Device 1 Raw JSON ---')
      console.log(JSON.stringify(devices[0], null, 2))
      console.log(''); // Add a newline for spacing
      devices.forEach((d, i) => {
        console.log(`--- Device ${i + 1} ---`);
        console.log(`  Device ID    : ${d.deviceId}`);
        console.log(`  Serial Number: ${d.serialNumber}`);
        console.log(`  Model        : ${d.model}`);
        console.log(`  OS Version   : ${d.osVersion}`);
        console.log(`  Status       : ${d.status}`);
        console.log(`  Last Sync    : ${d.lastSync}`);
        console.log(`  User         : ${d.annotatedUser || d.recentUsers?.[0]?.email || '-'}`);
        console.log(`  Location     : ${d.annotatedLocation || '-'}`);
        console.log('');
      });

      // Also check total
      if (response.data.nextPageToken) {
        console.log(`📌 More devices available (nextPageToken present)`);
      }
    } else {
      console.log('⚠️  No ChromeOS devices found. This could mean:');
      console.log('    - No Chrome OS / Chrome OS Flex devices are enrolled');
      console.log('    - Devices are in a different OU that the admin cannot access');
    }

    // Check etag for delta sync capability
    if (response.data.etag) {
      console.log(`✅ ETag available: ${response.data.etag} (delta sync supported)`);
    }

  } catch (error) {
    console.error('❌ API call failed:');
    console.error('   Status:', error.response?.status || error.code);
    console.error('   Message:', error.response?.data?.error?.message || error.message);
    console.error('');

    if (error.response?.status === 403) {
      console.error('🔧 Fix: Domain-wide Delegation may not be properly configured.');
      console.error('   Go to: admin.google.com → Security → API Controls → Domain-wide Delegation');
      console.error('   Client ID:', keyFile.client_id);
      console.error('   Scopes:');
      console.error('     https://www.googleapis.com/auth/admin.directory.device.chromeos.readonly');
      console.error('     https://www.googleapis.com/auth/admin.directory.device.chromeos');
    } else if (error.response?.status === 401) {
      console.error('🔧 Fix: Service Account key may be invalid or expired.');
    } else if (error.response?.status === 404) {
      console.error('🔧 Fix: Customer ID may be wrong. Current:', customerId);
    }
  }
}

testConnection();
