// customers/page.tsx
import { Suspense } from 'react';
import FoodieMenuContent from './FoodieMenuContent';

// Force dynamic rendering untuk mencegah error saat build (static generation)
// karena penggunaan useSearchParams di level client
export const dynamic = 'force-dynamic';

// Komponen Loading sebagai fallback saat Suspense aktif
function FoodieMenuLoading() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat menu lezat...</p>
            </div>
        </div>
    );
}

// Export default sebagai Page utama
export default function FoodieMenuPage() {
    return (
        <Suspense fallback={<FoodieMenuLoading />}>
            <FoodieMenuContent />
        </Suspense>
    );
}