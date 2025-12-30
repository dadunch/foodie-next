'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import BottomNav from '@/components/BottomNav';

export default function CartPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const table = searchParams.get('table');
    const mejaName = sessionStorage.getItem('table_name') || 'Table 21';

    
    const [cartItems, setCartItems] = useState<{ 
        id: number; 
        harga: number; 
        nama_item: string; 
        jumlah: number; 
        toppings?: { id: number; nama_toping: string; harga: number }[]; 
        catatan?: string; 
        [key: string]: any 
    }[]>([]);
    const [tableInfo, setTableInfo] = useState(null);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [cartAlreadyOrdered, setCartAlreadyOrdered] = useState(false);

    // Fetch cart data
    useEffect(() => {
        if (table) {
            fetchCartData();
        }
    }, [table]);

    const fetchCartData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/cart?table=${table}`);
            const data = await response.json();
            
            if (data.success) {
                setCartItems(data.items || []);
                setTableInfo(data.tableInfo);
                
                // Cek status cart jika ada items
                if (data.items && data.items.length > 0 && data.items[0]?.cart_id) {
                    await checkCartStatus(data.items[0].cart_id);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch cart');
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Gagal memuat data keranjang',
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const checkCartStatus = async (cartId: number) => {
        try {
            const response = await fetch(`/api/cart/cek_status_cart/${cartId}`);
            const data = await response.json();
            
            // Jika ada data, berarti cart sudah diproses/dipesan
            if (data.success && data.data) {
                setCartAlreadyOrdered(true);
            }
        } catch (error) {
            console.error('Error checking cart status:', error);
            // Jika error, assume cart belum diproses (biar user bisa lanjut)
        }
    };

    const handleCreateNewCart = async () => {
        const result = await Swal.fire({
            title: 'Buat Keranjang Baru?',
            text: 'Anda akan membuat keranjang baru untuk memesan lagi.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Buat Baru!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            // Redirect ke halaman home untuk mulai order baru
            router.push(`/customers/?table=${table}`);
        }
    };

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
        const total = item.totalHarga
            ? Number(item.totalHarga)
            : Number(item.harga) * Number(item.jumlah);
        return sum + total;
    }, 0);
    const tax = subtotal * 0.12;
    const grandTotal = subtotal + tax;

    // Format currency
    const formatRupiah = (amount: number | bigint) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Handle delete item
    const handleDeleteItem = async (cartId: any, itemId: any, itemName: any) => {
        const result = await Swal.fire({
            title: 'Hapus Item?',
            text: `Apakah Anda yakin ingin menghapus "${itemName}" dari keranjang?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/cart?cart_item_id=${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (data.success === true || data.status === 'success') {
                    Swal.fire({
                        title: 'Berhasil!',
                        text: data.message || 'Item berhasil dihapus.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    fetchCartData();
                } else {
                    throw new Error(data.message || 'Gagal menghapus item');
                }
            } catch (error) {
                Swal.fire({
                    title: 'Gagal!',
                    text: 'Item gagal dihapus dari keranjang.',
                    icon: 'error'
                });
            }
        }
    };

    // Handle proceed to payment
    const handleProceedToPayment = async () => {
        if (cartItems.length === 0) {
            Swal.fire({
                title: 'Keranjang Kosong!',
                text: 'Tambahkan item terlebih dahulu.',
                icon: 'warning'
            });
            return;
        }

        try {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cartId: cartItems[0]?.cart_id,
                    catatan: additionalNotes,
                    nominalBayar: grandTotal,
                    device_id : localStorage.getItem('device_id') || ''
                })
                
            });

            const data = await response.json();

            if (data.success) {
                router.push(`/customers/checkout?table=${table}`);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            Swal.fire({
                title: 'Gagal!',
                text: 'Order gagal dibuat.',
                icon: 'error'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Tampilan jika cart sudah diproses
    if (cartAlreadyOrdered) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push(`/?table=${table}`)}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h1 className="text-2xl font-bold">Keranjang</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Meja:</span>
                                <span className="font-semibold text-green-500">{mejaName || '-'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 py-6">
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        {/* Icon */}
                        <div className="mb-6">
                            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Text */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Pesanan Sudah Diproses</h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Keranjang ini sudah diproses menjadi pesanan. Anda dapat melihat status pesanan di halaman riwayat atau membuat pesanan baru.
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                            <button
                                onClick={() => router.push(`/customers/history?table=${table}`)}
                                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Lihat Riwayat Pesanan
                            </button>
                            <button
                                onClick={handleCreateNewCart}
                                className="flex-1 bg-white text-green-500 border-2 border-green-500 py-3 px-6 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Buat Pesanan Baru
                            </button>
                        </div>
                    </div>
                </main>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push(`/?table=${table}`)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold">Keranjang</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Meja:</span>
                            <span className="font-semibold text-green-500">{mejaName || '-'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Order Type */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <h2 className="text-lg font-semibold">
                        Tipe Order: <span className="text-green-500">Dine In</span>
                    </h2>
                </div>

                {cartItems.length > 0 ? (
                    <div>
                        {/* Cart Items */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Item Pesanan</h2>
                            <div className="space-y-3">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                {/* Header Item */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                                                        {item.jumlah}x
                                                    </span>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 text-base">{item.nama_item}</h4>
                                                        <p className="text-sm text-gray-500 mt-0.5">{formatRupiah(item.harga)} /item</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Toppings */}
                                                {item.toppings && item.toppings.length > 0 && (
                                                    <div className="ml-2 pl-4 border-l-2 border-green-200 mb-3">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Topping</p>
                                                        <div className="space-y-1.5">
                                                            {item.toppings.map((topping) => (
                                                                <div key={topping.id} className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-700">• {topping.nama_toping}</span>
                                                                    <span className="text-green-600 font-medium">+{formatRupiah(topping.harga)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                    
                                                {/* Catatan */}
                                                {item.catatan && (
                                                    <div className="ml-2 pl-4 border-l-2 border-amber-200 bg-amber-50 -ml-2 p-3 rounded-r-lg">
                                                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Catatan</p>
                                                        <p className="text-sm text-gray-700 italic">{item.catatan}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Total & Delete Button */}
                                            <div className="flex flex-col items-end gap-3">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 mb-1">Total</p>
                                                    <span className="font-bold text-xl text-gray-900">
                                                        {formatRupiah(item.totalHarga)}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.cart_id, item.id, item.nama_item)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                                                    title="Hapus item"
                                                >
                                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Catatan Tambahan</h2>
                            <textarea
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                placeholder="Tambahkan catatan untuk seluruh pesanan..."
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={4}
                            />
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>PPN (12%)</span>
                                    <span>{formatRupiah(tax)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold pt-3 border-t">
                                    <span>Total</span>
                                    <span className="text-green-500">{formatRupiah(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push(`/customers/?table=${table}`)}
                                className="flex-1 bg-white text-green-500 border-2 border-green-500 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                            >
                                Tambah Jajanan
                            </button>
                            <button
                                type="button"
                                onClick={handleProceedToPayment}
                                className="flex-1 bg-green-500 text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                            >
                                Lanjut ke Pembayaran
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-600 mb-2">Keranjang Kosong</h2>
                        <p className="text-gray-500 mb-6">Tambahkan menu favorit Anda!</p>
                        <button
                            onClick={() => router.push(`/customers/?table=${table}`)}
                            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                        >
                            Mulai Belanja
                        </button>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}