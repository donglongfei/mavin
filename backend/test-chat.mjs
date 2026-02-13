#!/usr/bin/env node
/**
 * Unit Test for OpenClaw Chat Integration
 * Tests the chat endpoint with OpenClaw backend
 */

const BASE_URL = 'http://localhost:8002';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n=== Test 1: Health Check ===', 'cyan');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'ok') {
      log('✓ Health check passed', 'green');
      return true;
    } else {
      log('✗ Health check failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function testSimpleChat() {
  log('\n=== Test 2: Simple Chat (2+2) ===', 'cyan');
  try {
    const response = await fetch(`${BASE_URL}/api/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is 2+2? Answer with just the number.',
        conversationId: 'test-simple-chat',
        model: 'claude'
      })
    });

    const data = await response.json();

    if (response.ok && data.response) {
      log(`✓ Got response: "${data.response}"`, 'green');
      log(`  Model: ${data.model}`, 'yellow');
      log(`  Conversation ID: ${data.conversationId}`, 'yellow');
      return true;
    } else {
      log(`✗ Chat failed: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Chat error: ${error.message}`, 'red');
    return false;
  }
}

async function testConversationContinuity() {
  log('\n=== Test 3: Conversation Continuity ===', 'cyan');
  const conversationId = 'test-continuity-' + Date.now();

  try {
    // First message
    log('Sending: "My name is Alice"', 'yellow');
    const response1 = await fetch(`${BASE_URL}/api/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'My name is Alice',
        conversationId: conversationId,
        model: 'claude'
      })
    });
    const data1 = await response1.json();
    log(`  Response 1: "${data1.response.substring(0, 100)}..."`, 'green');

    // Second message - test memory
    log('Sending: "What is my name?"', 'yellow');
    const response2 = await fetch(`${BASE_URL}/api/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is my name?',
        conversationId: conversationId,
        model: 'claude'
      })
    });
    const data2 = await response2.json();
    log(`  Response 2: "${data2.response}"`, 'green');

    if (data2.response.toLowerCase().includes('alice')) {
      log('✓ Conversation continuity works!', 'green');
      return true;
    } else {
      log('✗ AI did not remember the name', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Conversation test error: ${error.message}`, 'red');
    return false;
  }
}

async function testWithPersona() {
  log('\n=== Test 4: Chat with Persona (Leo) ===', 'cyan');
  try {
    const response = await fetch(`${BASE_URL}/api/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Explain what an atom is in one sentence',
        conversationId: 'test-persona-leo',
        model: 'claude',
        persona: 'leo'
      })
    });

    const data = await response.json();

    if (response.ok && data.response) {
      log(`✓ Leo persona response: "${data.response.substring(0, 150)}..."`, 'green');
      return true;
    } else {
      log(`✗ Persona chat failed: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Persona test error: ${error.message}`, 'red');
    return false;
  }
}

async function testErrorHandling() {
  log('\n=== Test 5: Error Handling (Empty Message) ===', 'cyan');
  try {
    const response = await fetch(`${BASE_URL}/api/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        conversationId: 'test-error'
      })
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
      log(`✓ Error handling works: "${data.error}"`, 'green');
      return true;
    } else {
      log('✗ Should have returned 400 error for empty message', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║  OpenClaw Chat Integration Test Suite  ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  const results = [];

  // Run all tests
  results.push(await testHealthCheck());
  results.push(await testSimpleChat());
  results.push(await testConversationContinuity());
  results.push(await testWithPersona());
  results.push(await testErrorHandling());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;

  log('\n' + '='.repeat(50), 'cyan');
  log(`Test Results: ${passed}/${total} passed`, passed === total ? 'green' : 'red');
  log('='.repeat(50), 'cyan');

  if (passed === total) {
    log('\n✓ All tests passed! 🎉', 'green');
    process.exit(0);
  } else {
    log(`\n✗ ${total - passed} test(s) failed`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
