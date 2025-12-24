import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { Merchant } from '@/types/database';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const foodcourtId = searchParams.get('foodcourt_id');
            let sqlQuery = `
        SELECT DISTINCT m.*
        FROM merchant m
        `;
        const params: any[] = [];

        if (foodcourtId) {
            sqlQuery += `
                WHERE m.foodcourt_id = $1
            `;
            params.push(foodcourtId);
        }
        const merchants = await query<Merchant>(sqlQuery, params);

        return NextResponse.json({
            success: true,
            data: merchants
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch merchants',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
