import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { CloudinaryService } from '@/lib/cloudinary';

export class UserService {
  static async getUserProfile(userId: string) {
    await dbConnect();
    
    const user = await User.findById(userId).select('name email image nickname isAdmin createdAt');
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
    };
  }

  static async updateUserProfile(userId: string, updates: {
    name?: string;
    nickname?: string;
    image?: string;
    imagePublicId?: string;
  }) {
    await dbConnect();
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Actualizar campos si se proporcionan
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('El nombre no puede estar vacío');
      }
      user.name = updates.name.trim();
    }

    if (updates.nickname !== undefined) {
      // Permitir nickname vacío (para eliminarlo)
      const newNickname = updates.nickname.trim() || undefined;
      
      // Si hay un nuevo nickname, verificar que sea único
      if (newNickname && newNickname !== user.nickname) {
        const existingUser = await User.findOne({ nickname: newNickname });
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new Error('Este nickname ya está en uso');
        }
      }
      
      user.nickname = newNickname;
    }

    // Manejar actualización de imagen
    if (updates.image !== undefined || updates.imagePublicId !== undefined) {
      // Si hay una imagen anterior, eliminarla de Cloudinary
      if (user.imagePublicId) {
        try {
          await CloudinaryService.deleteMedia(user.imagePublicId, 'image');
          console.log(`Imagen anterior eliminada de Cloudinary: ${user.imagePublicId}`);
        } catch (error) {
          console.error(`Error eliminando imagen anterior de Cloudinary: ${user.imagePublicId}`, error);
          // No lanzar error para no interrumpir la actualización
        }
      }

      // Actualizar con la nueva imagen
      user.image = updates.image;
      user.imagePublicId = updates.imagePublicId;
    }

    await user.save();

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
    };
  }
} 