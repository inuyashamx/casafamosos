import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import UserPushSettings from '@/lib/models/UserPushSettings';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export interface CreateNotificationData {
  userId: string;
  fromUserId: string;
  type: 'POST_LIKE' | 'COMMENT' | 'COMMENT_LIKE';
  postId: string;
  commentId?: string;
  message: string;
}

export class NotificationService {
  static async create(data: CreateNotificationData) {
    await dbConnect();

    // Prevenir auto-notificaciones
    if (data.userId === data.fromUserId) {
      return null;
    }

    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(data.userId),
      fromUserId: new mongoose.Types.ObjectId(data.fromUserId),
      type: data.type,
      postId: new mongoose.Types.ObjectId(data.postId),
      commentId: data.commentId ? new mongoose.Types.ObjectId(data.commentId) : undefined,
      message: data.message,
    });

    await notification.save();

    // Poblar datos para retornar
    const populatedNotification = await Notification.findById(notification._id)
      .populate('fromUserId', 'name image')
      .lean();

    return populatedNotification;
  }

  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    await dbConnect();

    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId(userId)
    })
      .populate('fromUserId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalNotifications = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId)
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total: totalNotifications,
        pages: Math.ceil(totalNotifications / limit),
      }
    };
  }

  static async getUnreadCount(userId: string) {
    await dbConnect();

    return await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      read: false,
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    await dbConnect();

    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return notification;
  }

  static async markAllAsRead(userId: string) {
    await dbConnect();

    const result = await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        read: false
      },
      { read: true }
    );

    return result.modifiedCount;
  }

  static async getRecentNotifications(userId: string, limit: number = 5) {
    await dbConnect();

    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId(userId)
    })
      .populate('fromUserId', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return notifications;
  }

  static async deleteNotification(notificationId: string, userId: string) {
    await dbConnect();

    const notification = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return { success: true };
  }

  static async deleteAllNotifications(userId: string) {
    await dbConnect();

    const result = await Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount;
  }

  // Método helper para crear notificaciones específicas
  static async createPostLikeNotification(postOwnerId: string, likerId: string, postId: string, likerName: string) {
    return await this.create({
      userId: postOwnerId,
      fromUserId: likerId,
      type: 'POST_LIKE',
      postId,
      message: `${likerName} le dio like a tu post`,
    });
  }

  static async createCommentNotification(postOwnerId: string, commenterId: string, postId: string, commenterName: string) {
    return await this.create({
      userId: postOwnerId,
      fromUserId: commenterId,
      type: 'COMMENT',
      postId,
      message: `${commenterName} comentó en tu post`,
    });
  }

  static async createCommentLikeNotification(commentOwnerId: string, likerId: string, postId: string, commentId: string, likerName: string) {
    return await this.create({
      userId: commentOwnerId,
      fromUserId: likerId,
      type: 'COMMENT_LIKE',
      postId,
      commentId,
      message: `${likerName} le dio like a tu comentario`,
    });
  }
}