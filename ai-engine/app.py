from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# 1. SETUP & KONEKSI DATABASE
load_dotenv() # Load env vars
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("❌ Error: DATABASE_URL tidak ditemukan. Pastikan file .env ada.")
    exit()

# Inisialisasi Engine Database
engine = create_engine(db_url)
print("✅ Terhubung ke Database untuk mengambil rekomendasi.")

app = Flask(__name__)
CORS(app) # Izinkan akses dari Next.js

# 2. ROUTE UTAMA
@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "Online", "message": "Foodie Recommendation API is running (Database Mode)"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Ambil data ID item yang ada di keranjang dari request Next.js
        data = request.json
        cart_item_ids = data.get('item_ids', [])

        # Validasi jika keranjang kosong
        if not cart_item_ids:
            return jsonify({"success": True, "recommendations": []})

        # 3. QUERY REKOMENDASI DARI DATABASE
        # Logika: "Cari di tabel ai_recommendations dimana trigger_item_id ada di dalam keranjang user"
        # Kita urutkan berdasarkan confidence tertinggi.
        
        query = text("""
            SELECT DISTINCT recommended_item_id
            FROM public.ai_recommendations
            WHERE trigger_item_id IN :ids
            AND recommended_item_id NOT IN :ids  -- Jangan rekomendasikan barang yang sudah ada di cart
            ORDER BY confidence DESC, lift DESC
            LIMIT 5
        """)

        # Eksekusi Query
        recommended_ids = []
        with engine.connect() as conn:
            # Kita perlu convert list ke tuple agar SQL IN clause bekerja, 
            # tapi SQLAlchemy menangani list params dengan baik biasanya.
            result = conn.execute(query, {"ids": tuple(cart_item_ids)})
            
            # Ambil hasil query (hanya kolom recommended_item_id)
            for row in result:
                recommended_ids.append(row[0])

        print(f"🛒 Cart: {cart_item_ids} -> 💡 Rekomendasi IDs: {recommended_ids}")

        return jsonify({
            "success": True, 
            "recommendations": recommended_ids
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Jalankan server di port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)