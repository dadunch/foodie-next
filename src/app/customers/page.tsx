'use client'
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Home, History } from 'lucide-react';

export default function FoodieMenu() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cartCount, setCartCount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [tableInfo] = useState({ id: 1, nama_meja: 'A-01' });

    // Mock data - replace with API calls
    const [merchants] = useState([
        { id: 1, nama_merchant: 'Ayam Bu Rani', deskripsi: 'Indonesian Cuisine' },
        { id: 2, nama_merchant: 'Warung Padang', deskripsi: 'Padang Cuisine' },
        { id: 3, nama_merchant: 'Bakso Mas Eko', deskripsi: 'Meatball & Noodles' },
    ]);

    const [menuItems] = useState([
        {
        id: 1,
        nama_item: 'Ayam Katsu',
        deskripsi: 'Nasi + katsu',
        harga_item: 24000,
        foto_item: 'https://i.gojekapi.com/darkroom/gofood-indonesia/v2/images/uploads/e742f588-70bd-49df-8b46-95505b8a266b_Go-Biz_20221107_095331.jpeg?auto=format',
        nama_merchant: 'Ayam Bu Rani',
        merchant_id: 1,
        category: 'food'
        },
        {
        id: 2,
        nama_item: 'Paket Ayam Woku Lengkap',
        deskripsi: 'Nasi + Ayam Woku/Dabu2/Saus Tiram + Tahu + Tempe',
        harga_item: 24000,
        foto_item: 'https://i.gojekapi.com/darkroom/gofood-indonesia/v2/images/uploads/9242910b-d13d-4093-9782-3e118c8ab527_Go-Biz_20230320_165702.jpeg?auto=format',
        nama_merchant: 'Ayam Bu Rani',
        merchant_id: 1,
        category: 'food'
        },
        {
        id: 3,
        nama_item: 'Ikan Nila Dabu-Dabu',
        deskripsi: 'Nasi + Ikan Nila + Tahu + Tempe + Sambal',
        harga_item: 29000,
        foto_item: 'https://i.gojekapi.com/darkroom/gofood-indonesia/v2/images/uploads/7b989d97-45f6-4667-a9e4-d4f5976f0f00_Go-Biz_20230320_172239.jpeg?auto=format',
        nama_merchant: 'Ayam Bu Rani',
        merchant_id: 1,
        category: 'food'
        },
        {
        id: 4,
        nama_item: 'Es Teh Manis',
        deskripsi: 'Teh manis dingin',
        harga_item: 5000,
        foto_item: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        nama_merchant: 'Warung Padang',
        merchant_id: 2,
        category: 'drink'
        },
        {
        id: 5,
        nama_item: 'Bakso Special',
        deskripsi: 'Bakso dengan tahu, siomay, dan pangsit',
        harga_item: 18000,
        foto_item: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400',
        nama_merchant: 'Bakso Mas Eko',
        merchant_id: 3,
        category: 'food'
        },
        {
        id: 6,
        nama_item: 'Pisang Goreng',
        deskripsi: 'Pisang goreng crispy',
        harga_item: 8000,
        foto_item: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400',
        nama_merchant: 'Ayam Bu Rani',
        merchant_id: 1,
        category: 'dessert'
        }
    ]);

    const formatRupiah = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
        }).format(price);
    };

    const filtegreenItems = menuItems.filter(item => {
        const matchesSearch = item.nama_item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.nama_merchant.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMerchant = selectedMerchant === '' || item.merchant_id.toString() === selectedMerchant;
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        
        return matchesSearch && matchesMerchant && matchesCategory;
    });

    const handleSearch = () => {
        // Search is handled by filtering
    };

    const handleMerchantClick = (merchantId: string) => {
        setSelectedMerchant(merchantId);
    };

    const handleItemClick = (item : any) => {
        // In real app: navigate to detail page
        console.log('Navigate to detail:', item);
        alert(`Opening detail for: ${item.nama_item}`);
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
                key={merchant.id}
                onClick={() => handleMerchantClick(merchant.id.toString())}
                className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                    selectedMerchant === merchant.id.toString()
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
            {filtegreenItems.map((item) => (
                <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
                >
                <div
                    className="h-40 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.foto_item})` }}
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

            {filtegreenItems.length === 0 && (
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
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="flex justify-around items-center h-16">
            <button className="flex flex-col items-center gap-1 text-green-500">
                <Home className="w-5 h-5" />
                <span className="text-xs font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-500 transition-colors">
                <Search className="w-5 h-5" />
                <span className="text-xs">Search</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-500 transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                <span className="absolute top-0 right-3 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                </span>
                )}
                <span className="text-xs">Cart</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-500 transition-colors">
                <History className="w-5 h-5" />
                <span className="text-xs">History</span>
            </button>
            </div>
        </nav>

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