import { SecurityTester } from "@/components/dev/security-tester";

/**
 * Security Testing Page
 * Only available in development mode
 */
export default function SecurityTestPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Security Testing</h1>
        <p className="text-muted-foreground">
          Comprehensive security testing suite for your authentication system
        </p>
      </div>
      
      <SecurityTester />
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Testing Instructions</h2>
        <div className="space-y-2 text-sm">
          <p><strong>1. Run All Tests:</strong> Click "Run All Tests" to execute the complete security test suite</p>
          <p><strong>2. Individual Tests:</strong> Click "Run" on specific test suites to test individual security areas</p>
          <p><strong>3. Review Results:</strong> Check both Overview and Detailed Results tabs</p>
          <p><strong>4. Fix Issues:</strong> Address any failed tests before deploying to production</p>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-semibold text-yellow-800 mb-1">Development Only</h3>
        <p className="text-xs text-yellow-700">
          This security testing suite is only available in development mode and will not appear in production builds.
        </p>
      </div>
    </div>
  );
}
