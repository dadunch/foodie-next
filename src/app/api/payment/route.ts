import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

interface Order {
    id: number;
    keranjang_id: number;
    status: string;
    time: string;
    catatan: string;
    nominal_bayar: number;
    device_id: string;
    meja_id: number;
    pelanggan_id: number | null;
    created_at: string;
}

interface Pembayaran {
    id: number;
    order_id: number;
    nominal_bayar: number;
    created_at: string;
    tanggal_bayar: string;
    waktu_bayar: string;
    metode_pembayaran_id: number;
}

interface LogPembayaran {
    id: number;
    pembayaran_id: number;
    user_id: number | null;
    created_at: string;
    device_id: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const {
            table_id,
            metode_pembayaran_id,
            nominal_bayar,
            device_id
        } = body;

        // Validasi input
        if (!table_id || !metode_pembayaran_id || !nominal_bayar) {
            return NextResponse.json({
                success: false,
                message: 'Data tidak lengkap'
            }, { status: 400 });
        }

        // 1. Fetch order data berdasarkan table_id
        console.log('🔍 Fetching order data for table_id:', table_id);
        const orderResponse = await fetch(`${request.headers.get('origin')}/api/order?table=${table_id}`);
        const orderData = await orderResponse.json();

        console.log('📦 Order Response:', JSON.stringify(orderData, null, 2));

        if (!orderData.success || !orderData.data) {
            console.error('❌ Order not found or invalid response');
            return NextResponse.json({
                success: false,
                message: 'Order tidak ditemukan'
            }, { status: 404 });
        }

        const order = orderData.data;
        const order_id = order.id;

        console.log('✅ Order ID:', order_id);
        console.log('📋 Order Data:', JSON.stringify(order, null, 2));

        // 2. Cek metode pembayaran
        const isQris = metode_pembayaran_id === 2;
        const isCash = metode_pembayaran_id === 1;

        // 3. Update status order
        if (isQris) {
            await query(
                `UPDATE "order" SET status = $1 WHERE id = $2`,
                ['Belum diproses', order_id]
            );
            console.log('✅ Order status updated successfully');
        } else {
            console.log('ℹ️ Cash payment - order status remains "Belum Dibayar"');
        }
        // Untuk CASH, status tetap "Belum Dibayar" (tidak perlu update)

        // 4. Insert ke table pembayaran
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const tanggalBayar = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const waktuBayar = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS

        console.log('💰 Preparing payment insert:');
        console.log('   - order_id:', order_id, '(type:', typeof order_id, ')');
        console.log('   - nominal_bayar:', nominal_bayar, '(type:', typeof nominal_bayar, ')');
        console.log('   - tanggal_bayar:', tanggalBayar);
        console.log('   - waktu_bayar:', waktuBayar);
        console.log('   - metode_pembayaran_id:', metode_pembayaran_id, '(type:', typeof metode_pembayaran_id, ')');

        const pembayaranResult = await query<Pembayaran>(
            `INSERT INTO pembayaran (order_id, nominal_bayar, tanggal_bayar, waktu_bayar, metode_pembayaran_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [order_id, nominal_bayar, tanggalBayar, waktuBayar, metode_pembayaran_id]
        );

        console.log('✅ Payment inserted successfully:', pembayaranResult[0]);

        if (pembayaranResult.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Gagal membuat pembayaran'
            }, { status: 500 });
        }

        const pembayaran = pembayaranResult[0];

        // 5. Jika QRIS, insert ke log_pembayaran dan generate QR code
        if (isQris) {
            console.log('📝 Inserting log_pembayaran for QRIS payment');
            // Insert ke log_pembayaran
            await query<LogPembayaran>(
                `INSERT INTO log_pembayaran (pembayaran_id, user_id, device_id) 
                 VALUES ($1, $2, $3)`,
                [pembayaran.id, null, device_id || null]
            );
            console.log('✅ Log pembayaran inserted successfully');

            console.log('🎨 Generating QR Code for order_id:', order_id);
            // Generate QR Code dengan isi order_id
            const qrCodeDataUrl = await QRCode.toDataURL(order_id.toString(), {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            console.log('✅ QR Code generated successfully');

            return NextResponse.json({
                success: true,
                payment_id: pembayaran.id,
                order_id: order_id,
                qr_url: `${request.headers.get('origin')}/qrProcess/${order_id}`,
                qr_code_base64: qrCodeDataUrl,
                message: 'Pembayaran QRIS berhasil dibuat'
            });
        }

        // 6. Jika CASH, return tanpa QR code
        if (isCash) {
            console.log('💵 Cash payment completed successfully');
            return NextResponse.json({
                success: true,
                payment_id: pembayaran.id,
                order_id: order_id,
                message: 'Silakan membayar di kasir'
            });
        }

        // Fallback
        return NextResponse.json({
            success: false,
            message: 'Metode pembayaran tidak valid'
        }, { status: 400 });

    } catch (error) {
        console.error('Payment Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}