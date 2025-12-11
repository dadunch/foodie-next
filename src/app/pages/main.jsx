import React, { useState, useEffect } from 'react';
import { QrCode, Camera, User, Store } from 'lucide-react';

export default function FoodieQRScanner() {
    const [tables, setTables] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    // Simulate fetching table data from API
    useEffect(() => {
        // In real app, replace with: fetch('/api/tables').then(res => res.json())
        const mockTables = [
        { id: 1, nama_meja: '1' },
        { id: 2, nama_meja: '2' },
        { id: 3, nama_meja: '3' },
        { id: 4, nama_meja: '4' },
        { id: 5, nama_meja: '5' }
        ];
        setTables(mockTables);
    }, []);

    const handleTableClick = (tableId) => {
        const encodedId = btoa(tableId.toString());
        // In real app: window.location.href = `/customer?table=${encodedId}`;
        alert(`Navigating to Table ${tableId}`);
    };

    const startScanning = () => {
        setScanning(true);
        // In real implementation, initialize html5-qrcode scanner here
        alert('QR Scanner would start here. In production, integrate html5-qrcode library.');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl shadow-xl mb-4 transform hover:scale-105 transition-transform">
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
            <div 
                onClick={startScanning}
                className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8 mb-6 cursor-pointer hover:from-gray-200 hover:to-gray-100 transition-all border-2 border-dashed border-gray-300"
            >
                <div className="text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                    {scanning ? 'Scanning...' : 'Click to Start Scanning'}
                </p>
                </div>
                <div id="qr-reader" className="mt-4"></div>
            </div>

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
                    onClick={() => handleTableClick(table.id)}
                    className="bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-sm"
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