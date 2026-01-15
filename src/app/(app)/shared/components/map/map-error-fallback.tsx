'use client';

type MapErrorFallbackProps = {
  error: string;
};

export function MapErrorFallback({ error }: MapErrorFallbackProps) {
  const isWebGLError = error.toLowerCase().includes('webgl');

  return (
    <div className="flex size-full items-center justify-center bg-gray-50">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 013.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>

        <h3 className="mb-3 text-xl font-semibold text-gray-900">
          Interactive Map Unavailable
        </h3>

        {isWebGLError ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              Your device or browser doesn&apos;t support the technology needed
              to display interactive maps (WebGL).
            </p>
            <div className="mb-4 rounded-md bg-blue-50 p-4 text-left">
              <p className="mb-2 text-xs font-medium text-blue-900">
                This might be because:
              </p>
              <ul className="space-y-1 text-xs text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your device is in Low Power Mode</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Hardware acceleration is disabled</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your browser has WebGL turned off</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <p className="mb-4 text-sm leading-relaxed text-gray-600">
            We&apos;re having trouble loading the interactive map right now.
          </p>
        )}

        <div className="rounded-md bg-green-50 p-4">
          <div className="flex items-start">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-green-900">
                Don&apos;t worry!
              </p>
              <p className="mt-1 text-xs text-green-700">
                All locations and addresses are still visible in the results
                list below. You can view each resource&apos;s address details by
                clicking on them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
