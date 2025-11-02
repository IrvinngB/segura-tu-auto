async function testCreateUser() {
  try {
    console.log('🧪 Testing create user API...');

    const response = await fetch('http://localhost:3002/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'admin',
        phone: '123456789',
      }),
    });

    const result = await response.json();
    console.log('✅ Create user response:', response.status, result);
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

async function testListUsers() {
  try {
    console.log('🧪 Testing list users API...');

    const response = await fetch('http://localhost:3002/api/admin/list-users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ List users response:', response.status, result);
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');

  await testCreateUser();
  console.log('\n');
  await testListUsers();

  console.log('\n🏁 Tests completed');
}

runTests();
