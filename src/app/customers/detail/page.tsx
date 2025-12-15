'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

interface ItemData {
    id: string;
    name: string;
    restaurant: string;
    description: string;
    price: number;
    imageUrl: string;
}

    export default function ItemDetail() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [quantity, setQuantity] = useState(1);
    const [extraRice, setExtraRice] = useState(false);
    const [extraSauce, setExtraSauce] = useState(false);
    const [notes, setNotes] = useState('');
    const [itemData, setItemData] = useState<ItemData | null>(null);
    const [tableId, setTableId] = useState('');
    const [tableName, setTableName] = useState('Table 1');

    useEffect(() => {
        // Get data from URL params
        const itemId = searchParams.get('itemid') || searchParams.get('id') || searchParams.get('item_id') || '0';
        const price = searchParams.get('price') || 'Rp 0';
        const numericPrice = parseInt(price.replace('Rp ', '').replace(/\./g, ''));
        const name = searchParams.get('name') || '';
        const restaurant = searchParams.get('restaurant') || '';
        const description = searchParams.get('desc') || '';
        const img = searchParams.get('img') || '';
        
        const match = img.match(/url\(["']?(.*?)["']?\)/);
        const imageUrl = match ? match[1] : '/placeholder.svg';

        setItemData({
        id: itemId,
        name,
        restaurant,
        description,
        price: numericPrice,
        imageUrl
        });

        // Get table info (you would fetch this from your API)
        setTableId('1');
        setTableName('Table 1');
    }, [searchParams]);

    const calculateTotal = () => {
        if (!itemData) return 0;
        let total = quantity * itemData.price;
        if (extraRice) total += 5000;
        if (extraSauce) total += 3000;
        return total;
    };

    const increaseQuantity = () => {
        if (quantity < 99) setQuantity(quantity + 1);
    };

    const decreaseQuantity = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    const confirmAdd = () => {
        if (!itemData) return;

        Swal.fire({
        title: 'Konfirmasi Penambahan',
        text: `Anda yakin untuk menambahkan ${quantity}x ${itemData.name} ke keranjang?`,
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

        const formData = new FormData();
        formData.append('table_id', tableId);
        formData.append('item_id', itemData.id);
        formData.append('quantity', quantity.toString());
        formData.append('extra_rice', extraRice ? '1' : '0');
        formData.append('extra_sauce', extraSauce ? '1' : '0');
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

    if (!itemData) {
        return <div className="loading">Loading...</div>;
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
                <h1 className="text-2xl font-semibold">Item Detail</h1>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-full flex items-center gap-2">
                <span className="text-sm opacity-90">Table:</span>
                <span className="font-semibold text-lg">{tableName}</span>
            </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-5 py-8">
            {/* Image Section */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
            <div className="w-full h-96 overflow-hidden">
                <img
                src={itemData.imageUrl}
                alt={itemData.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
            </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-5">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{itemData.name}</h2>
            <p className="text-green-600 text-lg font-medium mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                {itemData.restaurant}
            </p>
            <p className="text-gray-600 leading-relaxed mb-5">{itemData.description}</p>
            <p className="text-3xl font-bold text-green-600">
                Rp {itemData.price.toLocaleString('id-ID')}
            </p>
            </div>

            {/* Quantity Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-5">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z" />
                </svg>
                Quantity
            </h3>
            <div className="flex items-center justify-center gap-5 bg-gray-100 p-4 rounded-full max-w-xs mx-auto">
                <button
                onClick={decreaseQuantity}
                className="w-11 h-11 rounded-full bg-green-500 text-white text-2xl flex items-center justify-center hover:bg-red-400 transition-all hover:scale-110 active:scale-95"
                >
                −
                </button>
                <input
                type="number"
                value={quantity}
                readOnly
                className="w-16 text-center text-2xl font-semibold bg-transparent border-none"
                />
                <button
                onClick={increaseQuantity}
                className="w-11 h-11 rounded-full bg-green-500 text-white text-2xl flex items-center justify-center hover:bg-red-400 transition-all hover:scale-110 active:scale-95"
                >
                +
                </button>
            </div>
            </div>

            {/* Extras Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-5">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Extras
            </h3>
            <div className="space-y-4">
                <label className="bg-gray-100 rounded-xl p-4 flex items-center cursor-pointer hover:bg-gray-200 border-2 border-transparent hover:border-green-500 transition-all">
                <input
                    type="checkbox"
                    checked={extraRice}
                    onChange={(e) => setExtraRice(e.target.checked)}
                    className="w-6 h-6 mr-4 accent-green-500"
                />
                <span className="flex-1 font-medium text-gray-800">Extra Rice</span>
                <span className="text-green-600 font-semibold">+Rp 5,000</span>
                </label>
                <label className="bg-gray-100 rounded-xl p-4 flex items-center cursor-pointer hover:bg-gray-200 border-2 border-transparent hover:border-green-500 transition-all">
                <input
                    type="checkbox"
                    checked={extraSauce}
                    onChange={(e) => setExtraSauce(e.target.checked)}
                    className="w-6 h-6 mr-4 accent-green-500"
                />
                <span className="flex-1 font-medium text-gray-800">Extra Sauce</span>
                <span className="text-green-600 font-semibold">+Rp 3,000</span>
                </label>
            </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-5">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Special Request
            </h3>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your special request here..."
                className="w-full border-2 border-gray-300 rounded-xl p-4 min-h-[100px] focus:outline-none focus:border-green-500 transition-all"
            />
            </div>

            {/* Add to Cart Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky bottom-24">
            <div className="flex justify-between items-center mb-5 p-4 bg-gray-100 rounded-xl">
                <span className="text-lg font-semibold text-gray-800">Total Price:</span>
                <span className="text-3xl font-bold text-green-600">
                Rp {calculateTotal().toLocaleString('id-ID')}
                </span>
            </div>
            <button
                onClick={confirmAdd}
                className="w-full py-5 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl text-xl font-semibold hover:-translate-y-1 hover:shadow-xl transition-all active:translate-y-0"
            >
                <svg className="w-6 h-6 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Add to Cart
            </button>
            </div>
        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white flex justify-around py-3 shadow-lg z-50">
            <button onClick={() => router.push('/')} className="flex flex-col items-center text-gray-500 hover:text-green-500 transition-colors p-2">
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs">Home</span>
            </button>
            <button className="flex flex-col items-center text-gray-500 hover:text-green-500 transition-colors p-2">
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Search</span>
            </button>
            <button onClick={() => router.push('/cart')} className="flex flex-col items-center text-gray-500 hover:text-green-500 transition-colors p-2">
            <div className="relative">
                <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
            </div>
            <span className="text-xs">Cart</span>
            </button>
            <button onClick={() => router.push('/history')} className="flex flex-col items-center text-gray-500 hover:text-green-500 transition-colors p-2">
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">History</span>
            </button>
        </div>
        </div>
    );
}