import { Pool } from 'pg'; // Ganti dari mysql2 ke pg

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
        const result = await pool.query(sql, params);
        return result.rows as T[];
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}