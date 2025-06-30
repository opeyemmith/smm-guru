# 🧪 Comprehensive Security Testing Guide

## 🎯 **OVERVIEW**

This guide provides step-by-step instructions to test all security implementations and verify your application is properly secured.

---

## 🚀 **PHASE 1: BASIC SECURITY VERIFICATION**

### **1. Environment Variable Validation Test**

**Test 1: Missing Required Variables**
```bash
# Backup your .env file first
cp apps/frontend/.env apps/frontend/.env.backup

# Remove a critical variable
sed -i '/DATABASE_URL/d' apps/frontend/.env

# Try to start the application
cd apps/frontend && npm run dev
```

**Expected Result:**
```
🚨 Environment Variable Validation Failed:
  - Missing required environment variable: DATABASE_URL
```

**Test 2: Invalid Variable Format**
```bash
# Set invalid DATABASE_URL
echo "DATABASE_URL=invalid-url" >> apps/frontend/.env

# Try to start
npm run dev
```

**Expected Result:**
```
🚨 Environment Variable Validation Failed:
  - DATABASE_URL must be a valid PostgreSQL connection string
```

**Restore Environment:**
```bash
# Restore your .env file
cp apps/frontend/.env.backup apps/frontend/.env
```

### **2. Security Headers Verification**

**Test Security Headers:**
```bash
# Start your application first
pnpm dev

# Test security headers (in a new terminal)
curl -I http://localhost:8080/api/auth/session
```

**Expected Headers:**
```
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

**Test API Headers:**
```bash
curl -I http://localhost:3000/api/v1/dashboard/wallet
```

### **3. Rate Limiting Tests**

**Test General Rate Limiting:**
```bash
# Test rate limiting (100 requests in 15 minutes)
for i in {1..105}; do
  echo "Request $i"
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/auth/session
  sleep 0.1
done
```

**Expected Result:**
- First 100 requests: `200` status
- Requests 101+: `429` status with rate limit headers

**Test Authentication Rate Limiting:**
```bash
# Test auth rate limiting (5 attempts in 15 minutes)
for i in {1..7}; do
  echo "Auth attempt $i"
  curl -X POST http://localhost:3000/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpassword"}' \
    -w "%{http_code}\n"
done
```

---

## 🔒 **PHASE 2: AUTHENTICATION SECURITY TESTS**

### **4. Cookie Security Verification**

**Test Cookie Attributes:**
```bash
# Sign in and capture cookies
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# Check cookie attributes
cat cookies.txt
```

**Expected Cookie Attributes:**
```
# Should contain:
HttpOnly
Secure (in production)
SameSite=Strict
```

**Test Cookie Security in Browser:**
```javascript
// Open browser console on your app
// Try to access session cookie (should fail)
document.cookie
// Should not show session tokens due to HttpOnly
```

### **5. Session Management Tests**

**Test Session Validation:**
```bash
# Test with valid session
curl -b cookies.txt http://localhost:3000/api/v1/dashboard/wallet

# Test with invalid session
curl -H "Cookie: session=invalid-token" http://localhost:3000/api/v1/dashboard/wallet
```

**Test Session Expiration:**
```bash
# Wait for session to expire (24 hours) or manually expire
# Then test access
curl -b cookies.txt http://localhost:3000/api/v1/dashboard/wallet
```

---

## 🛡️ **PHASE 3: AUTHORIZATION TESTS**

### **6. Role-Based Access Control Tests**

**Test Admin Route Protection:**
```bash
# Test admin access without admin role
curl -b cookies.txt http://localhost:3000/admin/users
# Should redirect to dashboard

# Test admin API without admin role
curl -b cookies.txt http://localhost:3000/api/v1/admin/users
# Should return 403
```

**Test Middleware Protection:**
```bash
# Test dashboard access without authentication
curl http://localhost:3000/dashboard
# Should redirect to sign-in

# Test API access without authentication
curl http://localhost:3000/api/v1/dashboard/wallet
# Should return 401
```

### **7. API Key Security Tests**

**Test API Key Validation:**
```bash
# Test without API key
curl -X POST http://localhost:8080/v2/handler \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Should return 401

# Test with invalid API key
curl -X POST http://localhost:8080/v2/handler \
  -H "Content-Type: application/json" \
  -d '{"key": "invalid-key", "test": "data"}'
# Should return 401
```

---

## 🔍 **PHASE 4: VULNERABILITY TESTS**

### **8. CSRF Protection Tests**

**Test CSRF Protection:**
```bash
# Test POST without CSRF token (should fail)
curl -X POST http://localhost:8080/api/v1/admin/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "test-category"}'
# Should return 403

# Get CSRF token first
CSRF_TOKEN=$(curl -s http://localhost:8080/api/auth/session | grep -o '"csrf":"[^"]*"' | cut -d'"' -f4)

# Test with CSRF token (should work)
curl -X POST http://localhost:8080/api/v1/admin/categories \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"name": "test-category"}'
```

### **9. Input Validation Tests**

**Test SQL Injection Protection:**
```bash
# Test malicious input
curl -X POST http://localhost:3000/api/v1/dashboard/orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"category": "1; DROP TABLE users; --", "service": "test"}'
# Should return validation error
```

**Test XSS Protection:**
```bash
# Test script injection
curl -X POST http://localhost:3000/api/v1/admin/categories \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "<script>alert(\"xss\")</script>"}'
# Should be sanitized or rejected
```

### **10. Error Handling Tests**

**Test Information Disclosure:**
```bash
# Test database error exposure
curl http://localhost:3000/api/v1/nonexistent-endpoint
# Should return generic error, not database details

# Test stack trace exposure
curl -X POST http://localhost:3000/api/v1/dashboard/orders \
  -H "Content-Type: application/json" \
  -d 'invalid-json'
# Should return sanitized error
```

---

## 🔧 **PHASE 5: AUTOMATED SECURITY TESTING**

### **11. Security Testing Script**

Create a comprehensive test script:

```bash
#!/bin/bash
# security-test.sh

echo "🧪 Starting Security Tests..."

# Test 1: Security Headers
echo "Testing Security Headers..."
HEADERS=$(curl -s -I http://localhost:8080/api/auth/session)
if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
    echo "✅ X-Frame-Options header present"
else
    echo "❌ X-Frame-Options header missing"
fi

# Test 2: Rate Limiting
echo "Testing Rate Limiting..."
for i in {1..6}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/sign-in \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}')
    if [ $i -gt 5 ] && [ "$RESPONSE" = "429" ]; then
        echo "✅ Rate limiting working"
        break
    elif [ $i -gt 5 ]; then
        echo "❌ Rate limiting not working"
    fi
done

# Test 3: Authentication
echo "Testing Authentication..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/dashboard/wallet)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "302" ]; then
    echo "✅ Authentication protection working"
else
    echo "❌ Authentication protection not working"
fi

echo "🏁 Security tests completed"
```

**Run the script:**
```bash
chmod +x security-test.sh
./security-test.sh
```

---

## 📊 **PHASE 6: BROWSER-BASED TESTING**

### **12. Browser Security Tests**

**Test 1: Cookie Security**
1. Open browser developer tools
2. Go to Application/Storage tab
3. Check cookies - session cookies should have:
   - `HttpOnly: true`
   - `Secure: true` (in production)
   - `SameSite: Strict`

**Test 2: Content Security Policy**
1. Open browser console
2. Try to execute inline script:
   ```javascript
   eval('console.log("CSP test")')
   ```
3. Should see CSP violation error

**Test 3: Frame Protection**
1. Try to embed your app in an iframe:
   ```html
   <iframe src="http://localhost:3000"></iframe>
   ```
2. Should be blocked by X-Frame-Options

---

## ✅ **SECURITY TEST CHECKLIST**

### **Environment & Configuration**
- [ ] Environment variables validated on startup
- [ ] Invalid environment variables prevent startup
- [ ] No sensitive data in error messages

### **Headers & Transport Security**
- [ ] All security headers present
- [ ] HSTS header configured correctly
- [ ] CSP prevents inline scripts
- [ ] X-Frame-Options prevents embedding

### **Authentication & Sessions**
- [ ] Cookies have secure attributes
- [ ] Session validation works correctly
- [ ] Session expiration enforced
- [ ] Unauthenticated access blocked

### **Authorization & Access Control**
- [ ] Role-based access control working
- [ ] Admin routes protected
- [ ] API endpoints require proper permissions
- [ ] Middleware protection active

### **Rate Limiting & Abuse Prevention**
- [ ] General rate limiting active
- [ ] Authentication rate limiting working
- [ ] Rate limit headers present
- [ ] Proper 429 responses

### **Input Validation & Injection Protection**
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Input validation working
- [ ] Malformed requests handled

### **Error Handling & Information Disclosure**
- [ ] Generic error messages in production
- [ ] No stack traces exposed
- [ ] No database errors exposed
- [ ] Request IDs for tracking

---

## 🚨 **WHAT TO DO IF TESTS FAIL**

### **If Security Headers Missing:**
1. Check if security middleware is applied
2. Verify middleware order in app.ts
3. Check for conflicting middleware

### **If Rate Limiting Not Working:**
1. Verify rate limit middleware is applied
2. Check if requests are being counted
3. Verify IP detection is working

### **If Authentication Bypassed:**
1. Check middleware order
2. Verify session validation logic
3. Check for bypass conditions

### **If Tests Pass:**
🎉 **Congratulations! Your application is properly secured.**

**Next Steps:**
1. Set up continuous security monitoring
2. Schedule regular security audits
3. Keep dependencies updated
4. Monitor security logs

---

**Remember: Security is an ongoing process. Run these tests regularly and after any changes to your authentication system.**

---

## 🚀 **QUICK START TESTING**

### **Method 1: Automated Script Testing**
```bash
# Make the script executable
chmod +x security-test.sh

# Run the comprehensive security test
./security-test.sh
```

### **Method 2: Browser-Based Testing**
1. Start your development server: `pnpm dev`
2. Navigate to: `http://localhost:3000/dashboard/security-test`
3. Click "Run All Tests"
4. Review results in both Overview and Detailed tabs

### **Method 3: Manual Command Line Testing**
```bash
# Test security headers
curl -I http://localhost:8080/api/auth/session

# Test rate limiting
for i in {1..6}; do curl -X POST http://localhost:3000/api/auth/sign-in -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong"}'; done

# Test authentication protection
curl http://localhost:3000/api/v1/dashboard/wallet
```

---

## 📋 **COMPLETE TESTING CHECKLIST**

### **✅ Pre-Testing Setup**
- [ ] Both frontend and backend servers are running
- [ ] Environment variables are properly configured
- [ ] Test credentials are available (if needed)
- [ ] Network access to both localhost:3000 and localhost:8080

### **🔒 Security Headers Tests**
- [ ] `Strict-Transport-Security` header present
- [ ] `X-Content-Type-Options: nosniff` header present
- [ ] `X-Frame-Options: DENY` header present
- [ ] `X-XSS-Protection` header present
- [ ] `Content-Security-Policy` header present
- [ ] `Referrer-Policy` header present
- [ ] Server information headers removed

### **🛡️ Authentication Tests**
- [ ] Unauthenticated users redirected from `/dashboard`
- [ ] Unauthenticated users get 401 from API endpoints
- [ ] Session validation endpoint works correctly
- [ ] Invalid session tokens are rejected
- [ ] Session expiration is enforced

### **👑 Authorization Tests**
- [ ] Non-admin users blocked from `/admin` routes
- [ ] Non-admin users get 403 from admin API endpoints
- [ ] Role-based access control working correctly
- [ ] Privilege escalation attempts blocked

### **🚫 Rate Limiting Tests**
- [ ] Authentication rate limiting (5 attempts/15 min)
- [ ] General API rate limiting (100 requests/15 min)
- [ ] Rate limit headers present in responses
- [ ] 429 status returned when limits exceeded
- [ ] Retry-After header present in rate limit responses

### **🍪 Cookie Security Tests**
- [ ] Session cookies have `HttpOnly` attribute
- [ ] Session cookies have `Secure` attribute (production)
- [ ] Session cookies have `SameSite=Strict`
- [ ] Session cookies have proper expiration
- [ ] Cookies not accessible via JavaScript

### **🔐 CSRF Protection Tests**
- [ ] POST requests without CSRF token are rejected
- [ ] CSRF tokens are generated correctly
- [ ] CSRF tokens are validated properly
- [ ] CSRF tokens expire appropriately

### **🛠️ Input Validation Tests**
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized
- [ ] Malformed JSON is handled properly
- [ ] Input length limits are enforced
- [ ] Special characters are handled safely

### **❌ Error Handling Tests**
- [ ] Generic error messages in production
- [ ] No stack traces exposed to users
- [ ] No database errors exposed
- [ ] No internal paths revealed
- [ ] Request IDs for error tracking

### **🌐 CORS Tests**
- [ ] CORS allows only specified origins
- [ ] CORS headers are properly configured
- [ ] Preflight requests handled correctly
- [ ] Credentials properly controlled

---

## 🎯 **TESTING RESULTS INTERPRETATION**

### **✅ All Tests Pass**
- Your application is properly secured
- Ready for production deployment
- Continue with regular security monitoring

### **⚠️ Some Tests Fail**
- Review failed tests immediately
- Fix security issues before deployment
- Re-run tests after fixes
- Consider additional security measures

### **❌ Many Tests Fail**
- **DO NOT DEPLOY TO PRODUCTION**
- Review security implementation
- Fix critical issues first
- Consider security audit by expert

---

## 🔧 **TROUBLESHOOTING COMMON ISSUES**

### **Security Headers Missing**
```bash
# Check if middleware is applied
grep -r "securityHeaders" apps/backend/src/

# Verify middleware order in app.ts
cat apps/backend/src/app.ts | grep -A 10 -B 10 "securityHeaders"
```

### **Rate Limiting Not Working**
```bash
# Check if rate limit middleware is applied
grep -r "rateLimit" apps/backend/src/

# Test with verbose output
curl -v http://localhost:8080/api/auth/session
```

### **Authentication Bypass**
```bash
# Check middleware configuration
cat apps/frontend/src/middleware.ts | grep -A 20 "middleware"

# Test specific routes
curl -v http://localhost:3000/dashboard
```

### **Cookie Issues**
```bash
# Check cookie configuration
grep -r "defaultCookieAttributes" apps/

# Test cookie setting
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in
cat cookies.txt
```

---

## 📊 **SECURITY TESTING METRICS**

### **Minimum Security Score**
- **90%+ tests passing**: Production ready
- **80-89% tests passing**: Needs improvement
- **<80% tests passing**: Not production ready

### **Critical Test Categories**
1. **Authentication** (Must pass 100%)
2. **Authorization** (Must pass 100%)
3. **Security Headers** (Must pass 90%+)
4. **Rate Limiting** (Must pass 80%+)
5. **Input Validation** (Must pass 90%+)

---

## 🎉 **NEXT STEPS AFTER TESTING**

### **If All Tests Pass:**
1. Set up continuous security monitoring
2. Schedule regular security audits
3. Implement security logging
4. Deploy with confidence

### **If Tests Fail:**
1. Fix critical issues immediately
2. Re-run tests after each fix
3. Document security improvements
4. Plan additional security measures

**Your security testing is now complete and comprehensive!**
