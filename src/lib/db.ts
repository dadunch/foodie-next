// ==========================================
// 1. Install dependencies:
// npm install mysql2
// ==========================================

// ==========================================
// FILE: src/lib/db.ts
// Database connection configuration
// ==========================================
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'foodiepemweb-foodie2.b.aivencloud.com',
    port: parseInt(process.env.DB_PORT || '23801'),
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS_EZlmc-hCNd3lUvyxMq5',
    database: process.env.DB_DATABASE || 'db_foodie',
    ssl: {
        ca: fs.readFileSync(path.join(process.cwd(), 'ca.pem')),
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00' // Asia/Jakarta
    };

    // Create connection pool
    const pool = mysql.createPool(dbConfig);

    // Test connection
    export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
    }

    // Query helper function with proper typing
    export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
        const [results] = await pool.execute(sql, params);
        return results as T[];
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
    }

    export default pool;