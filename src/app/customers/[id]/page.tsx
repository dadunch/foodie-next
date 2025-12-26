'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import BottomNav from '@/components/BottomNav';

interface ItemData {
    id: number;
    nama_item: string;
    deskripsi: string;
    harga_item: string;
    foto_item: string;
}

interface ToppingData {
    id: string;
    item_id: string;
    nama_toping: string;
    harga: number;
}

export default function ItemDetail() {
    const router = useRouter();
    const params = useParams();

    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [itemData, setItemData] = useState<ItemData | null>(null);
    const [toppings, setToppings] = useState<ToppingData[]>([]);
    const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableId, setTableId] = useState('');
    const [tableName, setTableName] = useState('');

    useEffect(() => {
        // Ambil meja_id dari sessionStorage
        const meja_id = sessionStorage.getItem('meja_id');
        const mejaName = sessionStorage.getItem('table_name') || 'Table 21';
        
        if (!meja_id) {
            Swal.fire({
                title: 'Error!',
                text: 'Meja belum dipilih. Silakan pilih meja terlebih dahulu.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#50C878'
            }).then(() => {
                router.push('/'); // Redirect ke halaman pemilihan meja
            });
            return;
        }

        setTableId(meja_id);
        setTableName(mejaName);

        const fetchData = async () => {
            try {
                const itemId = params.id;
                
                // Fetch item data
                const itemResponse = await fetch(`/api/item/${itemId}`);
                const itemResult = await itemResponse.json();

                if (!itemResult.success) {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Item tidak ditemukan',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#50C878'
                    }).then(() => {
                        router.back();
                    });
                    return;
                }

                setItemData(itemResult.data);

                // Fetch toppings data
                try {
                    const toppingResponse = await fetch(`/api/toping_item/${itemId}`);
                    const toppingResult = await toppingResponse.json();
                    
                    if (toppingResult.success) {
                        // Jika data adalah object tunggal, ubah ke array
                        const toppingArray = Array.isArray(toppingResult.data) 
                            ? toppingResult.data 
                            : [toppingResult.data];
                        setToppings(toppingArray);
                    }
                } catch (toppingError) {
                    // Tidak perlu error handling, item bisa saja tidak punya topping
                }

            } catch (error) {
                console.error('Fetch Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Gagal mengambil data item',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#50C878'
                }).then(() => {
                    router.back();
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, router]);

    const calculateTotal = () => {
        if (!itemData) return 0;
        const itemPrice = parseFloat(itemData.harga_item);
        let total = quantity * itemPrice;
        
        // Tambahkan harga topping yang dipilih
        selectedToppings.forEach(toppingId => {
            const topping = toppings.find(t => t.id === toppingId);
            if (topping) {
                total += topping.harga * quantity;
            }
        });
        
        return total;
    };

    const increaseQuantity = () => {
        if (quantity < 99) setQuantity(quantity + 1);
    };

    const decreaseQuantity = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    const toggleTopping = (toppingId: string) => {
        setSelectedToppings(prev => {
            if (prev.includes(toppingId)) {
                return prev.filter(id => id !== toppingId);
            } else {
                return [...prev, toppingId];
            }
        });
    };

    const confirmAdd = () => {
        if (!itemData) return;

        Swal.fire({
            title: 'Konfirmasi Penambahan',
            text: `Anda yakin untuk menambahkan ${quantity}x ${itemData.nama_item} ke keranjang?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Tambahkan',
            cancelButtonText: 'Tidak, Batalkan',
            confirmButtonColor: '#50C878',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                storeCard();
            }
        });
    };

    const storeCard = async () => {
        if (!itemData) return;
        const url_table = sessionStorage.getItem('table_url') || '';
        const formData = new FormData();
        formData.append('meja_id', tableId);
        formData.append('item_id', itemData.id.toString());
        formData.append('quantity', quantity.toString());
        
        // Kirim topping yang dipilih sebagai JSON string
        formData.append('toppings', JSON.stringify(selectedToppings));
        
        formData.append('notes', notes);
        formData.append('price', `Rp ${calculateTotal().toLocaleString('id-ID')}`);

        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success') {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Item berhasil ditambahkan ke keranjang!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#50C878'
                }).then(() => {
                    // Reset form
                    setQuantity(1);
                    setSelectedToppings([]);
                    setNotes('');
                    router.push('/customers?table=' + url_table);
                });
            } else {
                Swal.fire({
                    title: 'Gagal!',
                    text: data.message || 'Gagal menambahkan item ke keranjang!',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#50C878'
                });
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Terjadi kesalahan saat menambahkan item ke keranjang!',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#50C878'
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (!itemData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600 text-lg">Item tidak ditemukan</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <style jsx global>{`
                :root {
                    --primary-color: #50C878;
                    --secondary-color: #4ecdc4;
                    --dark-color: #2c3e50;
                    --light-gray: #f8f9fa;
                    --border-radius: 15px;
                }
            `}</style>

            {/* Header */}
            <header className="bg-white sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-semibold">Item Detail</h1>
                    </div>
                    <div className="bg-gray-100 px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="text-sm opacity-90">Table:</span>
                        <span className="font-semibold text-lg">{tableName}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-5 py-8">
                {/* Image Section */}
                <div className="bg-white rounded-lg overflow-hidden shadow-lg mb-6">
                    <div className="w-full h-96 overflow-hidden">
                        <img
                            src={`/img/${itemData.foto_item}`}
                            alt={itemData.nama_item}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                // e.currentTarget.src = '/placeholder.svg';
                            }}
                        />
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-lg p-6 shadow-lg mb-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{itemData.nama_item}</h2>
                    <p className="text-gray-600 leading-relaxed mb-5">{itemData.deskripsi}</p>
                    <p className="text-xl font-bold text-green-600">
                        Rp {parseFloat(itemData.harga_item).toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Quantity Section */}
                <div className="bg-white rounded-lg p-6 shadow-lg mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" />
                        </svg>
                        Quantity
                    </h3>
                    <div className="flex items-center justify-center gap-5 bg-gray-100 p-4 rounded-full max-w-xs mx-auto">
                        <button
                            onClick={decreaseQuantity}
                            className="w-11 h-11 rounded-full bg-green-500 text-white text-lg flex items-center justify-center hover:bg-red-400 transition-all hover:scale-110 active:scale-95"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            value={quantity}
                            readOnly
                            className="w-16 text-center text-lg font-semibold bg-transparent border-none"
                        />
                        <button
                            onClick={increaseQuantity}
                            className="w-11 h-11 rounded-full bg-green-500 text-white text-lg flex items-center justify-center hover:bg-red-400 transition-all hover:scale-110 active:scale-95"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Extras/Toppings Section */}
                {toppings.length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-lg mb-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Extras
                        </h3>
                        <div className="space-y-4">
                            {toppings.map((topping) => (
                                <label 
                                    key={topping.id}
                                    className="bg-gray-100 rounded-xl p-4 flex items-center cursor-pointer hover:bg-green-200 border-1 border-transparent hover:border-green-400 transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedToppings.includes(topping.id)}
                                        onChange={() => toggleTopping(topping.id)}
                                        className="w-6 h-6 mr-4 accent-green-300"
                                    />
                                    <span className="flex-1 font-medium text-gray-800">{topping.nama_toping}</span>
                                    <span className="text-green-600 font-semibold">
                                        +Rp {topping.harga.toLocaleString('id-ID')}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Section */}
                <div className="bg-white rounded-lg p-6 shadow-lg mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        Special Request
                    </h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your special request here..."
                        className="w-full border-1 border-gray-300 rounded-xl p-4 min-h-[100px] focus:outline-none focus:border-green-500 transition-all"
                    />
                </div>

                {/* Add to Cart Section */}
                <div className="bg-white rounded-lg p-3 border border-2 border-green-300 sticky bottom-24">
                    <div className="flex justify-between items-center mb-5 p-3 bg-gray-100 rounded-xl">
                        <span className="text-lg font-semibold text-gray-800">Total Price:</span>
                        <span className="text-xl font-bold text-green-600">
                            Rp {calculateTotal().toLocaleString('id-ID')}
                        </span>
                    </div>
                    <button
                        onClick={confirmAdd}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl text-xl font-semibold hover:-translate-y-1 hover:shadow-xl transition-all active:translate-y-0"
                    >
                        <svg className="w-6 h-6 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        </svg>
                        Add to Cart
                    </button>
                </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}