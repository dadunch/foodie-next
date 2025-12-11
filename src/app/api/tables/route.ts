import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Table } from '@/types/database';

export async function GET() {
    try {
        const tables = await query<Table>('SELECT * FROM meja ORDER BY nama_meja');
        
        return NextResponse.json({
        success: true,
        data: tables
        });
    } catch (error) {
        console.error('Error fetching tables:', error);
        return NextResponse.json(
        { success: false, error: 'Failed to fetch tables' },
        { status: 500 }
        );
    }
}