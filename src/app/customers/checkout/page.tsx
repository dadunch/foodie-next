'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import BottomNav from '@/components/BottomNav';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const table = searchParams.get('table');
    const [mejaName, setMejaName] = useState('Table 21');

    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [showCartModal, setShowCartModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeData, setQRCodeData] = useState<string>('');

    const [checkoutData, setCartItems] = useState<{ 
        id: number; 
        harga: number; 
        nama_item: string; 
        jumlah: number; 
        totalHarga: number;
        foto_item?: string;
        toppings?: { id: number; nama_toping: string; harga: number }[]; 
        catatan?: string; 
        [key: string]: any 
    }[]>([]);

    const [tableInfo, setTableInfo] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setMejaName(sessionStorage.getItem('table_name') || 'Table 21');
        }
    }, []);

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

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const subtotal = checkoutData.reduce((sum, item) => sum + Number(item.totalHarga || 0), 0);
    const serviceCharge = subtotal * 0.02;
    const grandTotal = subtotal + serviceCharge;

    const getPaymentMethodId = (method: string) => {
        const methodMap: { [key: string]: number } = {
            'CASH': 1,
            'Qris': 2
        };
        return methodMap[method] || 1;
    };

    const handlePayment = async () => {
        setShowConfirmModal(false);
        setShowProcessingModal(true);

        try {
            // Ambil device_id dari localStorage
            const deviceId = typeof window !== 'undefined' ? localStorage.getItem('device_id') : '';

            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    table_id: table,
                    nominal_bayar: grandTotal,
                    metode_pembayaran_id: getPaymentMethodId(paymentMethod),
                    device_id: deviceId
                })
            });

            const data = await response.json();

            setShowProcessingModal(false);

            if (data.success) {
                // Jika QRIS, tampilkan QR Code modal
                if (paymentMethod === 'Qris' && data.qr_code_base64) {
                    setQRCodeData(data.qr_code_base64);
                    setShowQRModal(true);
                } else {
                    // Jika CASH, tampilkan pesan
                    await Swal.fire({
                        title: 'Pembayaran Berhasil Dibuat!',
                        text: data.message || 'Silakan membayar di kasir',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#10b981'
                    });
                    
                    router.push(`/customers/history?table=${table}`);
                }
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setShowProcessingModal(false);
            Swal.fire({
                title: 'Pembayaran Gagal!',
                text: 'Terjadi kesalahan saat memproses pembayaran.',
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
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold">Checkout</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Meja:</span>
                            <span className="font-semibold text-green-500">{mejaName}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Payment Methods */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 content-center">
                        {/* CASH */}
                        <label 
                            className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${
                                paymentMethod === 'CASH' 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-gray-200 hover:border-green-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="payment-method"
                                value="CASH"
                                checked={paymentMethod === 'CASH'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="sr-only"
                            />
                            <img src="/logo/cash.svg" alt="Cash" className="w-16 h-16 mb-3 object-contain" />
                            <span className="font-semibold text-gray-800">Cash</span>
                            {paymentMethod === 'CASH' && (
                                <div className="absolute top-3 right-3 text-green-500">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </label>

                        {/* Qris */}
                        <label 
                            className={`relative flex flex-col items-center p-6 border-2 rounded-xl cursor-pointer transition-all ${
                                paymentMethod === 'Qris' 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-gray-200 hover:border-green-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="payment-method"
                                value="Qris"
                                checked={paymentMethod === 'Qris'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="sr-only"
                            />
                            <img src="/logo/qris.webp" alt="Qris" className="w-16 h-16 mb-3 object-contain" />
                            <span className="font-semibold text-gray-800">Qris</span>
                            {paymentMethod === 'Qris' && (
                                <div className="absolute top-3 right-3 text-green-500">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center text-gray-700">
                            <span>{checkoutData?.length || 0} produk di keranjang</span>
                            <button
                                onClick={() => setShowCartModal(true)}
                                className="text-green-500 hover:text-green-600 font-medium text-sm"
                            >
                                Lihat Keranjang
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3 border-t pt-3">
                        <div className="flex justify-between text-gray-700">
                            <span>Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Biaya Layanan (2%)</span>
                            <span>{formatRupiah(serviceCharge)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-3 border-t">
                            <span>Total</span>
                            <span className="text-green-500">{formatRupiah(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Pay Now Button */}
            <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg p-4 z-20">
                <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full bg-green-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors"
                >
                    Bayar Sekarang
                </button>
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Scan QR Code</h2>
                        <p className="text-gray-600 mb-6">Scan kode QR di bawah ini untuk melakukan pembayaran</p>
                        
                        <div className="bg-gray-50 p-6 rounded-xl mb-6 inline-block">
                            <img src={qrCodeData} alt="QR Code" className="w-64 h-64 mx-auto" />
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowQRModal(false);
                                    router.push(`/customers/history?table=${table}`);
                                }}
                                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                            >
                                Selesai
                            </button>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Modal */}
            {showCartModal && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                            <h2 className="text-2xl font-bold text-gray-800">Detail Keranjang</h2>
                            <button
                                onClick={() => setShowCartModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 p-6">
                            <div className="space-y-4">
                                {checkoutData.map((item) => (
                                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex gap-4">
                                        {/* Item Image */}
                                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.foto_item ? (
                                                <img 
                                                    src={`/img/${item.foto_item}`} 
                                                    alt={item.nama_item}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Details */}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 mb-1">{item.nama_item}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{formatRupiah(Number(item.harga))}</p>
                                            
                                            {/* Toppings */}
                                            {item.toppings && item.toppings.length > 0 && (
                                                <div className="mb-2">
                                                    <p className="text-xs text-gray-500 mb-1">Toppings:</p>
                                                    {item.toppings.map((topping: any) => (
                                                        <span key={topping.id} className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded mr-1 mb-1">
                                                            {topping.nama_toping} (+{formatRupiah(Number(topping.harga))})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {item.catatan && (
                                                <p className="text-xs text-gray-500 italic mb-2">
                                                    Catatan: {item.catatan}
                                                </p>
                                            )}

                                            {/* Quantity and Total */}
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Jumlah: {item.jumlah}x</span>
                                                <span className="font-semibold text-green-600">{formatRupiah(Number(item.totalHarga))}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary in Modal */}
                            <div className="mt-6 pt-4 border-t space-y-2">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Biaya Layanan (2%)</span>
                                    <span>{formatRupiah(serviceCharge)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-green-500">{formatRupiah(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t bg-gray-50">
                            <button
                                onClick={() => setShowCartModal(false)}
                                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Konfirmasi Pembayaran</h2>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <p className="text-gray-600 mb-6">Mohon periksa detail pesanan sebelum melanjutkan pembayaran:</p>
                        
                        <div className="space-y-4 mb-6 bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between">
                                <strong className="text-gray-700">Meja:</strong>
                                <span className="text-gray-900">{mejaName}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="text-gray-700">Items:</strong>
                                <span className="text-gray-900">{checkoutData?.length || 0} items</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="text-gray-700">Total:</strong>
                                <span className="text-green-500 font-bold">{formatRupiah(grandTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="text-gray-700">Metode Bayar:</strong>
                                <span className="text-gray-900">{paymentMethod === 'CASH' ? 'Cash' : 'Qris'}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Tinjau Pesanan
                            </button>
                            <button
                                onClick={handlePayment}
                                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                            >
                                Bayar Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing Modal */}
            {showProcessingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
                        <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Memproses Pembayaran</h2>
                        <p className="text-gray-600">Mohon tunggu, jangan tutup halaman ini...</p>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

// Main export with Suspense wrapper
export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
