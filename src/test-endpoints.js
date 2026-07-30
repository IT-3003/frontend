// Automated API Endpoint Integration Tests
// Run with: node test-endpoints.js

const API_BASE = 'http://localhost:8080/api';

async function runTests() {
  console.log('🚀 Starting Supermarket Chain API Integration Tests...\n');

  // Test 1: Get All Items
  try {
    const res = await fetch(`${API_BASE}/item/all`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const items = await res.json();
    console.log(`✅ GET /api/item/all: Success! Found ${items.length} items.`);
  } catch (err) {
    console.error(`❌ GET /api/item/all: Failed!`, err.message);
  }

  // Test 2: Create a User
  const tempEmail = `test-${Math.floor(Math.random() * 10000)}@freshcart.com`;
  const userPayload = {
    id: Math.floor(100000 + Math.random() * 900000),
    firstName: 'John',
    lastName: 'Test',
    email: tempEmail,
    password: 'Password123!',
    phoneNumber: '0771234567',
    role: 'CUSTOMER',
    active: true,
    type: 'customer',
    address: '123 Test St, Colombo'
  };

  let createdUserId = null;
  try {
    const res = await fetch(`${API_BASE}/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload)
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const user = await res.json();
    createdUserId = user.id;
    console.log(`✅ POST /api/user/create: Success! Registered user ID: ${createdUserId}`);
  } catch (err) {
    console.error(`❌ POST /api/user/create: Failed!`, err.message);
  }

  // Test 3: Get All Users (our new endpoint)
  try {
    const res = await fetch(`${API_BASE}/user`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const users = await res.json();
    console.log(`✅ GET /api/user: Success! Found ${users.length} registered users.`);
  } catch (err) {
    console.error(`❌ GET /api/user: Failed!`, err.message);
  }

  // Test 4: Create a Branch
  const branchId = Math.floor(100000 + Math.random() * 900000);
  const branchPayload = {
    branchId: branchId,
    branchName: 'Test branch',
    address: '456 Test Rd, Colombo',
    phoneNumber: '0777654321',
    managerId: createdUserId || 1,
    openingHours: '08:00 AM - 10:00 PM',
    isActive: true
  };

  try {
    const res = await fetch(`${API_BASE}/branch/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branchPayload)
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const branch = await res.json();
    console.log(`✅ POST /api/branch/create: Success! Created branch ID: ${branch.branchId}`);
  } catch (err) {
    console.error(`❌ POST /api/branch/create: Failed!`, err.message);
  }

  // Test 5: Get All Branches
  try {
    const res = await fetch(`${API_BASE}/branch`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const branches = await res.json();
    console.log(`✅ GET /api/branch: Success! Found ${branches.length} active branches.`);
  } catch (err) {
    console.error(`❌ GET /api/branch: Failed!`, err.message);
  }

  console.log('\n🏁 API Integration Tests Finished.');
}

runTests();
