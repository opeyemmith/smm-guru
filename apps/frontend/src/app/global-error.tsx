"use client";

import { P } from "@/components/global/p";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-2xl w-full mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {error.name || "Something went wrong!"}
          </h2>
          <P className="text-gray-600 mb-4">
            We apologize for the inconvenience. The error details are:
          </P>
          <pre className="bg-gray-100 p-4 md:p-6 rounded-md my-4 overflow-auto text-sm">
            {error.message}
            {error.digest && (
              <small className="block mt-2 text-gray-600">
                Error ID: {error.digest}
              </small>
            )}
          </pre>
          <Button onClick={() => reset()} className="w-full md:w-auto">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
