import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { MenuItem } from '@/types/database';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const merchantId = searchParams.get('merchant_id');
        const search = searchParams.get('search');
        const category = searchParams.get('category');

        let sql = `
        SELECT 
            i.*,
            m.nama_merchant,
            m.deskripsi as merchant_desc
        FROM items i
        JOIN merchant m ON i.merchant_id = m.id
        WHERE 1=1
        `;
        
        const params: any[] = [];

        if (merchantId) {
        sql += ' AND i.merchant_id = ?';
        params.push(merchantId);
        }

        if (search) {
        sql += ' AND (i.nama_item LIKE ? OR m.nama_merchant LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
        }

        if (category && category !== 'all') {
        sql += ' AND i.category = ?';
        params.push(category);
        }

        sql += ' ORDER BY i.nama_item';

        const items = await query<MenuItem>(sql, params);
        
        return NextResponse.json({
        success: true,
        data: items
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return NextResponse.json(
        { success: false, error: 'Failed to fetch menu items' },
        { status: 500 }
        );
    }
}