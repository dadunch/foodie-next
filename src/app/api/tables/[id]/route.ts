import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Table } from '@/types/database';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {        
        const items = await query<Table>(
            `SELECT 
                *
            FROM meja
            join foodcourt on meja.foodcourt_id = foodcourt.id
            WHERE meja.id = $1`,
            [id]
        );

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