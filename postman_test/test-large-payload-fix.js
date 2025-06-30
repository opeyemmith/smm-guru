#!/usr/bin/env node

/**
 * Test script to verify the Large Payload Test fix
 * This script generates a large payload and tests the backend endpoint
 */

const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:8080';
const ENDPOINT = '/v2/handler';
const TARGET_SIZE = 60 * 1024; // 60KB

console.log('🧪 Testing Large Payload Fix');
console.log('============================');

// Generate large payload
function generateLargePayload() {
    const basePayload = {
        name: "",
        description: "Large payload test to validate bodyLimit middleware - this payload exceeds 50KB limit",
        category: "security-test",
        metadata: {
            test_type: "payload_size_validation",
            expected_status: 413,
            security_check: "middleware_order_validation"
        },
        large_data: ""
    };

    // Calculate how much data we need to add
    const baseSize = JSON.stringify(basePayload).length;
    const remainingSize = TARGET_SIZE - baseSize;
    
    // Generate large string data
    const largeString = 'A'.repeat(Math.max(remainingSize, 55000));
    
    // Set the large data
    basePayload.large_data = largeString;
    
    return JSON.stringify(basePayload);
}

// Test function
function testLargePayload() {
    const payload = generateLargePayload();
    const payloadSize = Buffer.byteLength(payload, 'utf8');
    
    console.log(`🔍 Generated payload size: ${payloadSize} bytes`);
    console.log(`🎯 Target was: ${TARGET_SIZE} bytes`);
    console.log(`📊 Exceeds 50KB limit: ${payloadSize > 51200 ? '✅ YES' : '❌ NO'}`);
    console.log('');

    const options = {
        hostname: 'localhost',
        port: 8080,
        path: ENDPOINT,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    console.log('🚀 Sending request to backend...');
    
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
                console.log(`✅ HTTP Status 413: ${res.statusCode === 413 ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Error Type: ${response.error === 'Payload Too Large' ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Max Size Info: ${response.maxSize === '50KB' ? 'PASS' : 'FAIL'}`);
                console.log(`✅ Success False: ${response.success === false ? 'PASS' : 'FAIL'}`);
                
                if (res.statusCode === 413) {
                    console.log('');
                    console.log('🎉 SUCCESS: Large Payload Test Fix is working correctly!');
                    console.log('🛡️ Security: bodyLimit middleware is executing before authentication');
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
        console.log('💡 Make sure the backend server is running on http://localhost:8080');
        console.log('   Run: cd apps/backend && npm run dev');
    });

    // Send the payload
    req.write(payload);
    req.end();
}

// Run the test
console.log('🔧 Large Payload Test Fix Verification');
console.log('=====================================');
console.log('');

testLargePayload();
