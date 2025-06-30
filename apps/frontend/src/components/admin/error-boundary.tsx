"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Admin Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const resetError = () => {
        this.setState({ hasError: false, error: undefined });
      };

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/admin");
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred while loading this section of the admin panel.
            </p>
            
            {process.env.NODE_ENV === "development" && (
              <details className="text-left bg-muted p-3 rounded-md mb-4">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                  {error.message}
                  {error.stack && (
                    <>
                      {"\n\nStack trace:\n"}
                      {error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={resetError} 
              className="flex-1 gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={handleGoHome} 
              variant="outline" 
              className="flex-1 gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          <Button 
            onClick={handleReload} 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
          >
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook for using error boundary in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export { ErrorBoundaryClass as ErrorBoundary };
export default ErrorBoundaryClass;
