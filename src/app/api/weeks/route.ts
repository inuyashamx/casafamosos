import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WeekService } from '@/lib/services/weekService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const weekId = searchParams.get('id');
    const action = searchParams.get('action');

    if (weekId && action === 'results') {
      const results = await WeekService.getWeekResults(weekId);
      return NextResponse.json(results);
    }

    if (weekId) {
      const week = await WeekService.getWeekById(weekId);
      if (!week) {
        return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 });
      }
      return NextResponse.json(week);
    }

    if (seasonId) {
      if (action === 'active') {
        const activeWeek = await WeekService.getActiveWeek(seasonId);
        return NextResponse.json(activeWeek);
      }

      if (action === 'current') {
        const currentWeek = await WeekService.getCurrentWeek(seasonId);
        return NextResponse.json(currentWeek);
      }

      const weeks = await WeekService.getWeeksBySeason(seasonId);
      return NextResponse.json(weeks);
    }

    return NextResponse.json({ error: 'seasonId requerido' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en GET /api/weeks:', error);
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
    const { action, ...weekData } = data;

    if (action === 'startVoting') {
      const week = await WeekService.startVoting(weekData.weekId);
      return NextResponse.json(week);
    }

    if (action === 'endVoting') {
      const week = await WeekService.endVoting(weekData.weekId);
      return NextResponse.json(week);
    }

    if (action === 'addNominee') {
      const week = await WeekService.addNominee(weekData.weekId, weekData.candidateId);
      return NextResponse.json(week);
    }

    if (action === 'removeNominee') {
      const week = await WeekService.removeNominee(weekData.weekId, weekData.candidateId);
      return NextResponse.json(week);
    }

    if (action === 'resetVotes') {
      const week = await WeekService.resetWeekVotes(weekData.weekId);
      return NextResponse.json(week);
    }

    if (action === 'eliminateCandidate') {
      const week = await WeekService.eliminateCandidate(weekData.weekId, weekData.candidateId);
      return NextResponse.json(week);
    }

    // Crear nueva semana
    const week = await WeekService.createWeek({
      seasonId: weekData.seasonId,
      weekNumber: weekData.weekNumber,
      name: weekData.name,
      startDate: new Date(weekData.startDate),
      endDate: new Date(weekData.endDate),
      votingStartDate: new Date(weekData.votingStartDate),
      votingEndDate: new Date(weekData.votingEndDate),
      settings: weekData.settings,
    });

    return NextResponse.json(week, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/weeks:', error);
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
    const { weekId, ...updateData } = data;

    const week = await WeekService.updateWeek(weekId, updateData);
    if (!week) {
      return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 });
    }

    return NextResponse.json(week);

  } catch (error: any) {
    console.error('Error en PUT /api/weeks:', error);
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
    const weekId = searchParams.get('id');

    if (!weekId) {
      return NextResponse.json({ error: 'ID de semana requerido' }, { status: 400 });
    }

    const result = await WeekService.deleteWeek(weekId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error en DELETE /api/weeks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 