"use client";

import React, { useState, useEffect } from 'react';
import { History, X, MapPin } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// Mock Login Modal Component
const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Attempting login with:', username, password);
        alert('Login attempted. Replace this with real authentication logic.');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-[100]">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-gray-800">Login Karyawan</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-md"
                    >
                        Masuk
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Header() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [itemData, setItemData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tableInfo, setTableInfo] = useState({
        nama_meja: 'Loading...',
        nama_foodcourt: 'Loading...',
        alamat: '',
        id: '',
    });

    // Decode Base64 table parameter
    const decodeTableId = (encodedId: string | null): string | null => {
        if (!encodedId) return null;
        try {
            return atob(encodedId);
        } catch (error) {
            console.error('Failed to decode table ID:', error);
            return null;
        }
    };

    // Fetch table data
    useEffect(() => {
        const fetchItemData = async () => {
        try {
            const encodedIda = searchParams.get('table');
            if (!encodedIda) {
            router.push('/');
            return;
            }
    
            // 🔓 decode
            const step3 = atob(encodedIda).replace('_order', '');
            const step2 = atob(step3).replace('_restaurant', '');
            const step1 = atob(step2).replace('_foodie', '');
            const decodedTableId = Number(atob(step1));
    
            if (!decodedTableId) {
            router.push('/');
            return;
            }
    
            // 🔑 cache key
            const cacheKey = `table_${decodedTableId}`;
    
            // 🟢 CEK CACHE
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
            const data = JSON.parse(cachedData);
    
            setItemData(data);
            setTableInfo({
                nama_meja: data.nama_meja,
                nama_foodcourt: data.nama_foodcourt,
                alamat: data.alamat,
                id: data.id,
            });
    
            setLoading(false);
            return; 
            }
    
            const response = await fetch(`/api/tables/${decodedTableId}`);
            const result = await response.json();
    
            if (result.success) {
            setItemData(result.data);
            setTableInfo({
                nama_meja: result.data.nama_meja,
                nama_foodcourt: result.data.nama_foodcourt,
                alamat: result.data.alamat,
                id: result.data.id,
            });
    
            // 💾 SIMPAN KE CACHE
            sessionStorage.setItem(
                cacheKey,
                JSON.stringify(result.data)
            );
            sessionStorage.setItem('foodcourt_id', result.data.foodcourt_id);
            sessionStorage.setItem('meja_id', result.data.id);
            sessionStorage.setItem('table_name', result.data.nama_meja);
            sessionStorage.setItem('table_url', encodedIda);
            
            } else {
            Swal.fire({
                title: 'Error!',
                text: 'Meja tidak ditemukan',
                icon: 'error',
                confirmButtonColor: '#50C878',
            }).then(() => router.push('/'));
            }
        } catch (error) {
            Swal.fire({
            title: 'Error!',
            text: 'Gagal mengambil data meja',
            icon: 'error',
            confirmButtonColor: '#50C878',
            }).then(() => router.push('/'));
        } finally {
            setLoading(false);
        }
        };
    
        fetchItemData();
    }, [searchParams, router]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            setIsLoggedIn(false);
            console.log("Logged out successfully.");
        }
    };
    
    const handleHistoryClick = () => {
        alert('Navigating to Order History...');
    };

    console.log('Rendering Navbar - tableInfo:', tableInfo);

    return (
        <>
            <header className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-auto py-3 sm:py-0 sm:h-16">
                        {/* Logo and Info Section */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <img
                                src="/logo/LogoFoodie.png"
                                alt="Foodie Logo"
                                className="w-20 h-20 sm:w-30 sm:h-30 object-contain flex-shrink-0"
                            />
                            
                            <div className="flex flex-col min-w-0 flex-1">
                                {/* Foodcourt Name - Always visible */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                                    <h1 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                                        {loading ? 'Loading...' : tableInfo.nama_foodcourt}
                                    </h1>
                                </div>
                                
                                {/* Table Info and Address */}
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                    <span className="font-semibold text-green-600">
                                        {loading ? '...' : tableInfo.nama_meja}
                                    </span>
                                    {!loading && tableInfo.alamat && (
                                        <>
                                            <span className="hidden sm:inline text-gray-400">•</span>
                                            <span className="hidden md:inline truncate">
                                                {tableInfo.alamat}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions: History and Auth */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                            <button 
                                onClick={handleHistoryClick}
                                aria-label="View Order History"
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <History className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            </button>
                            
                            {isLoggedIn ? (
                                <button 
                                    onClick={handleLogout}
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                                >
                                    Logout
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setShowLoginModal(true)}
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Login Modal */}
            {showLoginModal && (
                <LoginModal onClose={() => setShowLoginModal(false)} />
            )}
        </>
    );
}