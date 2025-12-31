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
                        <div className="relative">
                            <button
                                onClick={stopScanning}
                                className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-500 p-2 rounded-full shadow-md backdrop-blur-sm transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="rounded-2xl overflow-hidden border-2 border-green-500 shadow-inner bg-black">
                                <div id="qr-reader" className="w-full"></div>
                            </div>
                            <p className="text-center text-xs text-green-600 mt-2 animate-pulse font-semibold">
                                <ScanLine className="inline w-3 h-3 mr-1" />
                                Mencari kode QR...
                            </p>
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