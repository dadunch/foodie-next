import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Merchant } from '@/types/database';

export async function GET() {
    try {
        const merchants = await query<Merchant>(`
        SELECT DISTINCT m.*
        FROM merchant m
        JOIN items i ON m.id = i.merchant_id
        ORDER BY m.nama_merchant
        `);
        
        return NextResponse.json({
        success: true,
        data: merchants
        });
    } catch (error) {
        console.error('Error fetching merchants:', error);
        return NextResponse.json(
        { success: false, error: 'Failed to fetch merchants' },
        { status: 500 }
        );
    }
}
