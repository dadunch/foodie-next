'use client'

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, User, Store, X } from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { v4 as uuidv4 } from 'uuid';

export default function FoodieQRScanner() {
    const [tables, setTables] = useState<{ id: number; nama_meja: string }[]>([]);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);


    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
    }

    // remove all cache
    useEffect(() => {
        const mockTables = Array;
        const fetchMenuItems = async () => {
            try {
                const response = await fetch('/api/tables');
                if (!response.ok) {
                    throw new Error('Failed to fetch menu items');
                }
                const result = await response.json();
                setTables(result.data ?? []);
            } catch (error) {
            console.error('Error fetching menu items:', error);
            }
        };
        fetchMenuItems();
        setTables(mockTables);
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

    // const handleTableClick = (tableId: number) => {
    //     clearAllTableCache();
    //     const today = new Date().toISOString().slice(0, 10);
    //     const step1 = btoa(tableId.toString());
    //     const step2 = btoa(step1 + '_foodie');
    //     const step3 = btoa(step2 + '_restaurant');
    //     const encodedId = btoa(`${step3}|${today}`);
        
    //     window.location.href = `/customers?table=${encodedId}`;
    // };
    const handleTableClick = (table: any) => {
        try {
            clearAllTableCache();
            
            // Encode table ID
            const today = new Date().toISOString().slice(0, 10);
            const step1 = btoa(table.id.toString());
            const step2 = btoa(step1 + '_foodie');
            const step3 = btoa(step2 + '_restaurant');
            const encodedId = btoa(`${step3}|${today}`);
            
            // Set semua session storage sekaligus
            const cacheKey = `table_${table.id}`;
            sessionStorage.setItem(cacheKey, JSON.stringify(table));
            sessionStorage.setItem('foodcourt_id', table.foodcourt_id.toString());
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

        // Wait for DOM to update before initializing scanner
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
                        }).catch(console.error);
                    },
                    (errorMessage) => {
                        // Suppress frequent scan errors
                        // console.warn(`Scan error: ${errorMessage}`);
                    }
                );
            } catch (err) {
                console.error('Scanner initialization error:', err);
                setError('Failed to start camera. Please check permissions.');
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

    return (
        
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-500 rounded-3xl shadow-xl mb-4 transform hover:scale-105 transition-transform">
                        <QrCode className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800">Foodie</h1>
                    <p className="text-gray-600 mt-2">Smart Restaurant Ordering</p>
                </div>

                {/* Scanner Box */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Scan QR Code</h2>
                        <p className="text-gray-600">Scan the QR code on your table to start ordering</p>
                    </div>

                    {/* QR Scanner Area */}
                    {!scanning ? (
                        <div 
                            onClick={startScanning}
                            className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8 mb-6 cursor-pointer hover:from-gray-200 hover:to-gray-100 transition-all border-2 border-dashed border-gray-300"
                        >
                            <div className="text-center">
                                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">Click to Start Scanning</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative mb-6">
                            <button
                                onClick={stopScanning}
                                className="absolute top-2 right-2 z-10 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div id="qr-reader" className="rounded-2xl overflow-hidden"></div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-center text-sm text-gray-500">
                        <p>Having trouble scanning? Try the demo tables below.</p>
                    </div>
                </div>

                {/* Demo Tables */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
                    <p className="text-center font-semibold text-gray-700 mb-4">Demo Tables:</p>
                    <div className="grid grid-cols-5 gap-2">
                        {tables.map((table) => (
                            <button
                                key={table.id}
                                onClick={() => handleTableClick(table)} // Pass seluruh object
                                className="bg-gradient-to-br from-green-500 to-green-500 hover:from-green-600 hover:to-green-600 text-white font-bold py-3 px-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-sm"
                            >
                                {table.nama_meja}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Login Links */}
                <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
                    <p className="text-gray-600 mb-3">Login as</p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => alert('Navigate to Cashier Login')}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            <User className="w-5 h-5" />
                            Cashier
                        </button>
                        <button 
                            onClick={() => alert('Navigate to Restaurant Login')}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            <Store className="w-5 h-5" />
                            Restaurant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}