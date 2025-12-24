import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

interface Keranjang {
    id: number;
    meja_id: number;
    pelanggan_id: number | null;
    created_at: string;
}

interface KeranjangItem {
    id: number;
    keranjang_id: number;
    item_id: number;
    jumlah: number;
    harga: number;
    topping_ids: string[] | null;
    catatan: string | null;
    created_at: string;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        
        const meja_id = formData.get('meja_id') as string;
        const item_id = formData.get('item_id') as string;
        const quantity = parseInt(formData.get('quantity') as string);
        const toppings = formData.get('toppings') as string;
        const notes = formData.get('notes') as string || '';
        const priceString = formData.get('price') as string;

        // Validasi input
        if (!meja_id || !item_id || !quantity) {
            return NextResponse.json({
                status: 'error',
                message: 'Data tidak lengkap'
            }, { status: 400 });
        }

        // Konversi harga dari "Rp 50.000" ke integer 50000
        const price = parseInt(priceString.replace(/[^0-9]/g, ''));

        // Parse toppings JSON
        let toppingIds: string[] = [];
        try {
            toppingIds = JSON.parse(toppings);
        } catch (e) {
            toppingIds = [];
        }

        // Cek keranjang existing dalam 20 menit terakhir
        const twentyMinutesAgo = new Date();
        twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);

        const existingKeranjang = await query<Keranjang>(
            `SELECT id 
                FROM keranjang 
                WHERE meja_id = $1 
                AND created_at >= $2 
                ORDER BY created_at DESC 
                LIMIT 1`,
            [parseInt(meja_id), twentyMinutesAgo.toISOString()]
        );

        let keranjangId: number;

        if (existingKeranjang.length > 0) {
            // Gunakan keranjang yang sudah ada
            keranjangId = existingKeranjang[0].id;
        } else {
            // Buat keranjang baru
            const newKeranjang = await query<Keranjang>(
                `INSERT INTO keranjang (meja_id, pelanggan_id) 
                 VALUES ($1, NULL) 
                 RETURNING id`,
                [parseInt(meja_id)]
            );

            if (newKeranjang.length === 0) {
                return NextResponse.json({
                    status: 'error',
                    message: 'Gagal membuat keranjang'
                }, { status: 500 });
            }

            keranjangId = newKeranjang[0].id;
        }

        // Insert item ke keranjang_item
        const toppingIdsJson = toppingIds.length > 0 ? JSON.stringify(toppingIds) : null;
        
        const keranjangItem = await query<KeranjangItem>(
            `INSERT INTO keranjang_item (keranjang_id, item_id, jumlah, harga, topping_ids, catatan) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [
                keranjangId,
                parseInt(item_id),
                quantity,
                price,
                toppingIdsJson,
                notes || null
            ]
        );

        if (keranjangItem.length === 0) {
            return NextResponse.json({
                status: 'error',
                message: 'Gagal menambahkan item ke keranjang'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'success',
            message: 'Item berhasil ditambahkan ke keranjang',
            data: {
                keranjang_id: keranjangId,
                item: keranjangItem[0]
            }
        });

    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Terjadi kesalahan server',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}