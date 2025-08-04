import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        session: null 
      }, { status: 401 });
    }

    // Obtener usuario de la base de datos
    const user = await User.findById((session.user as { id: string }).id);
    
    return NextResponse.json({
      session: {
        user: session.user,
        isAdmin: (session.user as any).isAdmin
      },
      database: {
        user: user ? {
          id: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        } : null
      },
      comparison: {
        sessionIsAdmin: (session.user as any).isAdmin,
        databaseIsAdmin: user?.isAdmin,
        match: (session.user as any).isAdmin === user?.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Error en debug admin-check:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 