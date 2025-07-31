import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CandidateService } from '@/lib/services/candidateService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const candidateId = searchParams.get('id');
    const action = searchParams.get('action');

    if (candidateId) {
      const candidate = await CandidateService.getCandidateById(candidateId);
      if (!candidate) {
        return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
      }
      return NextResponse.json(candidate);
    }

    if (seasonId) {
      if (action === 'active') {
        const candidates = await CandidateService.getActiveCandidates(seasonId);
        return NextResponse.json(candidates);
      }

      if (action === 'eliminated') {
        const candidates = await CandidateService.getEliminatedCandidates(seasonId);
        return NextResponse.json(candidates);
      }

      if (action === 'withRealStats') {
        const candidates = await CandidateService.getCandidatesWithRealStats(seasonId);
        return NextResponse.json(candidates);
      }

      const candidates = await CandidateService.getCandidatesBySeason(seasonId);
      return NextResponse.json(candidates);
    }

    return NextResponse.json({ error: 'seasonId requerido' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en GET /api/candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { action, ...candidateData } = data;

    if (action === 'eliminate') {
      const candidate = await CandidateService.eliminateCandidate(
        candidateData.candidateId,
        candidateData.weekNumber,
        candidateData.reason
      );
      return NextResponse.json(candidate);
    }

    if (action === 'reactivate') {
      const candidate = await CandidateService.reactivateCandidate(candidateData.candidateId);
      return NextResponse.json(candidate);
    }

    // Crear nuevo candidato
    const candidate = await CandidateService.createCandidate(candidateData);
    return NextResponse.json(candidate, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { candidateId, ...updateData } = data;

    const candidate = await CandidateService.updateCandidate(candidateId, updateData);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(candidate);

  } catch (error: any) {
    console.error('Error en PUT /api/candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('id');

    if (!candidateId) {
      return NextResponse.json({ error: 'ID de candidato requerido' }, { status: 400 });
    }

    const result = await CandidateService.deleteCandidate(candidateId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error en DELETE /api/candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
