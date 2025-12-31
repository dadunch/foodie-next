// customers/FoodieMenuContent.tsx
'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Minus, ShoppingCart, Sparkles } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

// --- UTILITIES CACHE ---
const CACHE_DURATION = 5 * 60 * 1000; 
const cache = new Map<string, { data: any; timestamp: number }>();

const getCachedData = (key: string) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
};

const setCachedData = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
};

export default function FoodieMenuContent() {
    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cartItems, setCartItems] = useState<Record<number, number>>({});
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [merchants, setMerchants] = useState<any[]>([]);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    
    const searchInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const tableParam = searchParams.get('table');
    const focusParam = searchParams.get('focus');

    const cartCount = useMemo(() => {
        return Object.values(cartItems).reduce((a, b) => a + b, 0);
    }, [cartItems]);

    // Set client flag
    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- EFFECTS ---
    useEffect(() => {
        if (!isClient) return;

        const foodcourtId = typeof window !== 'undefined' ? sessionStorage.getItem('foodcourt_id') : null;
        
        const fetchData = async () => {
            setIsLoading(true);
            
            const cachedMenuItems = getCachedData(`menuItems_${foodcourtId}`);
            const cachedMerchants = getCachedData(`merchants_${foodcourtId}`);
            
            if (cachedMenuItems && cachedMerchants) {
                setMenuItems(cachedMenuItems);
                setMerchants(cachedMerchants);
            } else {
                try {
                    const [menuResponse, merchantResponse] = await Promise.all([
                        fetch(`/api/item?foodcourt_id=${foodcourtId}`),
                        fetch(`/api/merchant?foodcourt_id=${foodcourtId}`)
                    ]);

                    if (menuResponse.ok && merchantResponse.ok) {
                        const menuRes = await menuResponse.json();
                        const merchRes = await merchantResponse.json();
                        
                        const menuData = menuRes.data || [];
                        const merchData = merchRes.data || [];

                        setCachedData(`menuItems_${foodcourtId}`, menuData);
                        setCachedData(`merchants_${foodcourtId}`, merchData);

                        setMenuItems(menuData);
                        setMerchants(merchData);
                    }
                } catch (error) {
                    console.error('Error fetching menu:', error);
                }
            }

            if (tableParam) {
                try {
                    const cartRes = await fetch(`/api/cart?table=${tableParam}`);
                    const cartResult = await cartRes.json();
                    
                    if (cartResult.success && cartResult.items) {
                        const initialCart: Record<number, number> = {};
                        
                        cartResult.items.forEach((cartItem: any) => {
                            const itemId = cartItem.item_id;
                            const qty = Number(cartItem.jumlah);
                            
                            if (initialCart[itemId]) {
                                initialCart[itemId] += qty;
                            } else {
                                initialCart[itemId] = qty;
                            }
                        });
                        
                        setCartItems(initialCart);
                    }
                } catch (error) {
                    console.error('Error fetching cart:', error);
                }
            }

            setIsLoading(false);
        };

        fetchData();
    }, [tableParam, isClient]); 

    useEffect(() => {
        const fetchRecommendations = async () => {
            const currentItemIds = Object.keys(cartItems).map(Number);

            if (currentItemIds.length === 0) {
                setRecommendations([]);
                return;
            }

            try {
                const res = await fetch('/api/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_ids: currentItemIds })
                });
                
                const result = await res.json();
                if (result.success) {
                    setRecommendations(result.data || []);
                }
            } catch (error) {
                console.error("Gagal mengambil rekomendasi AI", error);
            }
        };

        const timeoutId = setTimeout(() => {
            if (Object.keys(cartItems).length > 0) {
                fetchRecommendations();
            } else {
                setRecommendations([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [cartItems]);

    useEffect(() => {
        if (focusParam === 'search') {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [focusParam]);

    const formatRupiah = useCallback((price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }, []);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.nama_item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.nama_merchant.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesMerchant = selectedMerchant === '' || item.nama_merchant.toString() === selectedMerchant;
            const matchesCategory = selectedCategory === 'all' ||
                (item.nama_kategori && item.nama_kategori.toLowerCase() === selectedCategory.toLowerCase());

            return matchesSearch && matchesMerchant && matchesCategory;
        });
    }, [menuItems, searchQuery, selectedMerchant, selectedCategory]);

    const handleMerchantClick = useCallback((merchantName: string) => {
        setSelectedMerchant(merchantName);
    }, []);

    const handleItemClick = useCallback((itemId: number) => {
        router.push(`/customers/${itemId}?table=${tableParam}`);
    }, [router, tableParam]);

    const handleQuantityChange = useCallback((e: React.MouseEvent, itemId: number, change: number) => {
        e.stopPropagation();

        setCartItems(prev => {
            const currentQty = prev[itemId] || 0;
            const newQty = Math.max(0, currentQty + change);
            
            if (newQty === 0) {
                const newState = { ...prev };
                delete newState[itemId];
                return newState;
            }
            return { ...prev, [itemId]: newQty };
        });
    }, []);

    const renderCard = (item: any) => {
        const qty = cartItems[item.id] || 0;
        return (
            <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`bg-white rounded-xl overflow-hidden shadow-md transition-all cursor-pointer relative group min-w-[160px] ${
                    qty > 0 ? 'ring-2 ring-green-500' : 'hover:shadow-xl'
                }`}
            >
                <div
                    className="h-40 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(/img/${item.foto_item})` }}
                >
                    {qty > 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md font-bold z-10">
                            {qty}x di keranjang
                        </div>
                    )}
                </div>
                
                <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">
                        {item.nama_item}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{item.nama_merchant}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-green-600 font-bold text-sm">
                            {formatRupiah(item.harga_item)}
                        </p>

                        {qty === 0 ? (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleItemClick(item.id);
                                }}
                                className="bg-gray-100 hover:bg-green-100 text-green-600 p-2 rounded-full transition-colors active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        ) : (
                            <div 
                                className="flex items-center bg-green-50 rounded-full border border-green-200 shadow-sm"
                                onClick={(e) => e.stopPropagation()} 
                            >
                                <button 
                                    onClick={(e) => handleQuantityChange(e, item.id, -1)}
                                    className="p-1.5 hover:bg-green-200 rounded-full text-green-700 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold text-green-700 w-6 text-center select-none">
                                    {qty}
                                </span>
                                <button 
                                    onClick={(e) => handleQuantityChange(e, item.id, 1)}
                                    className="p-1.5 hover:bg-green-200 rounded-full text-green-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="p-4 bg-white shadow-sm text-black sticky top-0 z-10">
                <div className="relative">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari makanan atau resto..."
                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-green-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all">
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
            )}

            {!isLoading && (
                <>
                    <section className="p-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Pilih Restoran</h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                onClick={() => handleMerchantClick('')}
                                className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                                    selectedMerchant === ''
                                        ? 'bg-green-500 text-white border-transparent shadow-lg'
                                        : 'bg-white text-gray-700 border-gray-200'
                                }`}
                            >
                                <p className="font-semibold whitespace-nowrap">Semua Resto</p>
                            </button>
                            {merchants.map((merchant) => (
                                <button
                                    key={merchant.nama_merchant}
                                    onClick={() => handleMerchantClick(merchant.nama_merchant.toString())}
                                    className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                                        selectedMerchant === merchant.nama_merchant.toString()
                                            ? 'bg-green-500 text-white border-transparent shadow-lg'
                                            : 'bg-white text-gray-700 border-gray-200'
                                    }`}
                                >
                                    <p className="font-semibold whitespace-nowrap">{merchant.nama_merchant}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {recommendations.length > 0 && searchQuery === '' && (
                        <section className="px-4 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
                                <h2 className="text-lg font-bold text-gray-800">
                                    Cocok dengan pesananmu
                                </h2>
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {recommendations.map((item) => renderCard(item))}
                            </div>
                            <div className="border-b border-gray-200 my-2"></div>
                        </section>
                    )}

                    <section className="p-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Makanan</h2>

                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            {['all', 'food', 'drink', 'dessert'].map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                        selectedCategory === category
                                            ? 'bg-green-500 text-white shadow-lg'
                                            : 'bg-white text-gray-700 border border-gray-200'
                                    }`}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="grid xl:grid-cols-8 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-2 xs:grid-cols-1 gap-4">
                            {filteredItems.map((item) => renderCard(item))}
                        </div>
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12 text-gray-500">Item tidak ditemukan</div>
                        )}
                    </section>
                </>
            )}

            {cartCount > 0 && (
                <button
                    onClick={() => router.push(`/customers/cart?table=${tableParam}`)}
                    className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-green-500 to-green-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40 animate-in slide-in-from-bottom-5"
                >
                    <ShoppingCart className="w-6 h-6 text-white" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {cartCount}
                    </span>
                </button>
            )}

            <BottomNav cartCount={cartCount} />

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}