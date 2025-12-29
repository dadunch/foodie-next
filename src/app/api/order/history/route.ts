import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

interface OrderHistoryItem {
    order_id: number;
    order_number: string;
    tanggal: string;
    waktu: string;
    status: string;
    total: number;
    catatan: string | null;
    nama_meja: string;
    device_id: string | null;
    items: {
        id: number;
        nama_item: string;
        jumlah: number;
        harga: number;
        foto_item: string;
        toppings: Array<{
            id: number;
            nama_toping: string;
            harga: number;
        }>;
    }[];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const encodedIda = searchParams.get('device_id');
        
        if (!encodedIda) {
            return NextResponse.json({
                success: false,
                message: 'Device ID is required'
            }, { status: 400 });
        }

        // Decode table ID
        try {

            // Query untuk mendapatkan order history
            const ordersQuery = `
                SELECT 
                    o.id as order_id,
                    CONCAT('ORD-', TO_CHAR(o.time, 'YYYY'), '-', LPAD(o.id::text, 3, '0')) as order_number,
                    TO_CHAR(o.time, 'YYYY-MM-DD') as tanggal,
                    TO_CHAR(o.time, 'HH24:MI') as waktu,
                    o.status,
                    o.nominal_bayar as total,
                    o.catatan,
                    o.device_id,
                    m.nama_meja,
                    k.id as keranjang_id,
                    fc.nama_foodcourt,
                    fc.id as foodcourt_id
                FROM "order" o
                JOIN keranjang k ON o.keranjang_id = k.id
                JOIN meja m ON k.meja_id = m.id
                JOIN foodcourt fc ON fc.id = m.foodcourt_id
                WHERE o.device_id = $1
                ORDER BY o.time DESC
                LIMIT 50
            `;

            const orders = await query(ordersQuery, [encodedIda]);

            // Jika tidak ada order, return empty array
            if (orders.length === 0) {
                return NextResponse.json({
                    success: true,
                    data: []
                });
            }

            // Ambil detail items untuk setiap order
            const ordersWithItems = await Promise.all(
                orders.map(async (order: any) => {
                    try {
                        // Query items dalam keranjang
                        const itemsQuery = `
                            SELECT 
                                ki.id,
                                ki.item_id,
                                ki.jumlah,
                                ki.harga,
                                ki.topping_ids,
                                i.nama_item,
                                i.foto_item
                            FROM keranjang_item ki
                            JOIN item i ON ki.item_id = i.id
                            WHERE ki.keranjang_id = $1
                            ORDER BY ki.id ASC
                        `;

                        const items = await query(itemsQuery, [order.keranjang_id]);

                        // Proses items dengan toppings
                        const itemsWithToppings = await Promise.all(
                            items.map(async (item: any) => {
                                let toppings: Array<{ id: number; nama_toping: string; harga: number }> = [];

                                if (item.topping_ids && Array.isArray(item.topping_ids) && item.topping_ids.length > 0) {
                                    try {
                                        const toppingQuery = `
                                            SELECT 
                                                id,
                                                nama_toping,
                                                harga
                                            FROM toping_item
                                            WHERE id = ANY($1::int[])
                                        `;
                                        
                                        const toppingResult = await query(toppingQuery, [item.topping_ids]);
                                        toppings = toppingResult.map((t: any) => ({
                                            id: t.id,
                                            nama_toping: t.nama_toping,
                                            harga: t.harga
                                        }));
                                    } catch (toppingError) {
                                        console.error('Error fetching toppings:', toppingError);
                                    }
                                }

                                return {
                                    id: item.item_id,
                                    nama_item: item.nama_item,
                                    jumlah: item.jumlah,
                                    harga: Number(item.harga),
                                    foto_item: item.foto_item || 'default.jpg',
                                    toppings
                                };
                            })
                        );

                        // Map status dari database ke frontend format
                        let displayStatus: 'completed' | 'processing' | 'cancelled' | 'notpayyed' | 'notprocessed' = 'processing' ;
                        if (order.status === 'Sudah Bayar' || order.status === 'Selesai') {
                            displayStatus = 'completed';
                        } else if (order.status === 'Batal' || order.status === 'Dibatalkan') {
                            displayStatus = 'cancelled';
                        } else if (order.status === 'Belum Bayar') {
                            displayStatus = 'notpayyed';
                        } else if (order.status === 'Belum Diproses') {
                            displayStatus = 'notprocessed';
                        }

                        return {
                            id: order.order_id,
                            order_number: order.order_number,
                            tanggal: order.tanggal,
                            waktu: order.waktu,
                            status: displayStatus,
                            total: Number(order.total),
                            catatan: order.catatan,
                            nama_meja: order.nama_meja,
                            device_id: order.device_id,
                            nama_foodcourt: order.nama_foodcourt,
                            foodcourt_id: order.foodcourt_id,
                            items: itemsWithToppings
                        };
                    } catch (orderError) {
                        console.error('Error processing order:', orderError);
                        return null;
                    }
                })
            );

            // Filter out null results
            const validOrders = ordersWithItems.filter(order => order !== null);

            return NextResponse.json({
                success: true,
                data: validOrders
            });

        } catch (decodeError) {
            console.error('Error decoding table ID:', decodeError);
            return NextResponse.json({
                success: false,
                message: 'Invalid table parameter',
                details: decodeError instanceof Error ? decodeError.message : 'Unknown error'
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Error fetching order history:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch order history',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}