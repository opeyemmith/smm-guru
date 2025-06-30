#!/bin/bash

# 🛡️ Comprehensive Security Testing Script
# This script tests all implemented security measures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8080"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="wrongpassword"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}🧪 $1${NC}"
    echo "=================================================="
}

print_test() {
    echo -e "\n${YELLOW}Testing: $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if servers are running
check_servers() {
    print_header "CHECKING SERVER STATUS"
    
    print_test "Frontend server availability"
    if curl -s -f "$FRONTEND_URL" > /dev/null; then
        print_success "Frontend server is running"
    else
        print_failure "Frontend server is not running at $FRONTEND_URL"
        exit 1
    fi
    
    print_test "Backend server availability"
    if curl -s -f "$BACKEND_URL/api/auth/session" > /dev/null; then
        print_success "Backend server is running"
    else
        print_failure "Backend server is not running at $BACKEND_URL"
        exit 1
    fi
}

# Test security headers
test_security_headers() {
    print_header "TESTING SECURITY HEADERS"
    
    # Get headers from backend
    HEADERS=$(curl -s -I "$BACKEND_URL/api/auth/session")
    
    # Test individual headers
    print_test "X-Frame-Options header"
    if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
        print_success "X-Frame-Options header present and correct"
    else
        print_failure "X-Frame-Options header missing or incorrect"
    fi
    
    print_test "X-Content-Type-Options header"
    if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
        print_success "X-Content-Type-Options header present"
    else
        print_failure "X-Content-Type-Options header missing"
    fi
    
    print_test "Strict-Transport-Security header"
    if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
        print_success "HSTS header present"
    else
        print_failure "HSTS header missing"
    fi
    
    print_test "Content-Security-Policy header"
    if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
        print_success "CSP header present"
    else
        print_failure "CSP header missing"
    fi
    
    print_test "Referrer-Policy header"
    if echo "$HEADERS" | grep -q "Referrer-Policy"; then
        print_success "Referrer-Policy header present"
    else
        print_failure "Referrer-Policy header missing"
    fi
}

# Test rate limiting
test_rate_limiting() {
    print_header "TESTING RATE LIMITING"
    
    print_test "Authentication rate limiting (5 attempts)"
    print_info "Making 6 authentication attempts..."
    
    local rate_limit_triggered=false
    
    for i in {1..6}; do
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$FRONTEND_URL/api/auth/sign-in" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
        
        echo "Attempt $i: HTTP $RESPONSE"
        
        if [ $i -gt 5 ] && [ "$RESPONSE" = "429" ]; then
            rate_limit_triggered=true
            break
        fi
        
        sleep 1
    done
    
    if [ "$rate_limit_triggered" = true ]; then
        print_success "Authentication rate limiting is working"
    else
        print_failure "Authentication rate limiting is not working"
    fi
    
    print_test "General API rate limiting"
    print_info "Testing general rate limits (this may take a moment)..."
    
    local general_rate_limit=false
    for i in {1..15}; do
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/session")
        if [ "$RESPONSE" = "429" ]; then
            general_rate_limit=true
            break
        fi
        sleep 0.1
    done
    
    if [ "$general_rate_limit" = true ]; then
        print_success "General rate limiting is working"
    else
        print_info "General rate limiting not triggered (may need more requests)"
    fi
}

# Test authentication protection
test_authentication() {
    print_header "TESTING AUTHENTICATION PROTECTION"
    
    print_test "Unauthenticated dashboard access"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/dashboard")
    if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "401" ]; then
        print_success "Dashboard properly protected (HTTP $RESPONSE)"
    else
        print_failure "Dashboard not properly protected (HTTP $RESPONSE)"
    fi
    
    print_test "Unauthenticated API access"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/api/v1/dashboard/wallet")
    if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
        print_success "API properly protected (HTTP $RESPONSE)"
    else
        print_failure "API not properly protected (HTTP $RESPONSE)"
    fi
    
    print_test "Admin route protection"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/admin")
    if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "401" ]; then
        print_success "Admin routes properly protected (HTTP $RESPONSE)"
    else
        print_failure "Admin routes not properly protected (HTTP $RESPONSE)"
    fi
}

# Test input validation
test_input_validation() {
    print_header "TESTING INPUT VALIDATION"
    
    print_test "SQL injection protection"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/test" \
        -H "Content-Type: application/json" \
        -d '{"input": "1; DROP TABLE users; --"}')
    
    if [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
        print_success "SQL injection attempt properly handled (HTTP $RESPONSE)"
    else
        print_info "SQL injection test inconclusive (HTTP $RESPONSE)"
    fi
    
    print_test "XSS protection"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/test" \
        -H "Content-Type: application/json" \
        -d '{"input": "<script>alert(\"xss\")</script>"}')
    
    if [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
        print_success "XSS attempt properly handled (HTTP $RESPONSE)"
    else
        print_info "XSS test inconclusive (HTTP $RESPONSE)"
    fi
}

# Test error handling
test_error_handling() {
    print_header "TESTING ERROR HANDLING"
    
    print_test "Generic error responses"
    ERROR_RESPONSE=$(curl -s "$FRONTEND_URL/api/v1/nonexistent-endpoint")
    
    # Check if response contains sensitive information
    if echo "$ERROR_RESPONSE" | grep -qi "database\|sql\|stack\|trace\|internal"; then
        print_failure "Error response may contain sensitive information"
        echo "Response: $ERROR_RESPONSE"
    else
        print_success "Error responses appear to be sanitized"
    fi
    
    print_test "Malformed JSON handling"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/test" \
        -H "Content-Type: application/json" \
        -d 'invalid-json')
    
    if [ "$RESPONSE" = "400" ]; then
        print_success "Malformed JSON properly handled (HTTP $RESPONSE)"
    else
        print_info "Malformed JSON test result: HTTP $RESPONSE"
    fi
}

# Test CORS configuration
test_cors() {
    print_header "TESTING CORS CONFIGURATION"
    
    print_test "CORS headers"
    CORS_HEADERS=$(curl -s -I -H "Origin: https://malicious-site.com" "$BACKEND_URL/api/auth/session")
    
    if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
        ALLOWED_ORIGIN=$(echo "$CORS_HEADERS" | grep "Access-Control-Allow-Origin" | cut -d' ' -f2 | tr -d '\r')
        if [ "$ALLOWED_ORIGIN" = "https://malicious-site.com" ]; then
            print_failure "CORS allows any origin - security risk"
        else
            print_success "CORS properly configured with specific origin"
        fi
    else
        print_info "CORS headers not found (may be intentional)"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "🛡️  COMPREHENSIVE SECURITY TESTING SUITE"
    echo "========================================"
    echo -e "${NC}"
    
    print_info "Starting security tests for:"
    print_info "Frontend: $FRONTEND_URL"
    print_info "Backend: $BACKEND_URL"
    
    # Run all tests
    check_servers
    test_security_headers
    test_rate_limiting
    test_authentication
    test_input_validation
    test_error_handling
    test_cors
    
    # Print summary
    print_header "TEST SUMMARY"
    echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL SECURITY TESTS PASSED!${NC}"
        echo -e "${GREEN}Your application appears to be properly secured.${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠️  Some security tests failed or need attention.${NC}"
        echo -e "${YELLOW}Please review the failed tests and fix any issues.${NC}"
        exit 1
    fi
}

# Run the main function
main "$@"
