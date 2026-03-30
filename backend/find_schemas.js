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
    
    console.log('Searching for specific schemas...');
    const response = await chromepolicy.customers.policySchemas.list({
      parent: `customers/${customerId}`,
      pageSize: 50
    });

    const interesting = ['Screenshot', 'Incognito', 'URL', 'Extension', 'Download'];
    
    if (response.data.policySchemas) {
        response.data.policySchemas.forEach(s => {
            const schemaId = s.name.split('/').pop();
            if (interesting.some(keyword => schemaId.includes(keyword))) {
                console.log(`- ${schemaId}`);
            }
        });
    }

  } catch (error) {
    console.error('DIAGNOSTIC FAILURE:', error.message);
  }
}

diagnose();
