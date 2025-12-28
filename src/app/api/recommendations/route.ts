import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Setup koneksi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

export async function POST(request: Request) {
  try {
    // 1. Terima data item_ids (Array ID barang di keranjang) dari Frontend
    const body = await request.json();
    const { item_ids } = body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. Query SQL
    // Penjelasan Logic:
    // - Cari di tabel ai_recommendations dimana trigger_item_id ADA di dalam keranjang user.
    // - JOIN dengan tabel item untuk mengambil nama/foto/harga.
    // - WHERE ... NOT = ANY($1) -> Pastikan item rekomendasi BELUM ada di keranjang user.
    // - ORDER BY confidence -> Urutkan dari yang paling akurat.
    // - LIMIT 5 -> Batasi 5 rekomendasi saja.

    const query = `
      SELECT DISTINCT
        i.id, 
        i.nama_item, 
        i.harga_item, 
        i.foto_item, 
        ar.confidence
      FROM ai_recommendations ar
      JOIN item i ON ar.recommended_item_id = i.id
      WHERE ar.trigger_item_id = ANY($1) 
      AND ar.recommended_item_id != ALL($1)
      ORDER BY ar.confidence DESC
      LIMIT 5
    `;

    // $1 akan digantikan oleh array item_ids
    const result = await pool.query(query, [item_ids]);
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
    
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}