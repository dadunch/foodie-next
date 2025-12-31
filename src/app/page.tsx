// page.tsx
import { Suspense } from 'react';
import QRScannerContent from './QRScannerContent';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

// Loading component for Suspense fallback
function QRScannerLoading() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        </div>
    );
}

// Main export with Suspense wrapper
export default function QRScannerPage() {
    return (
        <Suspense fallback={<QRScannerLoading />}>
            <QRScannerContent />
        </Suspense>
    );
}