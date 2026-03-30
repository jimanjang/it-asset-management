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
    
    console.log('Listing policy schemas...');
    const response = await chromepolicy.customers.policySchemas.list({
      parent: `customers/${customerId}`,
      pageSize: 20
    });

    console.log('Success! Schemas found:', response.data.policySchemas?.length || 0);
    if (response.data.policySchemas) {
        response.data.policySchemas.forEach(s => console.log(`- ${s.name}`));
    }

  } catch (error) {
    console.error('DIAGNOSTIC FAILURE:', error.message);
  }
}

diagnose();
