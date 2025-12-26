import { NextResponse } from 'next/server';
import { Pool } from 'pg'; 
// CATATAN: Ganti import Pool ini dengan import db dari 'src/lib/db.ts' Anda 
// jika Anda sudah punya koneksi database terpusat.
// Contoh: import { db } from '@/lib/db';

// Setup koneksi sementara (jika belum ada di lib/db.ts)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const triggerItemId = searchParams.get('itemId');

  if (!triggerItemId) {
    return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
  }

  try {
    // Query mencari rekomendasi terbaik
    // Logic: Cari di tabel AI, tapi PASTIKAN item itu belum ada di keranjang user (opsional, perlu logic tambahan)
    const query = `
      SELECT 
        i.id, 
        i.nama_item, 
        i.harga_item, 
        i.foto_item, 
        ar.confidence
      FROM ai_recommendations ar
      JOIN item i ON ar.recommended_item_id = i.id
      WHERE ar.trigger_item_id = $1
      ORDER BY ar.confidence DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [triggerItemId]);
    
    // Jika tidak ada rekomendasi, kembalikan null
    if (result.rows.length === 0) {
      return NextResponse.json({ recommendation: null });
    }

    return NextResponse.json({ recommendation: result.rows[0] });
    
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}