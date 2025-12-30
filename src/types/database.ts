export  interface Meja {
    id: number;
    nama_meja: string;
    status?: string;
    created_at?: Date;
}

export interface MenuItem {
    id: number;
    nama_item: string;
    deskripsi: string;
    harga_item: number;
    foto_item: string;
    merchant_id: number;
    nama_merchant?: string;
    category?: string;
}

export interface Merchant {
    id: number;
    nama_merchant: string;
    deskripsi: string;
    alamat?: string;
    telepon?: string;
}

export interface User {
    id: number;
    email: string;
    nama: string;
    password?: string;
}

export interface Keranjang {
    id: number;
    meja_id: number;
    pelanggan_id: number | null;
    created_at: string;
}

export interface KeranjangItem {
    id: number;
    keranjang_id: number;
    item_id: number;
    jumlah: number;
    harga: number;
    topping_ids: string[] | null;
    catatan: string | null;
    created_at: string;
}

export interface Order {
    id: number;
    keranjang_id: number;
    status: string;
    nominal_bayar: number;
    time: string;
    catatan: string | null;
    device_id: string | null;
}

export interface KategoriItem {
    id: number;
    kategori: string;
    foodcourt_id: number;
}

export interface item {
    id: number;
    nama_item: string;
    deskripsi: string;
    harga_item: number;
    foto_item: string;
    katalog_merchant_id: number;
    kategori_item_id: number;
}

export interface toping_item {
    id: number;
    item_id: number;
    nama_toping: string;
    harga: number;
}