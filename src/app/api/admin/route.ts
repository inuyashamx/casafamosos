import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminService } from '@/lib/services/adminService';
import User from '@/lib/models/User';

async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: 'No autorizado', status: 401 };
  }

  const user = await User.findById((session.user as { id: string }).id);
  if (!user?.isAdmin) {
    return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const seasonId = searchParams.get('seasonId');

    switch (action) {
      case 'stats':
        if (!seasonId) {
          return NextResponse.json({ error: 'seasonId requerido' }, { status: 400 });
        }
        const stats = await AdminService.getDashboardStats(seasonId);
        return NextResponse.json({ stats });
      
      case 'dashboard':
        const dashboardStats = await AdminService.getDashboardStats(seasonId || '');
        return NextResponse.json(dashboardStats);

      case 'users':
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const users = await AdminService.getUsersManagement(page, limit, search, sortBy, sortOrder);
        return NextResponse.json(users);

      case 'checkAdmin':
        return NextResponse.json({ isAdmin: true });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en GET /api/admin:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'createSeason':
        const { name, year, description, startDate, endDate, dailyPointsDefault } = body;
        const season = await AdminService.createSeason({
          name,
          year,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          dailyPointsDefault,
        });
        return NextResponse.json({ season });

      case 'createCandidate':
        const candidateData = body.candidateData;
        const candidate = await AdminService.createCandidate(candidateData);
        return NextResponse.json({ candidate });

      case 'setNominated':
        const { candidateIds, seasonId } = body;
        const nominees = await AdminService.setNominated(candidateIds, seasonId);
        return NextResponse.json({ nominees });

      case 'eliminateCandidate':
        const { candidateId } = body;
        const eliminated = await AdminService.eliminateCandidate(candidateId);
        return NextResponse.json({ candidate: eliminated });

      case 'resetWeeklyVotes':
        const resetResult = await AdminService.resetWeeklyVotes(body.seasonId);
        return NextResponse.json(resetResult);

      case 'resetWeekVotes':
        const resetWeekResult = await AdminService.resetWeekVotes(body.weekId);
        return NextResponse.json(resetWeekResult);

      case 'toggleUserStatus':
        const { userId } = body;
        const user = await AdminService.toggleUserStatus(userId);
        return NextResponse.json({ user });

      case 'blockUser':
        const { userId: blockUserId, reason } = body;
        const authCheck = await checkAdminAuth();
        const blockedUser = await AdminService.blockUser(blockUserId, reason, (authCheck.user as { id: string }).id);
        return NextResponse.json({ user: blockedUser });

      case 'unblockUser':
        const { userId: unblockUserId } = body;
        const unblockedUser = await AdminService.unblockUser(unblockUserId);
        return NextResponse.json({ user: unblockedUser });

      case 'toggleAdminStatus':
        const { userId: adminUserId } = body;
        const adminUser = await AdminService.toggleAdminStatus(adminUserId);
        return NextResponse.json({ user: adminUser });

      case 'deleteUser':
        const { userId: deleteUserId } = body;
        const deleteResult = await AdminService.deleteUser(deleteUserId);
        return NextResponse.json(deleteResult);

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error en POST /api/admin:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
} 