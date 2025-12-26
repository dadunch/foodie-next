import os
import pandas as pd
from sqlalchemy import create_engine, text
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
from dotenv import load_dotenv

# 1. SETUP KONEKSI
load_dotenv() # Load password dari file .env
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL tidak ditemukan di file .env")
    exit()

engine = create_engine(db_url)

print("--- MEMULAI PROSES TRAINING AI ---")

# 2. TARIK DATA DARI DATABASE
# Kita join keranjang -> keranjang_item -> item -> order
query = """
SELECT 
    k.id as session_id,
    i.nama_item,
    i.id as item_id,
    CASE 
        WHEN o.id IS NOT NULL AND o.status != 'cancelled' THEN 'PAID' 
        ELSE 'ABANDONED' 
    END as status
FROM public.keranjang k
JOIN public.keranjang_item ki ON k.id = ki.keranjang_id
JOIN public.item i ON ki.item_id = i.id
LEFT JOIN public."order" o ON k.id = o.keranjang_id
WHERE k.created_at >= NOW() - INTERVAL '1 year' 
"""

print("1. Mengambil data transaksi...")
try:
    df = pd.read_sql(query, engine)
except Exception as e:
    print(f"Gagal connect database: {e}")
    exit()

if df.empty:
    print("Data kosong! Belum ada transaksi untuk dipelajari.")
    exit()

# 3. BERSIHKAN DATA (CLEANING)
print(f"2. Membersihkan {len(df)} baris data mentah...")

transactions = []
item_map = {} # Simpan ID item

grouped = df.groupby('session_id')

for session_id, group in grouped:
    items = group['nama_item'].tolist()
    ids = group['item_id'].tolist()
    status = group['status'].iloc[0]
    
    # Mapping nama ke ID (untuk insert nanti)
    for name, iid in zip(items, ids):
        item_map[name] = iid
    
    unique_items = list(set(items))
    
    # LOGIKA FILTER:
    # 1. Abaikan keranjang cuma 1 item (tidak ada pasangan)
    if len(unique_items) < 2:
        continue
    
    # 2. Ambil semua yang PAID. Ambil ABANDONED hanya jika niatnya kuat (item >= 3)
    if status == 'PAID':
        transactions.append(unique_items)
    elif status == 'ABANDONED' and len(unique_items) >= 3:
        transactions.append(unique_items)

print(f"   Total Transaksi Valid: {len(transactions)}")

if len(transactions) == 0:
    print("Tidak ada transaksi yang memenuhi syarat (minimal 2 item).")
    exit()

# 4. TRAINING (MENCARI POLA)
print("3. Mencari pola asosiasi...")

te = TransactionEncoder()
te_ary = te.fit(transactions).transform(transactions)
df_encoded = pd.DataFrame(te_ary, columns=te.columns_)

# min_support 0.01 = Pola harus muncul minimal di 1% transaksi
# Jika data masih sedikit, naikkan ke 0.1 atau 0.05 supaya ada hasil
frequent_itemsets = apriori(df_encoded, min_support=0.01, use_colnames=True)

if frequent_itemsets.empty:
    print("   Tidak ditemukan pola yang cukup sering muncul. Coba turunkan min_support.")
    exit()

# Cari Lift > 1 (Hubungan Kuat)
rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.1)
rules = rules.sort_values(['confidence', 'lift'], ascending=[False, False])

print(f"   Ditemukan {len(rules)} aturan rekomendasi.")

# 5. SIMPAN KE DATABASE
print("4. Menyimpan ke tabel ai_recommendations...")

with engine.connect() as conn:
    # Kosongkan tabel lama
    conn.execute(text("TRUNCATE TABLE public.ai_recommendations RESTART IDENTITY"))
    
    count = 0
    for index, row in rules.iterrows():
        # Ambil 1 item pemicu dan 1 item rekomendasi
        antecedents = list(row['antecedents'])
        consequents = list(row['consequents'])
        
        # Kita hanya ambil aturan "1 on 1" agar sederhana (Misal: Nasi Goreng -> Es Teh)
        if len(antecedents) == 1 and len(consequents) == 1:
            trigger_name = antecedents[0]
            rec_name = consequents[0]
            
            trigger_id = item_map.get(trigger_name)
            rec_id = item_map.get(rec_name)
            
            if trigger_id and rec_id:
                stmt = text("""
                    INSERT INTO public.ai_recommendations 
                    (trigger_item_id, recommended_item_id, confidence, lift)
                    VALUES (:tid, :rid, :conf, :lift)
                """)
                conn.execute(stmt, {
                    "tid": trigger_id, 
                    "rid": rec_id, 
                    "conf": row['confidence'], 
                    "lift": row['lift']
                })
                count += 1
    
    conn.commit()

print(f"SELESAI! {count} rekomendasi siap digunakan di website.")