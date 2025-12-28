import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

interface Order {
    id: number;
    keranjang_id: string;
    time: string;
    status: string;
    catatan: string | null;
    nominal_bayar: number;
    device_id: string | null;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const device_id = searchParams.get('device_id');
        const table_id = searchParams.get('table');

        
        if (!device_id) {
            return NextResponse.json({
                success: false,
                message: 'Device ID is required'
            }, { status: 400 });
        }

        if (!table_id) {
            return NextResponse.json({
                success: false,
                message: 'Table ID is required'
            }, { status: 400 });
        }

        // Decode table ID
        try {

            // Query untuk mendapatkan order history
            const ordersQuery = `
                SELECT 
                    *
                FROM "order" o
                WHERE o.device_id = $1
                ORDER BY o.time DESC
                LIMIT 50
            `;

            const orders = await query(ordersQuery, [device_id]);

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
                        let displayStatus: 'completed' | 'processing' | 'cancelled' | 'notpayyed' = 'processing';
                        if (order.status === 'Sudah Bayar' || order.status === 'Selesai') {
                            displayStatus = 'completed';
                        } else if (order.status === 'Batal' || order.status === 'Dibatalkan') {
                            displayStatus = 'cancelled';
                        } else if (order.status === 'Belum Bayar') {
                            displayStatus = 'notpayyed';
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