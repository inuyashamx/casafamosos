import admin from '@/lib/firebase-admin';
import dbConnect from '@/lib/mongodb';
import UserPushSettings from '@/lib/models/UserPushSettings';
import Notification from '@/lib/models/Notification';
import mongoose from 'mongoose';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  link?: string;
  data?: Record<string, string>;
}

export class PushNotificationService {
  /**
   * Envía una push notification a un usuario específico
   */
  static async sendToUser(userId: string, notification: PushNotificationData) {
    try {
      await dbConnect();

      // Obtener settings del usuario
      const userSettings = await UserPushSettings.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!userSettings) {
        return { success: false, reason: 'no_settings' };
      }

      // Resetear contador diario si es necesario
      await userSettings.resetDailyCount();

      // Verificar si puede recibir push
      if (!userSettings.canReceivePush()) {
        return { success: false, reason: 'cannot_receive' };
      }

      // Enviar notificación via FCM
      const message: any = {
        token: userSettings.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        webpush: {
          notification: {
            icon: notification.icon || '/icon-192x192.png',
            ...(notification.image && { image: notification.image }),
          },
          fcmOptions: notification.link ? {
            link: notification.link,
          } : undefined,
        },
        data: notification.data || {},
      };

      const response = await admin.messaging().send(message);

      // Incrementar contador
      await userSettings.incrementPushCount();

      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('Error sending push notification:', error);

      // Si el token es inválido, deshabilitarlo
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        await this.disableUserPush(userId);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Envía push notification basada en una notificación del sistema
   */
  static async sendFromNotification(notificationId: string) {
    try {
      await dbConnect();

      const notification = await Notification.findById(notificationId)
        .populate('fromUserId', 'name image');

      if (!notification) {
        return { success: false, reason: 'notification_not_found' };
      }

      // Verificar preferencias del usuario para este tipo de notificación
      const userSettings = await UserPushSettings.findOne({
        userId: notification.userId,
      });

      if (!userSettings) {
        return { success: false, reason: 'no_settings' };
      }

      // Verificar preferencias según el tipo
      const shouldSend = this.checkNotificationPreferences(notification.type, userSettings);
      if (!shouldSend) {
        return { success: false, reason: 'user_preference_disabled' };
      }

      // Crear datos de la push notification
      const pushData: PushNotificationData = {
        title: 'Casa de los Famosos',
        body: notification.message,
        icon: '/icon-192x192.png',
        link: notification.navigationLink || '/',
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          ...(notification.postId && { postId: notification.postId.toString() }),
        },
      };

      const result = await this.sendToUser(notification.userId.toString(), pushData);

      // Actualizar la notificación con la fecha de envío
      if (result.success) {
        notification.lastPushSent = new Date();
        await notification.save();
      }

      return result;
    } catch (error: any) {
      console.error('Error sending push from notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica las preferencias del usuario para un tipo de notificación
   */
  private static checkNotificationPreferences(type: string, settings: any): boolean {
    switch (type) {
      case 'POST_LIKE':
      case 'POST_REACTION':
      case 'DEDICATION_LIKE':
        return settings.preferences.likes;
      case 'COMMENT':
      case 'COMMENT_LIKE':
      case 'COMMENT_REACTION':
        return settings.preferences.comments;
      default:
        return true; // Otros tipos siempre se envían
    }
  }

  /**
   * Guarda o actualiza el token FCM de un usuario
   */
  static async saveUserToken(userId: string, fcmToken: string) {
    try {
      await dbConnect();

      const settings = await UserPushSettings.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          fcmToken,
          isEnabled: true,
        },
        { upsert: true, new: true }
      );

      return { success: true, settings };
    } catch (error: any) {
      console.error('Error saving FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deshabilita push notifications para un usuario
   */
  static async disableUserPush(userId: string) {
    try {
      await dbConnect();

      await UserPushSettings.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        {
          isEnabled: false,
          fcmToken: null,
        }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error disabling push:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza las preferencias de push de un usuario
   */
  static async updateUserPreferences(userId: string, preferences: { likes?: boolean; comments?: boolean }) {
    try {
      await dbConnect();

      const settings = await UserPushSettings.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: { 'preferences': preferences } },
        { upsert: true, new: true }
      );

      return { success: true, settings };
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene la configuración de push de un usuario
   */
  static async getUserSettings(userId: string) {
    try {
      await dbConnect();

      const settings = await UserPushSettings.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });

      return settings;
    } catch (error: any) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }
}