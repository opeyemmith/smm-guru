#!/usr/bin/env node

/**
 * Test script to verify the Malformed JSON Test fix
 * This script sends malformed JSON to the frontend API and validates the response
 */

const http = require('http');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const ENDPOINT = '/api/v1/admin/categories';

console.log('🧪 Testing Malformed JSON Fix');
console.log('==============================');

// Test function
function testMalformedJSON() {
    // Malformed JSON payload (missing quotes, invalid syntax)
    const malformedPayload = '{"name": "test", "invalid": json, "missing": quote}';
    
    console.log('📝 Malformed JSON payload:');
    console.log(malformedPayload);
    console.log('');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: ENDPOINT,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(malformedPayload)
        }
    };

    console.log('🚀 Sending malformed JSON to frontend API...');
    
    const req = http.request(options, (res) => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        console.log(`📋 Response Headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('');
            console.log('📄 Response Body:');
            try {
                const response = JSON.parse(data);
                console.log(JSON.stringify(response, null, 2));
                
                // Validate response
                console.log('');
                console.log('🔍 Validation Results:');
                console.log(`✅ HTTP Status 400: ${res.statusCode === 400 ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Error Type: ${response.error === 'Invalid JSON' ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Success False: ${response.success === false ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Has Details: ${response.details ? 'PASS' : 'FAIL'}`);
                
                // Check for information disclosure
                const responseText = JSON.stringify(response);
                const hasAuthInfo = responseText.includes('Authentication') || 
                                  responseText.includes('session') || 
                                  responseText.includes('token') ||
                                  responseText.includes('unauthorized');
                
                const hasInternalInfo = responseText.includes('SyntaxError') ||
                                      responseText.includes('JSON.parse') ||
                                      responseText.includes('stack');
                
                console.log(`✅ No Auth Info Disclosure: ${!hasAuthInfo ? 'PASS' : 'FAIL'}`);
                console.log(`✅ No Internal Info Disclosure: ${!hasInternalInfo ? 'PASS' : 'FAIL'}`);
                
                if (res.statusCode === 400) {
                    console.log('');
                    console.log('🎉 SUCCESS: Malformed JSON Test Fix is working correctly!');
                    console.log('🛡️ Security: JSON validation middleware is executing before authentication');
                } else if (res.statusCode === 401) {
                    console.log('');
                    console.log('❌ FAILURE: Authentication middleware is still executing first');
                    console.log('🚨 Security Issue: Middleware order needs to be fixed');
                } else {
                    console.log('');
                    console.log(`⚠️ UNEXPECTED: Received status ${res.statusCode}`);
                }
                
            } catch (error) {
                console.log('Raw response:', data);
                console.log('Parse error:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
        console.log('');
        console.log('💡 Make sure the frontend server is running on http://localhost:3000');
        console.log('   Run: cd apps/frontend && npm run dev');
    });

    // Send the malformed payload
    req.write(malformedPayload);
    req.end();
}

// Test valid JSON for comparison
function testValidJSON() {
    console.log('');
    console.log('🧪 Testing Valid JSON (for comparison)');
    console.log('=====================================');
    
    const validPayload = JSON.stringify({
        name: "Test Category",
        description: "Valid JSON test"
    });
    
    console.log('📝 Valid JSON payload:');
    console.log(validPayload);
    console.log('');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: ENDPOINT,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(validPayload)
        }
    };

    console.log('🚀 Sending valid JSON to frontend API...');
    
    const req = http.request(options, (res) => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📄 Response (first 200 chars):', data.substring(0, 200) + '...');
            
            if (res.statusCode === 401) {
                console.log('✅ Valid JSON reaches authentication (expected for protected endpoint)');
            } else {
                console.log(`ℹ️ Valid JSON response status: ${res.statusCode}`);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Valid JSON test failed:', error.message);
    });

    req.write(validPayload);
    req.end();
}

// Run the tests
console.log('🔧 Malformed JSON Test Fix Verification');
console.log('=======================================');
console.log('');

testMalformedJSON();

// Wait a bit then test valid JSON for comparison
setTimeout(testValidJSON, 2000);
