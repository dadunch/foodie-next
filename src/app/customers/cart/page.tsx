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

    
    const [cartItems, setCartItems] = useState<{ id: number; harga: number; [key: string]: any }[]>([]);
    const [tableInfo, setTableInfo] = useState(null);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [loading, setLoading] = useState(true);

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

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.harga, 0);
    const tax = subtotal * 0.1;
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
                const response = await fetch('/api/cart/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ cartId, itemId })
                });

                const data = await response.json();

                if (data.success) {
                    Swal.fire({
                        title: 'Berhasil!',
                        text: 'Item berhasil dihapus dari keranjang.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    fetchCartData(); // Refresh cart
                } else {
                    throw new Error(data.message);
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
            const response = await fetch('/api/order/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cartId: cartItems[0]?.cart_id,
                    catatan: additionalNotes,
                    nominalBayar: grandTotal
                })
            });

            const data = await response.json();

            if (data.success) {
                router.push(`/checkout?table=${table}`);
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
                                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-green-500">
                                                        {item.jumlah}x
                                                    </span>
                                                    <span className="font-medium">{item.nama_item}</span>
                                                </div>
                                                
                                                {/* Toppings */}
                                                {item.toppings && item.toppings.length > 0 && (
                                                    <div className="ml-6 mb-2">
                                                        <p className="text-sm font-medium text-gray-600 mb-1">Topping:</p>
                                                        {item.toppings.map((topping) => (
                                                            <div key={topping.id} className="flex items-center justify-between text-sm text-gray-600">
                                                                <span>• {topping.nama_toping}</span>
                                                                <span className="text-gray-500">+{formatRupiah(topping.harga)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Catatan */}
                                                {item.catatan && (
                                                    <div className="ml-6 flex items-start gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Catatan:</span>
                                                        <span>{item.catatan}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <span className="font-semibold text-lg whitespace-nowrap">
                                                    {formatRupiah(item.harga)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.cart_id, item.id, item.nama_item)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    <span>Pajak (10%)</span>
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
                                onClick={() => router.push(`/?table=${table}`)}
                                className="flex-1 bg-white text-green-500 border-2 border-green-500 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                            >
                                Tambah Item
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
                            onClick={() => router.push(`/?table=${table}`)}
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