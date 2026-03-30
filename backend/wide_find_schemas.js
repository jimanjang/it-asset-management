const { google } = require('googleapis');
const fs = require('fs');

async function diagnose() {
  try {
    const keyFile = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
    const delegatedAdmin = 'laika@daangnservice.com';
    const customerId = 'C00ip82ka';

    const auth = new google.auth.JWT({
      email: keyFile.client_email,
      key: keyFile.private_key,
      scopes: ['https://www.googleapis.com/auth/chrome.management.policy'],
      subject: delegatedAdmin,
    });

    const chromepolicy = google.chromepolicy({ version: 'v1', auth });
    
    console.log('Listing policy schemas (up to 300)...');
    const response = await chromepolicy.customers.policySchemas.list({
      parent: `customers/${customerId}`,
      pageSize: 300
    });

    if (response.data.policySchemas) {
        const userSchemas = response.data.policySchemas
            .map(s => s.name.split('/').pop())
            .filter(id => id.startsWith('chrome.users'));
        console.log('User Schemas found:', JSON.stringify(userSchemas.slice(0, 50), null, 2));
    }

  } catch (error) {
    console.error('DIAGNOSTIC FAILURE:', error.message);
  }
}

diagnose();
