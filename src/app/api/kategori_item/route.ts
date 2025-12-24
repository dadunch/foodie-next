import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Table } from '@/types/database';

export async function GET(request: Request) {
    try {        
        const sqlQuery = `
            SELECT * from kategori_item
        `;        
        const tables = await query<Table>(sqlQuery);        
        return NextResponse.json({
            success: true,
            data: tables,
        });
    } catch (error) {
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to fetch menu items',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}