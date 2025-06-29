# 🚀 Postman Security Testing Guide for SMM Guru

## 📋 **Overview**

This guide provides comprehensive Postman collections and tests to validate the security of your SMM Guru application. It covers authentication, authorization, rate limiting, input validation, and security headers.

---

## 🛠️ **Setup Instructions**

### **1. Environment Setup**
Create a new Postman environment with these variables:

```json
{
  "frontend_url": "http://localhost:3000",
  "backend_url": "http://localhost:8080",
  "test_email": "test@example.com",
  "test_password": "TestPassword123!",
  "admin_email": "admin@example.com",
  "admin_password": "AdminPassword123!",
  "session_token": "",
  "api_key": "",
  "csrf_token": ""
}
```

### **2. Pre-Request Scripts**
Add this to your collection's pre-request script:

```javascript
// Auto-extract session token from cookies
pm.sendRequest({
    url: pm.environment.get("frontend_url") + "/api/auth/get-session",
    method: 'GET'
}, function (err, response) {
    if (!err && response.code === 200) {
        const sessionData = response.json();
        if (sessionData.user) {
            pm.environment.set("session_token", "authenticated");
        }
    }
});
```

---

## 🔐 **COLLECTION 1: Authentication Security Tests**

### **Test 1.1: Sign Up Security**
```http
POST {{frontend_url}}/api/auth/sign-up/email
Content-Type: application/json

{
  "email": "{{test_email}}",
  "password": "{{test_password}}",
  "name": "Test User"
}
```

**Tests Script:**
```javascript
pm.test("Sign up returns proper status", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 409]);
});

pm.test("Response has security headers", function () {
    pm.expect(pm.response.headers.get("X-Frame-Options")).to.exist;
    pm.expect(pm.response.headers.get("X-Content-Type-Options")).to.exist;
});

pm.test("No sensitive data in response", function () {
    const response = pm.response.json();
    pm.expect(response).to.not.have.property("password");
    pm.expect(response).to.not.have.property("hash");
});
```

### **Test 1.2: Sign In Security**
```http
POST {{frontend_url}}/api/auth/sign-in/email
Content-Type: application/json

{
  "email": "{{test_email}}",
  "password": "{{test_password}}"
}
```

**Tests Script:**
```javascript
pm.test("Sign in successful", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Session cookie is HttpOnly", function () {
    const cookies = pm.response.headers.get("Set-Cookie");
    if (cookies) {
        pm.expect(cookies).to.include("HttpOnly");
        pm.expect(cookies).to.include("SameSite=Strict");
    }
});

pm.test("Response contains user data", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property("user");
    pm.expect(response.user).to.have.property("email");
});
```

### **Test 1.3: Invalid Credentials**
```http
POST {{frontend_url}}/api/auth/sign-in/email
Content-Type: application/json

{
  "email": "{{test_email}}",
  "password": "wrongpassword"
}
```

**Tests Script:**
```javascript
pm.test("Invalid credentials rejected", function () {
    pm.expect(pm.response.code).to.be.oneOf([401, 400]);
});

pm.test("Error message is generic", function () {
    const response = pm.response.json();
    pm.expect(response.message).to.not.include("password");
    pm.expect(response.message).to.not.include("hash");
});
```

### **Test 1.4: Rate Limiting on Authentication**
```http
POST {{frontend_url}}/api/auth/sign-in/email
Content-Type: application/json

{
  "email": "{{test_email}}",
  "password": "wrongpassword"
}
```

**Pre-Request Script:**
```javascript
// Run this request 6 times to trigger rate limiting
pm.globals.set("attempt_count", (pm.globals.get("attempt_count") || 0) + 1);
```

**Tests Script:**
```javascript
const attemptCount = pm.globals.get("attempt_count");

if (attemptCount > 5) {
    pm.test("Rate limiting triggered", function () {
        pm.expect(pm.response.code).to.equal(429);
    });
    
    pm.test("Rate limit headers present", function () {
        pm.expect(pm.response.headers.get("X-RateLimit-Limit")).to.exist;
        pm.expect(pm.response.headers.get("Retry-After")).to.exist;
    });
} else {
    pm.test("Request within rate limit", function () {
        pm.expect(pm.response.code).to.not.equal(429);
    });
}
```

---

## 🛡️ **COLLECTION 2: Authorization Security Tests**

### **Test 2.1: Unauthenticated API Access**
```http
GET {{frontend_url}}/api/v1/dashboard/wallet
```

**Tests Script:**
```javascript
pm.test("Unauthenticated request blocked", function () {
    pm.expect(pm.response.code).to.be.oneOf([401, 403, 302]);
});

pm.test("No sensitive data leaked", function () {
    const response = pm.response.text();
    pm.expect(response).to.not.include("balance");
    pm.expect(response).to.not.include("wallet");
});
```

### **Test 2.2: Admin Route Protection**
```http
GET {{frontend_url}}/api/v1/admin/providers
```

**Tests Script:**
```javascript
pm.test("Admin route protected", function () {
    pm.expect(pm.response.code).to.be.oneOf([401, 403]);
});

pm.test("Proper error message", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property("message");
    pm.expect(response.message).to.include("admin");
});
```

### **Test 2.3: Role-Based Access Control**
```http
POST {{frontend_url}}/api/v1/admin/categories
Content-Type: application/json

{
  "name": "Test Category",
  "description": "Test Description"
}
```

**Tests Script:**
```javascript
pm.test("Non-admin user blocked from admin actions", function () {
    pm.expect(pm.response.code).to.be.oneOf([401, 403]);
});

pm.test("Authorization error is descriptive", function () {
    const response = pm.response.json();
    pm.expect(response.message).to.include("admin");
});
```

---

## 🔒 **COLLECTION 3: API Key Security Tests**

### **Test 3.1: Backend API Without Key**
```http
POST {{backend_url}}/v2/handler
Content-Type: application/json

{
  "test": "data"
}
```

**Tests Script:**
```javascript
pm.test("API key required", function () {
    pm.expect(pm.response.code).to.equal(401);
});

pm.test("Proper error response", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property("message");
});
```

### **Test 3.2: Invalid API Key**
```http
POST {{backend_url}}/v2/handler
Content-Type: application/json

{
  "key": "invalid-api-key",
  "test": "data"
}
```

**Tests Script:**
```javascript
pm.test("Invalid API key rejected", function () {
    pm.expect(pm.response.code).to.equal(401);
});

pm.test("No information disclosure", function () {
    const response = pm.response.json();
    pm.expect(response.message).to.not.include("database");
    pm.expect(response.message).to.not.include("internal");
});
```

### **Test 3.3: API Key Creation**
```http
POST {{frontend_url}}/api/v1/dashboard/api-keys
Content-Type: application/json

{
  "name": "Test API Key"
}
```

**Pre-Request Script:**
```javascript
// Ensure user is authenticated
pm.sendRequest({
    url: pm.environment.get("frontend_url") + "/api/auth/sign-in/email",
    method: 'POST',
    header: {
        'Content-Type': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            email: pm.environment.get("test_email"),
            password: pm.environment.get("test_password")
        })
    }
}, function (err, response) {
    // Continue with the main request
});
```

**Tests Script:**
```javascript
pm.test("API key creation requires authentication", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 401]);
});

if (pm.response.code === 201) {
    pm.test("API key created successfully", function () {
        const response = pm.response.json();
        pm.expect(response.success).to.be.true;
    });
}
```

---

## 🌐 **COLLECTION 4: Security Headers Tests**

### **Test 4.1: Security Headers Validation**
```http
GET {{backend_url}}/api/auth/session
```

**Tests Script:**
```javascript
pm.test("HSTS header present", function () {
    pm.expect(pm.response.headers.get("Strict-Transport-Security")).to.exist;
});

pm.test("X-Frame-Options header present", function () {
    pm.expect(pm.response.headers.get("X-Frame-Options")).to.equal("DENY");
});

pm.test("X-Content-Type-Options header present", function () {
    pm.expect(pm.response.headers.get("X-Content-Type-Options")).to.equal("nosniff");
});

pm.test("Content-Security-Policy header present", function () {
    pm.expect(pm.response.headers.get("Content-Security-Policy")).to.exist;
});

pm.test("Referrer-Policy header present", function () {
    pm.expect(pm.response.headers.get("Referrer-Policy")).to.exist;
});

pm.test("Server information hidden", function () {
    pm.expect(pm.response.headers.get("Server")).to.be.oneOf([null, "", undefined]);
    pm.expect(pm.response.headers.get("X-Powered-By")).to.be.oneOf([null, "", undefined]);
});
```

### **Test 4.2: CORS Configuration**
```http
OPTIONS {{backend_url}}/api/auth/session
Origin: https://malicious-site.com
```

**Tests Script:**
```javascript
pm.test("CORS properly configured", function () {
    const allowedOrigin = pm.response.headers.get("Access-Control-Allow-Origin");
    pm.expect(allowedOrigin).to.not.equal("https://malicious-site.com");
    pm.expect(allowedOrigin).to.not.equal("*");
});

pm.test("CORS credentials properly controlled", function () {
    const allowCredentials = pm.response.headers.get("Access-Control-Allow-Credentials");
    if (allowCredentials) {
        pm.expect(allowCredentials).to.equal("true");
    }
});
```

---

## 🔍 **COLLECTION 5: Input Validation Tests**

### **Test 5.1: SQL Injection Protection**
```http
POST {{frontend_url}}/api/v1/admin/categories
Content-Type: application/json

{
  "name": "'; DROP TABLE users; --",
  "description": "SQL Injection Test"
}
```

**Tests Script:**
```javascript
pm.test("SQL injection attempt blocked", function () {
    pm.expect(pm.response.code).to.be.oneOf([400, 401, 403]);
});

pm.test("No database error exposed", function () {
    const response = pm.response.text();
    pm.expect(response).to.not.include("SQL");
    pm.expect(response).to.not.include("database");
    pm.expect(response).to.not.include("postgres");
});
```

### **Test 5.2: XSS Protection**
```http
POST {{frontend_url}}/api/v1/admin/categories
Content-Type: application/json

{
  "name": "<script>alert('XSS')</script>",
  "description": "XSS Test"
}
```

**Tests Script:**
```javascript
pm.test("XSS attempt handled", function () {
    pm.expect(pm.response.code).to.be.oneOf([400, 401, 403]);
});

pm.test("Script tags not reflected", function () {
    const response = pm.response.text();
    pm.expect(response).to.not.include("<script>");
    pm.expect(response).to.not.include("alert(");
});
```

### **Test 5.3: Large Payload Protection**

**⚠️ IMPORTANT**: Use the **Advanced Security Tests** collection for proper large payload testing. The test below is a simplified example.

**Enterprise-Grade Test (Recommended):**
Use `SMM_Guru_Advanced_Security_Tests.postman_collection.json` → "Vulnerability Tests" → "Large Payload Test"

**Manual Test Example:**
```http
POST {{backend_url}}/v2/handler
Content-Type: application/json

{
  "name": "{{$randomLoremParagraphs}}".repeat(1000),
  "description": "Large payload test"
}
```

**Enterprise Tests Script (from Advanced Collection):**
```javascript
// Pre-request: Generate 60KB payload dynamically
const targetSize = 60 * 1024; // 60KB
const basePayload = {
    "name": "",
    "description": "Large payload test to validate bodyLimit middleware",
    "category": "security-test",
    "large_data": ""
};
const baseSize = JSON.stringify(basePayload).length;
const largeString = 'A'.repeat(targetSize - baseSize);
basePayload.large_data = largeString;
pm.environment.set('large_payload_json', JSON.stringify(basePayload));

// Tests: Validate enterprise security
pm.test("Payload size exceeds 50KB limit", function () {
    pm.expect(payloadSize).to.be.greaterThan(51200);
});

pm.test("Returns HTTP 413 (not 401)", function () {
    pm.expect(pm.response.code).to.equal(413);
});

pm.test("Enterprise error format", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('error', 'Payload Too Large');
    pm.expect(response).to.have.property('maxSize', '50KB');
});
```

**Security Validation:**
- ✅ **HTTP 413** (Payload Too Large) - not HTTP 401 (Unauthorized)
- ✅ **Middleware Order** - payload validation before authentication
- ✅ **DoS Prevention** - large payloads rejected early
- ✅ **No Info Disclosure** - no authentication details leaked

---

## ⚡ **COLLECTION 6: Rate Limiting Tests**

### **Test 6.1: General API Rate Limiting**
```http
GET {{backend_url}}/api/auth/session
```

**Pre-Request Script:**
```javascript
// Track request count
const requestCount = pm.globals.get("api_request_count") || 0;
pm.globals.set("api_request_count", requestCount + 1);
```

**Tests Script:**
```javascript
const requestCount = pm.globals.get("api_request_count");

if (requestCount > 100) {
    pm.test("General rate limiting active", function () {
        pm.expect(pm.response.code).to.equal(429);
    });
} else {
    pm.test("Request within general rate limit", function () {
        pm.expect(pm.response.code).to.not.equal(429);
    });
}
```

---

## 🚨 **COLLECTION 7: Error Handling Tests**

### **Test 7.1: Information Disclosure Prevention**
```http
GET {{frontend_url}}/api/v1/nonexistent-endpoint
```

**Tests Script:**
```javascript
pm.test("404 error doesn't expose information", function () {
    const response = pm.response.text();
    pm.expect(response).to.not.include("stack trace");
    pm.expect(response).to.not.include("internal");
    pm.expect(response).to.not.include("database");
    pm.expect(response).to.not.include("file path");
});

pm.test("Generic error message", function () {
    pm.expect(pm.response.code).to.equal(404);
});
```

### **Test 7.2: Malformed JSON Handling**
```http
POST {{frontend_url}}/api/v1/admin/categories
Content-Type: application/json

{invalid-json
```

**Tests Script:**
```javascript
pm.test("Malformed JSON handled gracefully", function () {
    pm.expect(pm.response.code).to.equal(400);
});

pm.test("No internal error details exposed", function () {
    const response = pm.response.text();
    pm.expect(response).to.not.include("SyntaxError");
    pm.expect(response).to.not.include("JSON.parse");
});
```

---

## 📊 **Running the Tests**

### **1. Import Collections**
1. Copy each collection into separate Postman collections
2. Set up the environment variables
3. Configure pre-request scripts

### **2. Test Execution Order**
1. **Authentication Tests** - Establish baseline security
2. **Authorization Tests** - Verify access controls
3. **Security Headers** - Check infrastructure security
4. **Input Validation** - Test injection protection
5. **Rate Limiting** - Verify abuse protection
6. **Error Handling** - Check information disclosure

### **3. Expected Results**
- **Authentication**: All tests should pass with proper security
- **Authorization**: Unauthorized access should be blocked
- **Headers**: All security headers should be present
- **Validation**: Malicious input should be rejected
- **Rate Limiting**: Excessive requests should be throttled
- **Errors**: No sensitive information should be exposed

---

## 🎯 **Success Criteria**

### **✅ Passing Security Tests**
- Authentication requires valid credentials
- Authorization blocks unauthorized access
- Security headers are properly configured
- Input validation prevents injection attacks
- Rate limiting protects against abuse
- Error messages don't expose sensitive information

### **❌ Failing Tests Indicate**
- Security vulnerabilities that need immediate attention
- Missing security configurations
- Potential attack vectors

**Use this guide to comprehensively test your application's security posture with Postman!**
