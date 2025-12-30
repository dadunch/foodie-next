import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { item } from '@/types/database';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const foodcourtId = searchParams.get('foodcourt_id');
    
        let sqlQuery = `
            SELECT
            item.id AS id,
            item.nama_item,
            item.deskripsi,
            item.harga_item,
            item.foto_item,
            merchant.nama_merchant,
            merchant.id AS merchant_id,
            katalog_merchant.nama_katalog,
            kategori_item.kategori
            FROM item
            JOIN katalog_merchant ON katalog_merchant.id = item.katalog_merchant_id
            JOIN merchant ON merchant.id = katalog_merchant.merchant_id
            JOIN kategori_item ON kategori_item.id = item.kategori_item_id
        `;
    
        const params: any[] = [];
        if (foodcourtId) {
            sqlQuery += ` WHERE merchant.foodcourt_id = $1`;
            params.push(foodcourtId);
        }
        const items = await query<item>(sqlQuery, params);
    
        return NextResponse.json({
            success: true,
            data: items,
        });
        } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch menu items',
                details: error instanceof Error ? error.message : String(error),
            },
                { status: 500 }
        );
    }
}