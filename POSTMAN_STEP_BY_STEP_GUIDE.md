# 🚀 Step-by-Step Guide: Running Postman Security Tests

## 📋 **PREREQUISITES**

### **1. Ensure Your Servers Are Running**
Before starting tests, make sure both servers are active:

```powershell
# In your project directory
pnpm dev
```

**Verify servers are running:**
- ✅ Frontend: `http://localhost:3000` 
- ✅ Backend: `http://localhost:8080`

### **2. Create Test User Account**
You'll need a test user for authentication tests:

1. **Go to**: `http://localhost:3000/sign-up`
2. **Create account with**:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test User`

---

## 📥 **STEP 1: IMPORT INTO POSTMAN**

### **Import Collections**
1. **Open Postman**
2. **Click "Import"** (top left corner)
3. **Select "Upload Files"**
4. **Choose these files**:
   - `SMM_Guru_Security_Tests.postman_collection.json`
   - `SMM_Guru_Advanced_Security_Tests.postman_collection.json`
   - `SMM_Guru_Security_Environment.postman_environment.json`
5. **Click "Import"**

### **Activate Environment**
1. **Click environment dropdown** (top right)
2. **Select**: "SMM Guru Security Environment"
3. **Verify variables are loaded**:
   - `frontend_url`: `http://localhost:3000`
   - `backend_url`: `http://localhost:8080`
   - `test_email`: `test@example.com`
   - `test_password`: `TestPassword123!`

---

## 🧪 **STEP 2: RUN BASIC SECURITY TESTS**

### **Start with Collection 1: Core Security Tests**

#### **Test 1.1: Authentication Security**
1. **Expand**: "SMM Guru Security Tests" collection
2. **Expand**: "1. Authentication Security" folder
3. **Click**: "1.1 Sign Up Security"
4. **Click "Send"**

**Expected Result:**
```
✅ Sign up returns proper status
✅ Response has security headers  
✅ No sensitive data in response
```

#### **Test 1.2: Sign In Security**
1. **Click**: "1.2 Sign In Security"
2. **Click "Send"**

**Expected Result:**
```
✅ Sign in successful
✅ Session cookie is HttpOnly
✅ Response contains user data
```

#### **Test 1.3: Invalid Credentials**
1. **Click**: "1.3 Invalid Credentials"
2. **Click "Send"**

**Expected Result:**
```
✅ Invalid credentials rejected
✅ Error message is generic
```

### **Test 2: Authorization Security**

#### **Test 2.1: Unauthenticated API Access**
1. **Expand**: "2. Authorization Security"
2. **Click**: "2.1 Unauthenticated API Access"
3. **Click "Send"**

**Expected Result:**
```
✅ Unauthenticated request blocked
✅ No sensitive data leaked
```

#### **Test 2.2: Admin Route Protection**
1. **Click**: "2.2 Admin Route Protection"
2. **Click "Send"**

**Expected Result:**
```
✅ Admin route protected
✅ Proper error message
```

### **Test 3: Security Headers**
1. **Expand**: "3. Security Headers"
2. **Click**: "3.1 Security Headers Validation"
3. **Click "Send"**

**Expected Result:**
```
✅ HSTS header present
✅ X-Frame-Options header present
✅ X-Content-Type-Options header present
✅ Content-Security-Policy header present
✅ Server information hidden
```

### **Test 4: Input Validation**
1. **Expand**: "4. Input Validation"
2. **Click**: "4.1 SQL Injection Protection"
3. **Click "Send"**

**Expected Result:**
```
✅ SQL injection attempt blocked
✅ No database error exposed
```

4. **Click**: "4.2 XSS Protection"
5. **Click "Send"**

**Expected Result:**
```
✅ XSS attempt handled
✅ Script tags not reflected
```

### **Test 5: Error Handling**
1. **Expand**: "5. Error Handling"
2. **Click**: "5.1 Information Disclosure Prevention"
3. **Click "Send"**

**Expected Result:**
```
✅ 404 error does not expose information
✅ Generic error message
```

---

## 🔥 **STEP 3: RUN ADVANCED SECURITY TESTS**

### **Switch to Advanced Collection**
1. **Click**: "SMM Guru Advanced Security Tests" collection

### **Test Rate Limiting**

#### **Authentication Rate Limiting Test**
1. **Expand**: "Rate Limiting Tests"
2. **Click**: "Authentication Rate Limiting"
3. **Run this test 6 times** (to trigger rate limiting):
   - Click "Send"
   - Wait 1 second
   - Click "Send" again
   - Repeat 6 times total

**Expected Results:**
- **First 5 attempts**: `✅ Request within rate limit`
- **6th attempt**: `✅ Rate limiting triggered after 5 attempts`

#### **API Rate Limiting Test**
1. **Click**: "API Rate Limiting"
2. **Click "Send"** multiple times

**Expected Result:**
```
✅ Request within general rate limit
✅ Response time is reasonable
```

### **Test API Key Security**
1. **Expand**: "API Key Security"
2. **Click**: "Backend API Without Key"
3. **Click "Send"**

**Expected Result:**
```
✅ API key required
✅ Proper error response
```

4. **Click**: "Invalid API Key"
5. **Click "Send"**

**Expected Result:**
```
✅ Invalid API key rejected
✅ No information disclosure
```

### **Test CORS Security**
1. **Expand**: "CORS Security"
2. **Click**: "CORS Configuration Test"
3. **Click "Send"**

**Expected Result:**
```
✅ CORS properly configured
✅ CORS credentials properly controlled
```

### **Test Vulnerabilities**
1. **Expand**: "Vulnerability Tests"
2. **Click**: "Large Payload Test"
3. **Click "Send"**

**Expected Result:**
```
✅ Payload size verification: Exceeds 50KB limit
✅ Enterprise payload validation: Correct HTTP status (413)
✅ Security: Payload validation before authentication
✅ Enterprise error response format
✅ No sensitive information disclosure
```

**What This Test Does:**
- **Generates**: A ~60KB JSON payload (exceeds 50KB limit)
- **Validates**: HTTP 413 "Payload Too Large" response
- **Confirms**: bodyLimit middleware executes BEFORE authentication
- **Prevents**: DoS attacks and information disclosure vulnerabilities

**Console Output to Expect:**
```
🔍 Generated payload size: 61440 bytes
🎯 Target was: 61440 bytes
📊 Exceeds 50KB limit: ✅ YES
📏 Actual payload size sent: 61440 bytes
🎯 50KB limit is: 51200 bytes
```

**Security Validation:**
- ✅ **HTTP 413** (not 401) - proves payload validation occurs first
- ✅ **Enterprise error format** - proper error structure
- ✅ **No stack traces** - no sensitive information leaked

4. **Click**: "Malformed JSON Test"
5. **Click "Send"**

**Expected Result:**
```
✅ Enterprise JSON validation: Correct HTTP status (400)
✅ Security: JSON validation before authentication
✅ Enterprise error response format
✅ No internal error details exposed
✅ No authentication information disclosure
```

**What This Test Does:**
- **Sends**: Malformed JSON payload to protected endpoint
- **Validates**: HTTP 400 "Bad Request" response (not HTTP 401)
- **Confirms**: JSON validation middleware executes BEFORE authentication
- **Prevents**: Information disclosure about protected endpoints

**Console Output to Expect:**
```
🧪 Testing Malformed JSON Security
📡 Response Status: 400
📄 Response Body: {"success":false,"error":"Invalid JSON",...}
```

**Security Validation:**
- ✅ **HTTP 400** (not 401) - proves JSON validation occurs first
- ✅ **Enterprise error format** - proper error structure
- ✅ **No authentication leaks** - no session/token information disclosed

5. **Click**: "Path Traversal Test"
6. **Click "Send"**

**Expected Result:**
```
✅ Path traversal attempt blocked
✅ No system files exposed
```

### **Test Session Security**
1. **Expand**: "Session Security"
2. **Click**: "Authentication Setup (Sign In)"
3. **Click "Send"**

**Expected Result (if user exists):**
```
✅ Authentication setup successful
✅ Sign in successful - session established
✅ Session cookies set securely
✅ Security headers present
```

**Expected Result (if user doesn't exist):**
```
✅ Authentication setup successful
✅ Authentication failure handled properly
✅ Security headers present
```

4. **Click**: "Session Validation"
5. **Click "Send"**

**Expected Result (authenticated state):**
```
✅ Session endpoint responds correctly
✅ Session response format is valid
✅ Authenticated session has valid structure
✅ No sensitive data in session response
✅ Security headers present
✅ Session cookie security (if present)
```

**Expected Result (unauthenticated state):**
```
✅ Session endpoint responds correctly
✅ Session response format is valid
✅ Unauthenticated session returns null
✅ Security headers present
```

**What This Test Does:**
- **Validates**: Session endpoint security for both auth states
- **Confirms**: Proper session structure when authenticated
- **Ensures**: Null response when unauthenticated
- **Checks**: Security headers and cookie attributes

6. **Click**: "Session Hijacking Protection"
7. **Click "Send"**

**Expected Result:**
```
✅ Session endpoint responds to fake token
✅ Fake session token rejected properly
✅ No user data leaked with fake token
✅ Security headers present
✅ No sensitive information in error response
```

**Security Validation:**
- ✅ **Session Security**: Proper handling of valid/invalid sessions
- ✅ **Hijacking Protection**: Fake tokens rejected safely
- ✅ **Data Protection**: No user information leaked

---

## 📊 **STEP 4: ANALYZE RESULTS**

### **Understanding Test Results**

#### **✅ Green Tests (PASS)**
- Security measure is working correctly
- No action needed
- Your application is secure in this area

#### **❌ Red Tests (FAIL)**
- Security vulnerability detected
- **IMMEDIATE ACTION REQUIRED**
- Review the test details and fix the issue

#### **⚠️ Yellow Tests (WARNING)**
- Potential security concern
- May need attention depending on context
- Review and decide if action is needed

### **Common Issues and Solutions**

#### **If Authentication Tests Fail:**
```
❌ Sign in successful
```
**Solution**: Check if test user exists and credentials are correct

#### **If Rate Limiting Tests Don't Trigger:**
```
❌ Rate limiting triggered after 5 attempts
```
**Solution**: Run the test more times or check rate limiting configuration

#### **If Security Headers Are Missing:**
```
❌ HSTS header present
```
**Solution**: Check security middleware configuration

---

## 🔧 **STEP 5: TROUBLESHOOTING**

### **Common Issues**

#### **Server Not Running**
**Error**: Connection refused
**Solution**: 
```powershell
# Restart your development server
pnpm dev
```

#### **Environment Variables Not Set**
**Error**: Variables showing as undefined
**Solution**:
1. Click environment dropdown
2. Select "SMM Guru Security Environment"
3. Verify all variables have values

#### **Test User Doesn't Exist**
**Error**: Authentication tests failing
**Solution**:
1. Go to `http://localhost:3000/sign-up`
2. Create user with exact credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`

#### **Tests Running Too Fast**
**Issue**: Rate limiting not triggering
**Solution**: Add delays between requests or run tests manually

---

## 📈 **STEP 6: GENERATE SECURITY REPORT**

### **Run Collection Runner**
1. **Click**: "Runner" (bottom left in Postman)
2. **Select**: "SMM Guru Security Tests"
3. **Click**: "Run SMM Guru Security Tests"
4. **Review**: Detailed results with pass/fail statistics

### **Export Results**
1. **Click**: "Export Results" in Runner
2. **Save**: Security test report
3. **Share**: With your team or for documentation

---

## 🎯 **SUCCESS CRITERIA**

### **Minimum Security Standards**
- **Authentication**: 100% pass rate
- **Authorization**: 100% pass rate  
- **Security Headers**: 80%+ pass rate
- **Input Validation**: 100% pass rate
- **Error Handling**: 100% pass rate

### **Production Ready Checklist**
- [ ] All authentication tests pass
- [ ] All authorization tests pass
- [ ] Rate limiting is working
- [ ] Security headers are present
- [ ] Input validation blocks attacks
- [ ] Error messages don't expose information
- [ ] Session security is implemented

---

## 🎉 **CONGRATULATIONS!**

If all tests pass, your SMM Guru application has:
- ✅ **Enterprise-grade security**
- ✅ **Protection against common attacks**
- ✅ **Proper authentication and authorization**
- ✅ **Secure error handling**
- ✅ **Rate limiting protection**

**Your application is ready for production deployment!**

---

## 📞 **NEED HELP?**

If you encounter issues:
1. **Check server status** first
2. **Verify environment variables**
3. **Review test user credentials**
4. **Check console for errors**
5. **Run tests one by one** to isolate issues

**Remember**: Security testing is an ongoing process. Run these tests regularly to maintain your application's security posture!
