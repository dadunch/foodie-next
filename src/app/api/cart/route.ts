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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const encodedIda = searchParams.get('table');
            if (!encodedIda) {
                return NextResponse.json({
                    success: false,
                    message: 'Table ID is required'
                }, { status: 400 });
            }

            // const step3 = atob(encodedIda).replace('_order', '');
            // const step2 = atob(step3).replace('_restaurant', '');
            // const step1 = atob(step2).replace('_foodie', '');
            // const tableId = Number(atob(step1));
            
            const decodedFinal = atob(encodedIda);

            // pisahkan payload & tanggal
            const [encodedPart, datePart] = decodedFinal.split('|');

            // validasi tanggal (opsional)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                throw new Error('Tanggal tidak valid');
            }

            const step2 = atob(encodedPart).replace('_restaurant', '');
            const step1 = atob(step2).replace('_foodie', '');
            const tableId = Number(atob(step1));


        if (!tableId) {
            return NextResponse.json({
                success: false,
                message: 'Invalid Table ID'
            }, { status: 400 });
        }

        // Validasi input
        if (!tableId) {
        return NextResponse.json({
            success: false,
            message: 'Table ID is required'
        }, { status: 400 });
        }

        // Query untuk mendapatkan data keranjang dengan join
        const cartQuery = `
        SELECT 
            keranjang_item.id,
            keranjang_item.keranjang_id,
            keranjang_item.item_id,
            keranjang_item.jumlah,
            item.harga_item as harga_item,
            keranjang_item.harga as harga_total,
            keranjang_item.catatan,
            keranjang_item.topping_ids,
            item.nama_item,
            item.foto_item
        FROM keranjang
        JOIN keranjang_item ON keranjang_item.keranjang_id = keranjang.id
        JOIN item ON item.id = keranjang_item.item_id
        WHERE keranjang.meja_id = $1 
            AND keranjang.created_at >= NOW() - INTERVAL '200 minutes'
        ORDER BY keranjang_item.id ASC
        `;

        const cartItems = await query(cartQuery, [tableId]);

        // Query untuk mendapatkan info meja
        const tableQuery = `
        SELECT id, nama_meja 
        FROM meja 
        WHERE id = $1
        `;

        const tableResult = await query(tableQuery, [tableId]);

        if (tableResult.length === 0) {
        return NextResponse.json({
            success: false,
            message: 'Table not found'
        }, { status: 404 });
        }

        // Proses items dengan toppings
        const items = await Promise.all(
        cartItems.map(async (row) => {
            let toppings = Array<{ id: string; nama_toping: string; harga: number }>();

            // Jika ada topping_ids, ambil data toppingnya
            if (row.topping_ids && Array.isArray(row.topping_ids) && row.topping_ids.length > 0) {
            // Query toppings berdasarkan IDs
            const toppingQuery = `
                SELECT 
                id,
                nama_toping,
                harga
                FROM toping_item
                WHERE id = ANY($1::int[])
            `;

            const toppingResult = await query(toppingQuery, [row.topping_ids]);
            
            toppings = toppingResult.map(topping => ({
                id: topping.id.toString(),
                nama_toping: topping.nama_toping,
                harga: topping.harga
            }));
            }


            return {
            id: row.id,
            cart_id: row.keranjang_id,
            item_id: row.item_id,
            nama_item: row.nama_item,
            jumlah: row.jumlah,
            harga: row.harga_item,
            totalHarga: row.harga_total,
            catatan: row.catatan || '',
            foto_item: row.foto_item || '',
            toppings: toppings
            };
        })
        );

        // Response
        return NextResponse.json({
        success: true,
        items: items,
        tableInfo: {
            id: tableResult[0].id,
            nama_meja: tableResult[0].nama_meja
        }
        });

    } catch (error) {
        console.error('Error fetching cart:', error);
        return NextResponse.json({
        success: false,
        message: 'Failed to fetch cart',
        details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
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

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cartItemId = searchParams.get('cart_item_id');
        
        if (!cartItemId) {
            return NextResponse.json({
                status: 'error',
                message: 'cart_item_id is required'
            }, { status: 400 });
        }

        // Validasi apakah cart item ada
        const checkItem = await query(
            `SELECT id FROM keranjang_item WHERE id = $1`,
            [parseInt(cartItemId)]
        );

        if (checkItem.length === 0) {
            return NextResponse.json({
                status: 'error',
                message: 'Item tidak ditemukan'
            }, { status: 404 });
        }

        // Hapus item dari keranjang
        await query(
            `DELETE FROM keranjang_item WHERE id = $1`,
            [parseInt(cartItemId)]
        );
        
        return NextResponse.json({
            status: 'success',
            message: 'Item berhasil dihapus dari keranjang'
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting cart item:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Gagal menghapus item dari keranjang',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}