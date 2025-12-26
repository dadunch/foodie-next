import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Order } from '@/types/database';


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
        const twentyMinutesAgo = new Date();
        twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);

        const cartItems = await query<Order>(
            `SELECT o.*, k.*
            FROM "order" o
            JOIN keranjang k ON o.keranjang_id = k.id
            WHERE k.meja_id = $1 AND k.created_at >= $2
            ORDER BY o.time DESC
            LIMIT 1`,
            [tableId, twentyMinutesAgo.toISOString()]
        );

        if (cartItems.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Cart is empty',
                data: null
            });
        }

        return NextResponse.json({
            success: true,
            data: cartItems[0]
        });;
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
        // Change from formData() to json()
        const body = await request.json();
        
        const keranjang_id = body.cartId as string;
        const notes = body.catatan as string || '';
        const price = body.nominalBayar; // Use nominalBayar from the request
        const status = "Belum Bayar";
        const time = new Date().toISOString();

        // Validasi input
        if (!keranjang_id || !price) {
            return NextResponse.json({
                status: 'error',
                message: 'Data tidak lengkap'
            }, { status: 400 });
        }

        // check if order for the cart already exists
        const existingOrder = await query<Order>(
            `SELECT * FROM "order" WHERE keranjang_id = $1`,
            [keranjang_id]
        );
        
        if (existingOrder.length > 0) {
            if (existingOrder[0].nominal_bayar === price) {
                return NextResponse.json({
                    success: true,
                    status: 'success',
                    message: 'Order sudah ada untuk keranjang ini',
                    data: {
                        keranjang_id: keranjang_id,
                        item: existingOrder[0]
                    }
                });
            } else {
                // update existing order with new price
                const updatedOrder = await query<Order>(
                    `UPDATE "order" 
                        SET nominal_bayar = $1, catatan = $2, time = $3
                        WHERE keranjang_id = $4
                     RETURNING *`,
                    [
                        price,
                        notes,
                        time,
                        keranjang_id
                    ]
                );
                return NextResponse.json({
                    success: true,
                    status: 'success',
                    message: 'Order sudah ada untuk keranjang ini, harga diperbarui',
                    data: {
                        keranjang_id: keranjang_id,
                        item: updatedOrder[0]
                    }
                });
            }
        }
        const orderQuery = await query<Order>(
            `INSERT INTO "order" (keranjang_id, status, time, catatan, nominal_bayar) 
                VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [
                keranjang_id,
                status,
                time,
                notes,
                price
            ]
        );

        if (orderQuery.length === 0) {
            return NextResponse.json({
                status: 'error',
                message: 'Gagal membuat order'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true, // Add this for consistency with your frontend check
            status: 'success',
            message: 'Order berhasil dibuat',
            data: {
                keranjang_id: keranjang_id,
                item: orderQuery[0]
            }
        });

    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json({
            success: false,
            status: 'error',
            message: 'Terjadi kesalahan server',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
