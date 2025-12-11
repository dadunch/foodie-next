import { testConnection } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const isConnected = await testConnection();
    
    if (isConnected) {
        return NextResponse.json({
        success: true,
        message: 'Database connected successfully'
        });
    } else {
        return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
        );
    }
}
