// checkout/page.tsx
import { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

// Loading component for Suspense fallback
function CheckoutLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        </div>
    );
}

// Main export with Suspense wrapper
export default function CheckoutPage() {
    return (
        <Suspense fallback={<CheckoutLoading />}>
            <CheckoutContent />
        </Suspense>
    );
}