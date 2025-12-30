import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Keranjang } from '@/types/database';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 🔍 FIX: unwrap params
    const resolvedParams = await params;

    console.log('[DEBUG] resolvedParams:', resolvedParams);

    const id = resolvedParams.id;

    if (!id) {
        console.error('[DEBUG] ID is undefined');
        return NextResponse.json(
        {
            success: false,
            error: 'ID is required',
        },
        { status: 400 }
        );
    }

    try {
        console.log('[DEBUG] Querying keranjang with id:', id);

        const items = await query<Keranjang>(
        `
        SELECT *
        FROM keranjang
        JOIN "order" ON keranjang.id = "order".keranjang_id
        WHERE keranjang.id = $1
        AND "order"."status" in ('Belum diproses', 'Diproses', 'Selesai')
        `,
        [id]
        );

        console.log('[DEBUG] Query result:', items);

        if (items.length === 0) {
        return NextResponse.json(
            {
            success: false,
            error: 'Order not found',
            },
            { status: 404 }
        );
        }

        return NextResponse.json({
        success: true,
        data: items[0],
        });
    } catch (error) {
        console.error('[DEBUG] Server error:', error);

        return NextResponse.json(
        {
            success: false,
            error: 'Server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
        );
    }
}