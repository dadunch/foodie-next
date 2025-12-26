'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, ShoppingBag, ChevronRight, Filter, Receipt } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface OrderItem {
    id: number;
    nama_item: string;
    jumlah: number;
    harga: number;
    foto_item: string;
}

interface Order {
    id: number;
    order_number: string;
    tanggal: string;
    waktu: string;
    status: 'completed' | 'processing' | 'cancelled';
    total: number;
    items: OrderItem[];
    nama_meja: string;
}

// Mock data - replace dengan API call
const mockOrders: Order[] = [
    {
        id: 1,
        order_number: 'ORD-2024-001',
        tanggal: '2024-12-26',
        waktu: '12:30',
        status: 'completed',
        total: 75000,
        nama_meja: 'A-01',
        items: [
            { id: 1, nama_item: 'Nasi Goreng Spesial', jumlah: 2, harga: 25000, foto_item: 'nasi-goreng.jpg' },
            { id: 2, nama_item: 'Es Teh Manis', jumlah: 2, harga: 5000, foto_item: 'es-teh.jpg' },
            { id: 3, nama_item: 'Ayam Bakar', jumlah: 1, harga: 30000, foto_item: 'ayam-bakar.jpg' },
        ],
    },
    {
        id: 2,
        order_number: 'ORD-2024-002',
        tanggal: '2024-12-25',
        waktu: '18:45',
        status: 'completed',
        total: 125000,
        nama_meja: 'A-01',
        items: [
            { id: 4, nama_item: 'Sate Ayam', jumlah: 3, harga: 20000, foto_item: 'sate.jpg' },
            { id: 5, nama_item: 'Nasi Putih', jumlah: 3, harga: 5000, foto_item: 'nasi.jpg' },
            { id: 6, nama_item: 'Jus Alpukat', jumlah: 2, harga: 15000, foto_item: 'jus.jpg' },
        ],
    },
    {
        id: 3,
        order_number: 'ORD-2024-003',
        tanggal: '2024-12-24',
        waktu: '13:20',
        status: 'cancelled',
        total: 45000,
        nama_meja: 'A-01',
        items: [
            { id: 7, nama_item: 'Mie Goreng', jumlah: 1, harga: 20000, foto_item: 'mie.jpg' },
            { id: 8, nama_item: 'Es Jeruk', jumlah: 1, harga: 8000, foto_item: 'jeruk.jpg' },
        ],
    },
];

export default function HistoryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tableParam = searchParams.get('table');

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'cancelled'>('all');
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    useEffect(() => {
        // Simulasi fetch data - replace dengan API call
        setTimeout(() => {
            setOrders(mockOrders);
            setLoading(false);
        }, 800);
    }, []);

    const formatRupiah = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: Order['status']) => {
        const styles = {
            completed: 'bg-green-100 text-green-700 border-green-200',
            processing: 'bg-blue-100 text-blue-700 border-blue-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200',
        };

        const labels = {
            completed: 'Selesai',
            processing: 'Diproses',
            cancelled: 'Dibatalkan',
        };

        return (
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(order => order.status === filterStatus);

    const toggleOrderExpand = (orderId: number) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Memuat riwayat pesanan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Receipt className="w-6 h-6 text-green-600" />
                            <h1 className="text-2xl font-bold text-gray-800">Riwayat Pesanan</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {filteredOrders.length} pesanan
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filter Section */}
            <section className="bg-white border-b border-gray-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'all'
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'completed'
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Selesai
                        </button>
                        <button
                            onClick={() => setFilterStatus('processing')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'processing'
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Diproses
                        </button>
                        <button
                            onClick={() => setFilterStatus('cancelled')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterStatus === 'cancelled'
                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Dibatalkan
                        </button>
                    </div>
                </div>
            </section>

            {/* Orders List */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Belum Ada Riwayat Pesanan
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Mulai pesan makanan favoritmu sekarang!
                        </p>
                        <button
                            onClick={() => router.push(`/customers?table=${tableParam}`)}
                            className="px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                        >
                            Lihat Menu
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
                            >
                                {/* Order Header */}
                                <div
                                    onClick={() => toggleOrderExpand(order.id)}
                                    className="p-4 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-gray-800">
                                                    {order.order_number}
                                                </h3>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(order.tanggal)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{order.waktu}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight
                                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''
                                                }`}
                                        />
                                    </div>

                                    {/* Order Summary */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <span className="text-sm text-gray-600">
                                            {order.items.length} item
                                        </span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatRupiah(order.total)}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Details (Expandable) */}
                                {expandedOrder === order.id && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3">
                                            Detail Pesanan
                                        </h4>
                                        <div className="space-y-3">
                                            {order.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 bg-white p-3 rounded-lg"
                                                >
                                                    <div
                                                        className="w-16 h-16 bg-cover bg-center rounded-lg flex-shrink-0"
                                                        style={{
                                                            backgroundImage: `url(/img/${item.foto_item})`,
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-semibold text-gray-800 text-sm mb-1 truncate">
                                                            {item.nama_item}
                                                        </h5>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-600">
                                                                {item.jumlah}x {formatRupiah(item.harga)}
                                                            </span>
                                                            <span className="text-sm font-bold text-green-600">
                                                                {formatRupiah(item.harga * item.jumlah)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Order Actions */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    alert('Fitur pesan ulang akan segera hadir!');
                                                }}
                                                className="w-full px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                                            >
                                                Pesan Ulang
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav />

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
