import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Table } from '@/types/database';

export async function GET(request: Request) {
    try {
        const tables = await query<Table>('select item.id as id, nama_item, item.deskripsi, harga_item, foto_item, nama_merchant, merchant_id, nama_kategori from item join kategori_menu on kategori_menu.id = item.kategori_menu_id join merchant on merchant.id = kategori_menu.merchant_id'); 
        return NextResponse.json({
        success: true,
        data: tables
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return NextResponse.json(
        { success: false, error: 'Failed to fetch menu items' },
        { status: 500 }
        );
    }
}