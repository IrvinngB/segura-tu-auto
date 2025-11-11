// Temporary script to create test data for document count
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  try {
    console.log('🏗️ Creating test data for document counting...');

    // 1. Get existing customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(3);

    if (!customers || customers.length === 0) {
      console.log('❌ No customers found. Please create customers first.');
      return;
    }

    // 2. Create test claims
    const testClaims = [
      {
        claim_number: 'CLM-TEST-001',
        customer_id: customers[0].id,
        claim_type: 'Colisión',
        status: 'submitted',
        description: 'Test claim for document counting - missing documents',
        incident_date: new Date().toISOString(),
        location: 'Test Location',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_year: '2020',
        vehicle_plate: 'ABC123'
      },
      {
        claim_number: 'CLM-TEST-002', 
        customer_id: customers[Math.min(1, customers.length - 1)].id,
        claim_type: 'Robo',
        status: 'under_review',
        description: 'Test claim for document counting - partially complete',
        incident_date: new Date().toISOString(),
        location: 'Test Location 2',
        vehicle_make: 'Honda',
        vehicle_model: 'Civic',
        vehicle_year: '2021',
        vehicle_plate: 'XYZ789'
      }
    ];

    // Insert claims
    const { data: insertedClaims, error: claimsError } = await supabase
      .from('claims')
      .insert(testClaims)
      .select();

    if (claimsError) {
      console.error('❌ Error creating claims:', claimsError);
      return;
    }

    console.log('✅ Created test claims:', insertedClaims?.length);

    // 3. Add partial documents to second claim only (to make it partially complete)
    if (insertedClaims && insertedClaims.length > 1) {
      const partialDocs = [
        {
          claim_id: insertedClaims[1].id,
          customer_id: insertedClaims[1].customer_id,
          document_type: 'id',
          file_name: 'cedula_test.pdf',
          file_url: 'test-url-1',
          file_size: 1024,
          mime_type: 'application/pdf',
          status: 'pending'
        },
        {
          claim_id: insertedClaims[1].id,
          customer_id: insertedClaims[1].customer_id,
          document_type: 'license',
          file_name: 'licencia_test.pdf',
          file_url: 'test-url-2',
          file_size: 1024,
          mime_type: 'application/pdf',
          status: 'pending'
        }
      ];

      const { error: docsError } = await supabase
        .from('claim_customer_documents')
        .insert(partialDocs);

      if (docsError) {
        console.error('❌ Error creating documents:', docsError);
      } else {
        console.log('✅ Created partial documents for second claim');
      }
    }

    console.log('🎉 Test data created successfully!');
    console.log('📊 You should now see document counts in the sidebar');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();