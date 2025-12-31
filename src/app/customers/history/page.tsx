// history/page.tsx
import { Suspense } from 'react';
import HistoryContent from './HistoryContent';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

// Loading component for Suspense fallback
function HistoryLoading() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Memuat riwayat pesanan...</p>
            </div>
        </div>
    );
}

// Main export with Suspense wrapper
export default function HistoryPage() {
    return (
        <Suspense fallback={<HistoryLoading />}>
            <HistoryContent />
        </Suspense>
    );
}