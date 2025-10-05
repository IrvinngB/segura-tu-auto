const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sztuxibgvlwbykaopnqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dHV4aWJndmx3YnlrYW9wbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjIwOTAsImV4cCI6MjA3MzY5ODA5MH0.FG8snw8YMe4HTW76uMuy_ghIJUho-Ltq96cDUNq0OgM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistration() {
  console.log('🧪 Testing registration process...');
  
  try {
    // Test data
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'test123456',
      firstName: 'Test',
      lastName: 'User',
      phone: '+52 55 1234 5678',
      role: 'customer',
      country: 'México',
      birthDate: '1990-01-01',
      licenseYear: '2010'
    };

    console.log('1. Testing auth signup...');
    
    // Step 1: Test auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          phone: testUser.phone,
          role: testUser.role,
        },
      },
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth signup');
      return;
    }

    console.log('✅ Auth signup successful:', authData.user.id);

    // Step 2: Test users table insert
    console.log('2. Testing users table insert...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testUser.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        phone: testUser.phone,
        role: testUser.role,
        password_hash: 'handled_by_supabase_auth',
      })
      .select();

    if (userError) {
      console.error('❌ Users table insert failed:', userError);
      return;
    }

    console.log('✅ Users table insert successful:', userData);

    // Step 3: Test customers table insert
    if (testUser.role === 'customer') {
      console.log('3. Testing customers table insert...');
      
      const currentYear = new Date().getFullYear();
      const drivingExperience = currentYear - parseInt(testUser.licenseYear);

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: authData.user.id,
          date_of_birth: testUser.birthDate,
          country: testUser.country,
          driving_experience_years: drivingExperience,
          has_accidents: false,
          has_claims: false,
        })
        .select();

      if (customerError) {
        console.error('❌ Customers table insert failed:', customerError);
        return;
      }

      console.log('✅ Customers table insert successful:', customerData);
    }

    console.log('🎉 Registration test completed successfully!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

async function checkTablesStructure() {
  console.log('📋 Checking tables structure...');
  
  try {
    // Test users table
    console.log('1. Testing users table access...');
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(0);

    if (usersError) {
      console.error('❌ Users table error:', usersError);
    } else {
      console.log('✅ Users table accessible');
    }

    // Test customers table  
    console.log('2. Testing customers table access...');
    const { data: customersTest, error: customersError } = await supabase
      .from('customers')
      .select('count')
      .limit(0);

    if (customersError) {
      console.error('❌ Customers table error:', customersError);
    } else {
      console.log('✅ Customers table accessible');
    }

    // Test quotes table
    console.log('3. Testing quotes table access...');
    const { data: quotesTest, error: quotesError } = await supabase
      .from('quotes')
      .select('count')
      .limit(0);

    if (quotesError) {
      console.error('❌ Quotes table error:', quotesError);
    } else {
      console.log('✅ Quotes table accessible');
    }

  } catch (error) {
    console.error('💥 Error checking tables:', error);
  }
}

async function main() {
  await checkTablesStructure();
  console.log('\n' + '='.repeat(50) + '\n');
  await testRegistration();
}

main();