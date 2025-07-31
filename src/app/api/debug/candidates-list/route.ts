import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    
    if (!seasonId) {
      return NextResponse.json({ error: 'seasonId requerido' }, { status: 400 });
    }

    const candidates = await Candidate.find({ seasonId }).select('_id name stats').sort({ name: 1 });
    
    return NextResponse.json({
      candidates: candidates.map(c => ({
        id: c._id,
        name: c.name,
        stats: c.stats
      }))
    });

  } catch (error: any) {
    console.error('Error en debug candidates list:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 