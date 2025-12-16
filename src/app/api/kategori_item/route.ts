import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const kategoriItem = await prisma.kategori_item.findMany();

        return NextResponse.json({
        success: true,
        data: kategoriItem,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
        { success: false, error: 'Failed to fetch kategori_item' },
        { status: 500 }
        );
    }
}