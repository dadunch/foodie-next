'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white flex justify-around py-3 shadow-lg z-50 border-t border-gray-200">
            <button 
                onClick={() => router.push('/customers?table=' + sessionStorage.getItem('table_url'))} 
                className={`flex flex-col items-center transition-colors p-2 ${
                    isActive('/') ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                }`}
            >
                <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span className="text-xs">Home</span>
            </button>

            <button 
                onClick={() => router.push('/search')}
                className={`flex flex-col items-center transition-colors p-2 ${
                    isActive('/search') ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                }`}
            >
                <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">Search</span>
            </button>

            <button 
                onClick={() => router.push('/customers/cart?table=' + sessionStorage.getItem('table_url'))} 
                className={`flex flex-col items-center transition-colors p-2 ${
                    isActive('/cart') ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                }`}
            >
                <div className="relative">
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    {/* Optional: Badge untuk jumlah item di cart */}
                    {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span> */}
                </div>
                <span className="text-xs">Cart</span>
            </button>

            <button 
                onClick={() => router.push('/customers/history?table=' + sessionStorage.getItem('table_url'))} 
                className={`flex flex-col items-center transition-colors p-2 ${
                    isActive('/history') ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                }`}
            >
                <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">History</span>
            </button>
        </div>
    );
}