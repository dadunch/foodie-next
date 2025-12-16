"use client";

import React, { useState } from 'react';
import { History, X } from 'lucide-react'; // X is for the modal close button

// Mock Login Modal Component
// In a real application, this would be a separate, complex component.
const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e : any) => {
        e.preventDefault();
        console.log('Attempting login with:', username, password);
        // Add real login logic here
        alert('Login attempted. Replace this with real authentication logic.');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="text-xl font-bold text-gray-800">Login Karyawan</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
            </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                required
                />
            </div>
            <button
                type="submit"
                className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-md"
            >
                Masuk
            </button>
            </form>
        </div>
        </div>
    );
    };


    export default function Header() {
    // --- MOCK STATE for demonstration ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // tableInfo as a mock state (e.g., fetched from context/API)
    const [tableInfo] = useState({
        nama_meja: 'Meja 05 (VIP Area)',
        id: 'T005',
    });
    // ------------------------------------

    const handleLogout = () => {
        // Implement actual logout logic here
        if (window.confirm('Are you sure you want to log out?')) {
            setIsLoggedIn(false);
            // Additional cleanup/redirection logic
            console.log("Logged out successfully.");
        }
    };
    
    const handleHistoryClick = () => {
        // Implement navigation or modal for history viewing
        alert('Navigating to Order History...');
    };

    // The Header structure from your request
    return (
        <>
        <header className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                {/* Logo and Table Info */}
                <div className="flex items-center gap-3">
                <img
                    src="/logo/LogoFoodie.png"
                    alt="Foodie Logo"
                    className="w-50 h-10 object-contain"
                />
                
                <div className='hidden sm:block'>
                    <p className="text-xs text-gray-500">Table</p>
                    <p className="text-sm font-extrabold text-gray-800">{tableInfo.nama_meja}</p>
                </div>
                </div>

                {/* Actions: History and Auth */}
                <div className="flex items-center gap-3">
                <button 
                    onClick={handleHistoryClick}
                    aria-label="View Order History"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <History className="w-6 h-6 text-green-600" />
                </button>
                
                {isLoggedIn ? (
                    <button 
                    onClick={handleLogout}
                    className="px-4 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                    >
                    Logout
                    </button>
                ) : (
                    <button 
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                    >
                    Login
                    </button>
                )}
                </div>
            </div>
            </div>
        </header>
        
        {/* Login Modal */}
        {showLoginModal && (
            <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
        </>
    );
    }