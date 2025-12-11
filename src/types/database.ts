export interface Table {
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
