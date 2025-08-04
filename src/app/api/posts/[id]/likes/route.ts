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
    const post = await Post.findById(id).populate('likes.userId', 'name email image');
    
    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    // Obtener información completa de los usuarios que dieron like
    const likesWithUserInfo = await Promise.all(
      post.likes.map(async (like: any) => {
        const user = await User.findById(like.userId).select('name email image');
        return {
          userId: like.userId,
          likedAt: like.likedAt,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        };
      })
    );

    return NextResponse.json({
      likes: likesWithUserInfo,
      totalLikes: likesWithUserInfo.length
    });
  } catch (error) {
    console.error('Error fetching post likes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 