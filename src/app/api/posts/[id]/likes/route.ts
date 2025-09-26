import { NextRequest, NextResponse } from 'next/server';
import Post from '@/lib/models/Post';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    // Obtener reacciones con información completa de usuarios
    const reactionsWithUserInfo = await Promise.all(
      (post.reactions || []).map(async (reaction: any) => {
        const user = await User.findById(reaction.userId).select('name image team');
        return {
          userId: reaction.userId,
          type: reaction.type,
          reactedAt: reaction.reactedAt,
          user: {
            _id: user._id,
            name: user.name,
            image: user.image,
            team: user.team || null
          }
        };
      })
    );

    // Agrupar reacciones por tipo
    const reactionsByType = reactionsWithUserInfo.reduce((acc, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = [];
      }
      acc[reaction.type].push(reaction);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      reactions: reactionsWithUserInfo,
      reactionsByType,
      totalReactions: reactionsWithUserInfo.length
    });
  } catch (error) {
    console.error('Error fetching post reactions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 