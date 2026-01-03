'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Minus, Plus, ShoppingCart, Utensils, Edit3 } from 'lucide-react'; // Import ikon dari lucide-react

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
                router.push('/'); 
            });
            return;
        }

        setTableId(meja_id);
        setTableName(mejaName);

        const fetchData = async () => {
            try {
                const itemId = params.id;
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

                try {
                    const toppingResponse = await fetch(`/api/toping_item/${itemId}`);
                    const toppingResult = await toppingResponse.json();
                    
                    if (toppingResult.success) {
                        const toppingArray = Array.isArray(toppingResult.data) 
                            ? toppingResult.data 
                            : [toppingResult.data];
                        setToppings(toppingArray);
                    }
                } catch (toppingError) {
                    // Ignore topping fetch error
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading details...</p>
                </div>
            </div>
        );
    }

    if (!itemData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500 font-medium">Item not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32"> {/* Increased bottom padding for fixed cart button */}
            
            {/* Header */}
            <header className="bg-white sticky top-0 z-40 shadow-sm/50 backdrop-blur-md bg-white/80">
                <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 truncate px-4 flex-1 text-center">
                        Detail Menu
                    </h1>
                     <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        <span className="text-xs font-medium text-green-700">{tableName}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-4 space-y-6">
                
                {/* Hero Image */}
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white aspect-[4/3] relative">
                    <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/item_image/img/${itemData.foto_item}`}
                        alt={itemData.nama_item}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                             // e.currentTarget.src = '/placeholder.png'; // Add placeholder if needed
                        }}
                    />
                </div>

                {/* Main Info */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                            {itemData.nama_item}
                        </h2>
                    </div>
                     <p className="text-2xl font-bold text-green-600 mb-4">
                        Rp {parseFloat(itemData.harga_item).toLocaleString('id-ID')}
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-3">
                        {itemData.deskripsi || "Lezat dan nikmat, pilihan terbaik untuk Anda hari ini."}
                    </p>
                </section>

                {/* Quantity Selector */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                         <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <Utensils className="w-5 h-5" />
                         </div>
                        <span className="font-semibold text-gray-700">Jumlah Pesanan</span>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1 border border-gray-200">
                        <button
                            onClick={decreaseQuantity}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                            disabled={quantity <= 1}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-lg text-gray-800">{quantity}</span>
                        <button
                            onClick={increaseQuantity}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-500 text-white shadow-sm hover:bg-green-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </section>

                {/* Toppings / Extras */}
                {toppings.length > 0 && (
                    <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            Tambah Topping
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Opsional</span>
                        </h3>
                        <div className="space-y-3">
                            {toppings.map((topping) => (
                                <label
                                    key={topping.id}
                                    className={`relative flex items-center p-3 rounded-xl border transition-all cursor-pointer select-none group ${
                                        selectedToppings.includes(topping.id)
                                            ? 'border-green-500 bg-green-50/50'
                                            : 'border-gray-200 hover:border-green-200'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-700">{topping.nama_toping}</div>
                                        <div className="text-sm text-green-600 font-medium">
                                            + Rp {topping.harga.toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                         selectedToppings.includes(topping.id) ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                    }`}>
                                        {selectedToppings.includes(topping.id) && (
                                             <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedToppings.includes(topping.id)}
                                        onChange={() => toggleTopping(topping.id)}
                                    />
                                </label>
                            ))}
                        </div>
                    </section>
                )}

                {/* Notes */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-gray-800" />
                        Catatan Khusus
                    </h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Jangan terlalu pedas, saus dipisah..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all min-h-[100px] resize-none"
                    />
                </section>

            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 pb-6"> {/* pb-6 for safe area on mobile */}
                <div className="max-w-md mx-auto flex items-center gap-4">
                     <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total Harga</p>
                        <p className="text-xl font-bold text-gray-800">
                             Rp {calculateTotal().toLocaleString('id-ID')}
                        </p>
                    </div>
                    <button
                        onClick={confirmAdd}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Tambah</span>
                    </button>
                </div>
            </div>

            {/* Bottom Nav is hidden on this page typically, but kept as requested */}
            {/* <div className="hidden"> 
                <BottomNav />
            </div> */}

        </div>
    );
}