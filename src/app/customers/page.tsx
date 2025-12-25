'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, Home, History } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
// import { useParams, useRouter } from 'next/navigation';



export default function FoodieMenu() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cartCount, setCartCount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    // const [tableInfo] = useState({ id: 1, nama_meja: 'A-01' });
    const router = useRouter();

    const searchParams = useSearchParams();
    const tableParam = searchParams.get('table');

    
    const [merchants, setmerchants] = useState<any[]>([]);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    
    useEffect(() => {
        const foodcourtId = sessionStorage.getItem('foodcourt_id');
        const fetchMenuItems = async () => {
            try {
                const response = await fetch(`/api/item?foodcourt_id=${foodcourtId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch menu items');
                }
                const result = await response.json();
                setMenuItems(result.data ?? []);
            } catch (error) {
            console.error('Error fetching menu items:', error);
            }
        };
        fetchMenuItems();

        const fetchMerchants = async () => {
            try {
            const response = await fetch('/api/merchant?foodcourt_id=' + foodcourtId);
            if (!response.ok) {
                throw new Error('Failed to fetch merchants');
            }
            const result = await response.json();
            setmerchants(result.data ?? []);
            }
            catch (error) {
            console.error('Error fetching merchants:', error);
            }
        };
        fetchMerchants();


    }, []);

    const formatRupiah = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
        }).format(price);
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.nama_item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.nama_merchant.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMerchant = selectedMerchant === '' || item.nama_merchant.toString() === selectedMerchant;
        const matchesCategory = selectedCategory === 'all' || 
                            (item.nama_kategori && item.nama_kategori.toLowerCase() === selectedCategory.toLowerCase());
        
        return matchesSearch && matchesMerchant && matchesCategory;
    });

    const handleSearch = () => {
        // Search is handled by filtering
    };

    const handleMerchantClick = (merchantName: string) => {
        setSelectedMerchant(merchantName);
    };

    const handleItemClick = (item : any) => {
        //customers/id
        // router.push(`/customers/${item.id}?table=${useParams.table}`);
        router.push(`/customers/${item.id}?table=${tableParam}`);
    };

    const handleLogin = () => {
        if (loginEmail && loginPassword) {
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        alert('Login successful!');
        } else {
        alert('Please fill in all fields');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        alert('Logged out successfully');
    };

    useEffect(() => {
        // Load cart count from storage or API
        const savedCartCount = 0; // Replace with actual cart logic
        setCartCount(savedCartCount);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

        {/* Search Bar */}
        <div className="p-4 bg-white shadow-sm text-black">
            <div className="relative">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for food or restaurant..."
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-green-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
                <Search className="w-5 h-5" />
            </button>
            </div>
        </div>

        {/* Restaurants Section */}
        <section className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Choose a Restaurant</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
                onClick={() => handleMerchantClick('')}
                className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                selectedMerchant === ''
                    ? 'bg-gradient-to-br from-green-600 to-green-400 text-white border-transparent shadow-lg'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
                }`}
            >
                <p className="font-semibold whitespace-nowrap">All Restaurants</p>
                <p className="text-xs opacity-80">Show all items</p>
            </button>
            {merchants.map((merchant) => (
                <button
                key={merchant.nama_merchant}
                onClick={() => handleMerchantClick(merchant.nama_merchant.toString())}
                className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                    selectedMerchant === merchant.nama_merchant.toString()
                    ? 'bg-gradient-to-br from-green-600 to-green-400  text-white border-transparent shadow-lg'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
                }`}
                >
                <p className="font-semibold whitespace-nowrap">{merchant.nama_merchant}</p>
                <p className="text-xs opacity-80">{merchant.deskripsi}</p>
                </button>
            ))}
            </div>
        </section>

        {/* Menu Section */}
        <section className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Menu Items</h2>
            
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {['all', 'food', 'drink', 'dessert'].map((category) => (
                <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                    ? 'bg-gradient-to-br from-green-500 to-green-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
                }`}
                >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
            ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid xl:grid-cols-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-2 xs:grid-cols-1 gap-4">
            {filteredItems.map((item) => (
                <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                >
                <div
                    className="h-40 bg-cover bg-center"
                    style={{ backgroundImage: `url(/img/${item.foto_item})` }}
                />
                <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                    {item.nama_item}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{item.nama_merchant}</p>
                    <p className="text-green-600 font-bold text-sm">
                    {formatRupiah(item.harga_item)}
                    </p>
                </div>
                </div>
            ))}
            </div>

            {filteredItems.length === 0 && (
            <div className="text-center py-12">
                <p className="text-gray-500">No items found</p>
            </div>
            )}
        </section>

        {/* Floating Cart Button */}
        {cartCount > 0 && (
            <button
            onClick={() => alert('Navigate to cart')}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-green-500 to-green-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40"
            >
            <ShoppingCart className="w-6 h-6 text-white" />
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
            </span>
            </button>
        )}

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Login Modal */}
        {showLoginModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Login Pengunjung</h2>
                <button
                    onClick={() => setShowLoginModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                    ×
                </button>
                </div>
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                    </label>
                    <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                    </label>
                    <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                    Close
                    </button>
                    <button
                    onClick={handleLogin}
                    className="flex-1 px-4 py-2 bg-gradient-to-br from-green-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                    Login
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}

        <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
            display: none;
            }
            .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
            }
            .line-clamp-1 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            }
        `}</style>
        </div>
    );
    }