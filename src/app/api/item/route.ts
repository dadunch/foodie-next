import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Table } from '@/types/database';

export async function GET(request: Request) {
    try {
        console.log('Starting query execution...');
        
        const sqlQuery = `
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
        
        console.log('SQL Query:', sqlQuery);
        
        const tables = await query<Table>(sqlQuery);
        
        console.log('Query successful, rows returned:', tables.length);
        
        return NextResponse.json({
            success: true,
            data: tables,
        });
    } catch (error) {
        console.error('=== ERROR DETAILS ===');
        console.error('Error object:', error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        
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