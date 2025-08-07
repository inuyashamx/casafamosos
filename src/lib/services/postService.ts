import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { CloudinaryService } from '@/lib/cloudinary';

export class PostService {
  static async createPost(data: {
    userId: string;
    content: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
      publicId: string;
      thumbnail?: string;
    }>;
    links?: Array<{
      url: string;
      title?: string;
      description?: string;
      image?: string;
    }>;
  }) {
    await dbConnect();

    const post = new Post({
      userId: data.userId,
      content: data.content,
      media: data.media || [],
      links: data.links || [],
    });

    await post.save();
    return await Post.findById(post._id).populate('userId', 'name email image');
  }

  static async getPosts(page: number = 1, limit: number = 20) {
    await dbConnect();
    
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ isActive: true })
      .populate('userId', 'name email image')
      .populate('comments.userId', 'name email image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filtrar posts que tienen userId válido y comentarios con userId válido
    return posts
      .filter((post: any) => post.userId) // Solo posts con usuario válido
      .map((post: any) => ({
        ...post,
        comments: (post.comments || [])
          .filter((comment: any) => comment.userId) // Solo comentarios con usuario válido
          .map((comment: any) => ({
            ...comment,
            likes: comment.likes || []
          }))
      }));
  }

  static async getPostById(postId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId)
      .populate('userId', 'name email image')
      .populate('comments.userId', 'name email image')
      .lean();

    if (!post || !post.userId) return null; // Verificar que el post existe y tiene usuario válido

    // Filtrar comentarios con usuario válido
    return {
      ...post,
      comments: (post as any).comments
        .filter((comment: any) => comment.userId) // Solo comentarios con usuario válido
        .map((comment: any) => ({
          ...comment,
          likes: comment.likes || []
        }))
    };
  }

  static async getUserPosts(userId: string, page: number = 1, limit: number = 20) {
    await dbConnect();
    
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ userId, isActive: true })
      .populate('userId', 'name email image')
      .populate('comments.userId', 'name email image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filtrar posts que tienen userId válido y comentarios con userId válido
    return posts
      .filter((post: any) => post.userId) // Solo posts con usuario válido
      .map((post: any) => ({
        ...post,
        comments: (post.comments || [])
          .filter((comment: any) => comment.userId) // Solo comentarios con usuario válido
          .map((comment: any) => ({
            ...comment,
            likes: comment.likes || []
          }))
      }));
  }

  static async likePost(postId: string, userId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    return await post.addLike(userId);
  }

  static async unlikePost(postId: string, userId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    return await post.removeLike(userId);
  }

  static async addComment(postId: string, userId: string, content: string, media?: {
    type: 'image' | 'video';
    url: string;
    publicId: string;
    thumbnail?: string;
  }) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    await post.addComment(userId, content, media);
    return await Post.findById(postId)
      .populate('userId', 'name email image')
      .populate('comments.userId', 'name email image');
  }

  static async removeComment(postId: string, commentId: string, userId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    // Verificar que el comentario pertenece al usuario
    const comment = post.comments.find((c: any) => c._id.toString() === commentId);
    if (!comment) {
      throw new Error('Comentario no encontrado');
    }

    if (comment.userId.toString() !== userId) {
      throw new Error('No autorizado para eliminar este comentario');
    }

    // Eliminar imagen de Cloudinary si existe
    if (comment.media && comment.media.publicId) {
      try {
        await CloudinaryService.deleteMedia(comment.media.publicId, comment.media.type);
        console.log(`Imagen de comentario eliminada de Cloudinary: ${comment.media.publicId}`);
      } catch (error) {
        console.error(`Error eliminando imagen de comentario de Cloudinary: ${comment.media.publicId}`, error);
        // No lanzar error para no interrumpir la eliminación del comentario
      }
    }

    return await post.removeComment(commentId);
  }

  static async updateComment(postId: string, commentId: string, userId: string, content: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    // Verificar que el comentario pertenece al usuario
    const comment = post.comments.find((c: any) => c._id.toString() === commentId);
    if (!comment) {
      throw new Error('Comentario no encontrado');
    }

    if (comment.userId.toString() !== userId) {
      throw new Error('No autorizado para editar este comentario');
    }

    // Actualizar el contenido del comentario
    comment.content = content;
    await post.save();

    return await Post.findById(postId)
      .populate('userId', 'name email image')
      .populate('comments.userId', 'name email image');
  }

  static async likeComment(postId: string, commentId: string, userId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    return await post.addCommentLike(commentId, userId);
  }

  static async unlikeComment(postId: string, commentId: string, userId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    return await post.removeCommentLike(commentId, userId);
  }

  static async deletePost(postId: string, userId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    if (post.userId.toString() !== userId) {
      throw new Error('No autorizado para eliminar este post');
    }

    // Eliminar archivos de Cloudinary antes del hard delete
    if (post.media && post.media.length > 0) {
      const deletePromises = post.media.map(async (mediaItem: any) => {
        try {
          await CloudinaryService.deleteMedia(mediaItem.publicId, mediaItem.type);
          console.log(`Archivo eliminado de Cloudinary: ${mediaItem.publicId}`);
        } catch (error) {
          console.error(`Error eliminando archivo de Cloudinary: ${mediaItem.publicId}`, error);
          // No lanzar error para no interrumpir la eliminación del post
        }
      });

      // Esperar a que se eliminen todos los archivos
      await Promise.allSettled(deletePromises);
    }

    // Eliminar archivos de Cloudinary de los comentarios
    if (post.comments && post.comments.length > 0) {
      const commentDeletePromises = post.comments
        .filter((comment: any) => comment.media)
        .map(async (comment: any) => {
          try {
            await CloudinaryService.deleteMedia(comment.media!.publicId, comment.media!.type);
            console.log(`Archivo de comentario eliminado de Cloudinary: ${comment.media!.publicId}`);
          } catch (error) {
            console.error(`Error eliminando archivo de comentario de Cloudinary: ${comment.media!.publicId}`, error);
          }
        });

      await Promise.allSettled(commentDeletePromises);
    }

    // Hard delete - eliminar completamente de la base de datos
    await Post.findByIdAndDelete(postId);
    return { success: true };
  }

  static async updatePost(postId: string, userId: string, updates: {
    content?: string;
  }) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    if (post.userId.toString() !== userId) {
      throw new Error('No autorizado para editar este post');
    }

    if (updates.content !== undefined) {
      post.content = updates.content;
    }

    await post.save();
    return await Post.findById(postId)
      .populate('userId', 'name email image')
      .populate('comments.userId', 'name email image');
  }

  static async getPostsCount() {
    await dbConnect();
    return await Post.countDocuments({ isActive: true });
  }

  static async getUserPostsCount(userId: string) {
    await dbConnect();
    return await Post.countDocuments({ userId, isActive: true });
  }

  static async permanentlyDeletePost(postId: string, userId: string) {
    await dbConnect();
    
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post no encontrado');
    }

    if (post.userId.toString() !== userId) {
      throw new Error('No autorizado para eliminar este post');
    }

    // Eliminar archivos de Cloudinary
    if (post.media && post.media.length > 0) {
      const deletePromises = post.media.map(async (mediaItem: any) => {
        try {
          await CloudinaryService.deleteMedia(mediaItem.publicId, mediaItem.type);
          console.log(`Archivo eliminado de Cloudinary: ${mediaItem.publicId}`);
        } catch (error) {
          console.error(`Error eliminando archivo de Cloudinary: ${mediaItem.publicId}`, error);
        }
      });

      await Promise.allSettled(deletePromises);
    }

    // Hard delete - eliminar completamente de la base de datos
    await Post.findByIdAndDelete(postId);
    return { success: true };
  }
}