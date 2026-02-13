#!/usr/bin/env node
/**
 * Test Frontend API Client
 * Simulates what the UI does when calling the chat API
 */

// Simulate the apiClient behavior
const baseUrl = 'http://localhost:8002/api';

async function testFrontendChatCall() {
  console.log('\n🧪 Testing Frontend Chat Call...\n');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Full URL: ${baseUrl}/chat/chat\n`);

  try {
    const request = {
      message: 'Hello from frontend test!',
      conversationId: 'frontend-test-123',
      model: 'claude'
    };

    console.log('📤 Sending request:', JSON.stringify(request, null, 2));

    const response = await fetch(`${baseUrl}/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('\n📥 Response received:');
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Response: "${data.response}"`);
    console.log(`  Model: ${data.model}`);
    console.log(`  Conversation ID: ${data.conversationId}`);

    console.log('\n✅ Frontend API call works correctly!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Frontend API call failed:');
    console.error(`  Error: ${error.message}\n`);
    return false;
  }
}

testFrontendChatCall().then(success => {
  process.exit(success ? 0 : 1);
});
