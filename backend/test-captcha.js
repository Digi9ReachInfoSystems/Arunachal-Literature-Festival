import fetch from 'node-fetch';

console.log('Testing ALTCHA CAPTCHA Backend Implementation\n');

// Test 1: Generate Challenge
console.log('Test 1: Generate CAPTCHA Challenge');
try {
  const response = await fetch('http://localhost:8000/api/v1/captcha/generate');
  const data = await response.json();
  
  if (data.challenge && data.salt && data.signature) {
    console.log('✓ PASS: Challenge generated successfully');
    console.log('  Challenge:', data.challenge.substring(0, 20) + '...');
    console.log('  Salt:', data.salt);
    console.log('  Algorithm:', data.algorithm);
    console.log('  Signature:', data.signature.substring(0, 20) + '...');
  } else {
    console.log('✗ FAIL: Invalid challenge response');
  }
} catch (error) {
  console.log('✗ FAIL:', error.message);
}

console.log('\nTest 2: Login Without CAPTCHA');
try {
  const response = await fetch('http://localhost:8000/api/v1/onboarding/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  
  if (data.message === 'Please complete the CAPTCHA') {
    console.log('✓ PASS: CAPTCHA requirement enforced');
    console.log('  Status:', response.status);
    console.log('  Message:', data.message);
  } else {
    console.log('✗ FAIL: CAPTCHA not enforced');
  }
} catch (error) {
  console.log('✗ FAIL:', error.message);
}

console.log('\nTest 3: Login With Invalid CAPTCHA');
try {
  const response = await fetch('http://localhost:8000/api/v1/onboarding/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      altchaPayload: 'invalid-payload'
    })
  });
  const data = await response.json();
  
  if (data.message === 'CAPTCHA verification failed. Please try again.') {
    console.log('✓ PASS: Invalid CAPTCHA rejected');
    console.log('  Status:', response.status);
    console.log('  Message:', data.message);
  } else {
    console.log('✗ FAIL: Invalid CAPTCHA accepted');
  }
} catch (error) {
  console.log('✗ FAIL:', error.message);
}

console.log('\n✅ All tests completed!');
process.exit(0);
