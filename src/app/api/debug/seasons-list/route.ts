import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Season from '@/lib/models/Season';

export async function GET() {
  try {
    await dbConnect();
    const seasons = await Season.find({}).select('_id name year status').sort({ year: -1 });
    return NextResponse.json({
      seasons: seasons.map(s => ({
        id: s._id,
        name: s.name,
        year: s.year,
        status: s.status
      }))
    });
  } catch (error: any) {
    console.error('Error en debug seasons list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 