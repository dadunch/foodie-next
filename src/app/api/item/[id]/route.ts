import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Table } from '@/types/database';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Tambahkan Promise
) {
    const { id } = await params; // Await params

    try {
        console.log('Fetching item with ID:', id);
        
        const items = await query<Table>(
            `
            SELECT 
                item.id AS id,
                nama_item,
                item.deskripsi,
                harga_item,
                foto_item
            FROM item
            WHERE item.id = ?
            `,
            [id]
        );

        console.log('Query result:', items);

        if (items.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: items[0],
        });
    } catch (error) {
        console.error('Full error details:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Server error',
                message: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}