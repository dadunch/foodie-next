// QRScannerContent.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ScanLine } from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { v4 as uuidv4 } from 'uuid';

export default function QRScannerContent() {
    const [tables, setTables] = useState<{ id: number; nama_meja: string; foodcourt_id?: number }[]>([]);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // --- LOGIC SECTION ---
    
    useEffect(() => {
        // 1. Setup Device ID
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('device_id', deviceId);
        }
        
        // 2. Data Fetching
        const fetchMenuItems = async () => {
            // Data Dummy (Fallback)
            const mockTables = [
                { id: 1, nama_meja: 'A1', foodcourt_id: 1 },
                { id: 2, nama_meja: 'A2', foodcourt_id: 1 },
                { id: 3, nama_meja: 'A3', foodcourt_id: 1 },
                { id: 4, nama_meja: 'B1', foodcourt_id: 1 },
                { id: 5, nama_meja: 'B2', foodcourt_id: 1 },
                { id: 6, nama_meja: 'C1', foodcourt_id: 1 },
                { id: 7, nama_meja: 'C2', foodcourt_id: 1 },
                { id: 8, nama_meja: 'C3', foodcourt_id: 1 },
                { id: 9, nama_meja: 'D1', foodcourt_id: 1 },
                { id: 10, nama_meja: 'D2', foodcourt_id: 1 }
            ];

            try {
                const response = await fetch('/api/tables');
                if (response.ok) {
                    const result = await response.json();
                    setTables(result.data && result.data.length > 0 ? result.data : mockTables);
                } else {
                    setTables(mockTables);
                }
            } catch (error) {
                console.error('Error fetching tables:', error);
                setTables(mockTables);
            }
        };

        fetchMenuItems();
    }, []);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const clearAllTableCache = () => {
        Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith('table_')) {
                sessionStorage.removeItem(key);
            }
        });
    };

    const handleTableClick = (table: any) => {
        try {
            clearAllTableCache();
            
            // Encode table ID
            const today = new Date().toISOString().slice(0, 10);
            const step1 = btoa(table.id.toString());
            const step2 = btoa(step1 + '_foodie');
            const step3 = btoa(step2 + '_restaurant');
            const encodedId = btoa(`${step3}|${today}`);
            
            // Set session storage
            const cacheKey = `table_${table.id}`;
            sessionStorage.setItem(cacheKey, JSON.stringify(table));
            sessionStorage.setItem('foodcourt_id', table.foodcourt_id ? table.foodcourt_id.toString() : '1');
            sessionStorage.setItem('meja_id', table.id.toString());
            sessionStorage.setItem('table_name', table.nama_meja);
            sessionStorage.setItem('table_url', encodedId);
            
            // Navigate
            window.location.href = `/customers?table=${encodedId}`;
        } catch (error) {
            console.error('Error handling table click:', error);
            alert('Terjadi kesalahan, silakan coba lagi');
        }
    };

    const startScanning = () => {
        setScanning(true);
        setError(null);

        setTimeout(() => {
            try {
                const scanner = new Html5QrcodeScanner(
                    "qr-reader",
                    { 
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    false
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        scanner.clear().then(() => {
                            setScanning(false);
                            scannerRef.current = null;
                            alert(`QR Code detected: ${decodedText}`);
                            // TODO: Add logic to parse QR and navigate
                        }).catch(console.error);
                    },
                    (errorMessage) => {
                        // Suppress errors
                    }
                );
            } catch (err) {
                console.error('Scanner initialization error:', err);
                setError('Gagal mengakses kamera. Periksa izin browser.');
                setScanning(false);
            }
        }, 100);
    };

    const stopScanning = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().then(() => {
                setScanning(false);
                scannerRef.current = null;
            }).catch(console.error);
        }
    };

    // --- RENDER SECTION ---

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background Decoration (Blobs) */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-200 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-emerald-100 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 flex flex-col h-full justify-center">
                
                {/* --- LOGO SECTION --- */}
                <div className="text-center mb-6">
                    <div className="relative inline-block hover:scale-105 transition-transform duration-300">
                        <img 
                            src="/logo/LogoFoodie.png" 
                            alt="Foodie Logo" 
                            className="h-12 mx-auto object-contain drop-shadow-sm" 
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                document.getElementById('fallback-title')!.style.display = 'block';
                            }}
                        />
                        <h1 id="fallback-title" className="hidden text-3xl font-extrabold text-green-600 tracking-tight">
                            Foodie
                        </h1>
                    </div>
                    <p className="text-gray-500 mt-2 text-sm font-medium">Smart Restaurant Ordering</p>
                </div>

                {/* --- SCANNER CARD --- */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-6 mb-6 border border-gray-100 relative overflow-hidden">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Scan QR Meja</h2>
                        <p className="text-gray-400 text-xs">Arahkan kamera ke kode QR yang ada di mejamu.</p>
                    </div>

                    {/* QR Scanner Area */}
                    {!scanning ? (
                        <div 
                            onClick={startScanning}
                            className="group relative bg-gray-50 rounded-2xl p-6 cursor-pointer border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50/30 transition-all duration-300 aspect-[4/3] flex items-center justify-center"
                        >
                            <div className="text-center">
                                <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform text-green-600">
                                    <Camera className="w-7 h-7" />
                                </div>
                                <p className="text-gray-700 font-bold text-sm group-hover:text-green-700">Ketuk untuk Scan</p>
                                <p className="text-[10px] text-gray-400 mt-1">Pastikan izinkan akses kamera</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative max-w-md mx-auto overflow-hidden">
                            {/* Header / Close Button - Menggunakan gaya Tombol Bulat iOS */}
                            <button
                                onClick={stopScanning}
                                className="absolute top-4 right-4 z-30 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full transition-all active:scale-90"
                            >
                                <X className="w-5 h-5 stroke-[2.5]" />
                            </button>
                            
                            <div className="relative rounded-[40px] overflow-hidden bg-black shadow-2xl border border-white/10">
                                {/* Scanner Overlay - Frame fokus yang lebih halus */}
                                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                                    {/* Guide Frame (Hanya sudut kecil yang elegan) */}
                                    <div className="relative w-64 h-64">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white/80 rounded-tl-2xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white/80 rounded-tr-2xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white/80 rounded-bl-2xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white/80 rounded-br-2xl"></div>
                                        
                                        {/* Scanning Line - Tipis dan elegan seperti FaceID */}
                                        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan"></div>
                                    </div>
                                </div>
                                
                                {/* Kamera Container */}
                                <div className="relative bg-black aspect-square overflow-hidden">
                                    <div id="qr-reader" className="w-full h-full qr-reader-ios"></div>
                                </div>

                                {/* Bottom Status - Floating Glassmorphism */}
                                <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center px-6">
                                    <div className="bg-black/50 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                                        <p className="text-[13px] text-white/90 font-medium tracking-tight">
                                            Scanning QR Code...
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Helper Text di luar box */}
                            <p className="text-center mt-6 text-sm text-gray-500 font-normal">
                                Posisikan kode di tengah area pemindaian
                            </p>

                            <style jsx>{`
                                @keyframes scan {
                                    0% { top: 0%; opacity: 0; }
                                    15% { opacity: 1; }
                                    85% { opacity: 1; }
                                    100% { top: 100%; opacity: 0; }
                                }
                                
                                .animate-scan {
                                    animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                }

                                /* Overriding Library Style untuk tampilan iOS */
                                .qr-reader-ios :global(#qr-reader) {
                                    border: none !important;
                                }

                                .qr-reader-ios :global(video) {
                                    object-fit: cover !important;
                                    border-radius: 0px !important;
                                }

                                /* Sembunyikan elemen bawaan yang mengganggu */
                                .qr-reader-ios :global(#qr-shaded-region) {
                                    display: none !important;
                                }
                                
                                .qr-reader-ios :global(#qr-reader__dashboard) {
                                    background: transparent !important;
                                    padding: 20px !important;
                                }

                                /* Tombol Start/Stop bergaya iOS */
                                .qr-reader-ios :global(button) {
                                    background-color: #007AFF !important; /* iOS Blue */
                                    color: white !important;
                                    border-radius: 12px !important;
                                    padding: 12px 24px !important;
                                    font-weight: 600 !important;
                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica !important;
                                    border: none !important;
                                    transition: all 0.2s ease !important;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                                    width: 100% !important;
                                    margin-top: 10px !important;
                                }

                                .qr-reader-ios :global(button:active) {
                                    transform: scale(0.96) !important;
                                    opacity: 0.8 !important;
                                }

                                /* Camera Select bergaya iOS */
                                .qr-reader-ios :global(select) {
                                    background: rgba(255,255,255,0.1) !important;
                                    color: white !important;
                                    border: 1px solid rgba(255,255,255,0.2) !important;
                                    border-radius: 10px !important;
                                    padding: 8px !important;
                                    margin-bottom: 10px !important;
                                    width: 100% !important;
                                }
                            `}</style>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-center gap-2">
                            <X className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* --- DEMO TABLES --- */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Atau Pilih Meja</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {tables.map((table) => (
                            <button
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className="aspect-square bg-white hover:bg-green-500 hover:text-white text-gray-600 font-bold rounded-xl shadow-sm hover:shadow-green-500/40 border border-gray-100 hover:border-green-500 transition-all duration-200 flex items-center justify-center text-xs"
                            >
                                {table.nama_meja}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}