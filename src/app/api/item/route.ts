import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Table } from '@/types/database';

export async function GET(request: Request) {
    try {
        const tables = await query<Table>(
            `
            SELECT
                item.id AS id,
                nama_item,
                item.deskripsi,
                harga_item,
                foto_item,
                nama_merchant,
                merchant_id,
                nama_katalog,
                kategori_item.kategori 
            FROM item
            JOIN katalog_merchant 
                    ON katalog_merchant.id = item.katalog_merchant_id
            JOIN merchant 
                    ON merchant.id = katalog_merchant.merchant_id
            JOIN kategori_item
                    ON kategori_item."id" = item.kategori_item_id
            `
            );
            return NextResponse.json({
            success: true,
            data: tables,
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return NextResponse.json(
        { success: false, error: 'Failed to fetch menu items' },
        { status: 500 }
        );
    }
}