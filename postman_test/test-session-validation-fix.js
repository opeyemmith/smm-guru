#!/usr/bin/env node

/**
 * Test script to verify the Session Validation Test fix
 * This script tests the session endpoint for both authenticated and unauthenticated states
 */

const http = require('http');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const SESSION_ENDPOINT = '/api/auth/get-session';
const SIGNIN_ENDPOINT = '/api/auth/sign-in/email';

console.log('🧪 Testing Session Validation Fix');
console.log('=================================');

// Test unauthenticated session first
function testUnauthenticatedSession() {
    console.log('🔍 Testing Unauthenticated Session State');
    console.log('========================================');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: SESSION_ENDPOINT,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    console.log('🚀 Requesting session without authentication...');
    
    const req = http.request(options, (res) => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        console.log(`📋 Response Headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📄 Response Body:', data);
            
            try {
                const response = JSON.parse(data);
                
                console.log('');
                console.log('🔍 Unauthenticated Session Validation:');
                console.log(`✅ HTTP Status 200: ${res.statusCode === 200 ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Response is null: ${response === null ? 'PASS' : 'FAIL'}`);
                const isValidFormat = response === null || (typeof response === 'object' && response !== null && response.hasOwnProperty('user'));
                console.log(`✅ Valid response format: ${isValidFormat ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Security Headers Present: ${res.headers['x-frame-options'] ? 'PASS' : 'FAIL'}`);
                
                if (res.statusCode === 200 && response === null) {
                    console.log('');
                    console.log('🎉 SUCCESS: Unauthenticated session validation working correctly!');
                    console.log('🛡️ Security: Session endpoint properly returns null for unauthenticated state');
                } else {
                    console.log('');
                    console.log('⚠️ UNEXPECTED: Session endpoint behavior differs from expected');
                }
                
                // Test with fake session token
                setTimeout(testFakeSessionToken, 1000);
                
            } catch (error) {
                console.log('Parse error:', error.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
        console.log('💡 Make sure the frontend server is running on http://localhost:3000');
    });

    req.end();
}

// Test with fake session token
function testFakeSessionToken() {
    console.log('');
    console.log('🛡️ Testing Session Hijacking Protection');
    console.log('======================================');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: SESSION_ENDPOINT,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': 'better-auth.session_token=fake-session-token-12345; Path=/; HttpOnly; SameSite=Strict'
        }
    };

    console.log('🚀 Requesting session with fake token...');
    
    const req = http.request(options, (res) => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📄 Response Body:', data);
            
            try {
                const response = JSON.parse(data);
                
                console.log('');
                console.log('🔍 Session Hijacking Protection Validation:');
                console.log(`✅ HTTP Status 200: ${res.statusCode === 200 ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Fake token rejected (null): ${response === null ? 'PASS' : 'FAIL'}`);
                console.log(`✅ No user data leaked: ${response === null ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Security Headers Present: ${res.headers['x-frame-options'] ? 'PASS' : 'FAIL'}`);
                
                if (res.statusCode === 200 && response === null) {
                    console.log('');
                    console.log('🎉 SUCCESS: Session hijacking protection working correctly!');
                    console.log('🛡️ Security: Fake session tokens properly rejected');
                } else {
                    console.log('');
                    console.log('❌ FAILURE: Session hijacking protection may have issues');
                }
                
                // Test authentication (optional)
                setTimeout(testAuthentication, 1000);
                
            } catch (error) {
                console.log('Parse error:', error.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
    });

    req.end();
}

// Test authentication (optional - requires valid credentials)
function testAuthentication() {
    console.log('');
    console.log('🔐 Testing Authentication Setup (Optional)');
    console.log('==========================================');
    
    const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!'
    };
    
    const payload = JSON.stringify(credentials);
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: SIGNIN_ENDPOINT,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    console.log('🚀 Attempting authentication...');
    console.log('📝 Note: This may fail if test user doesn\'t exist (expected)');
    
    const req = http.request(options, (res) => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📄 Response (first 200 chars):', data.substring(0, 200) + '...');
            
            if (res.statusCode === 200) {
                console.log('✅ Authentication successful - session established');
                console.log('💡 You can now test authenticated session validation in Postman');
            } else if (res.statusCode === 400 || res.statusCode === 401) {
                console.log('ℹ️ Authentication failed (expected if test user doesn\'t exist)');
                console.log('💡 Create a test user or update credentials to test authenticated state');
            } else {
                console.log(`⚠️ Unexpected authentication response: ${res.statusCode}`);
            }
            
            console.log('');
            console.log('📋 Session Validation Test Fix Summary:');
            console.log('======================================');
            console.log('✅ Unauthenticated session handling: TESTED');
            console.log('✅ Session hijacking protection: TESTED');
            console.log('✅ Authentication endpoint: TESTED');
            console.log('');
            console.log('🎯 Next Steps:');
            console.log('1. Run the updated Postman collection');
            console.log('2. Verify all session security tests pass');
            console.log('3. Test with both authenticated and unauthenticated states');
        });
    });

    req.on('error', (error) => {
        console.error('❌ Authentication test failed:', error.message);
    });

    req.write(payload);
    req.end();
}

// Run the tests
console.log('🔧 Session Validation Test Fix Verification');
console.log('===========================================');
console.log('');

testUnauthenticatedSession();
