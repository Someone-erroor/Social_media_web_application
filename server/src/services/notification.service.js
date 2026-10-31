import { Notification } from '../models/index.js';

/**
 * Retrieves paginated notifications for the authenticated user.
 *
 * @param {object} params
 * @param {string} params.userId - Recipient user ObjectId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=15]
 * @returns {Promise<{ notifications: object[], unreadCount: number, pagination: object }>}
 */
export const getUserNotifications = async ({ userId, page = 1, limit = 15 }) => {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 15));
  const skip = (pageNum - 1) * limitNum;

  const filter = { recipient: userId };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('actor', 'fullName email role profile.avatarUrl'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, readAt: null })
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Counts unread notifications for a user.
 *
 * @param {string} userId - Recipient user ObjectId
 * @returns {Promise<number>} Unread notification count
 */
export const getUnreadNotificationCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, readAt: null });
};

/**
 * Marks a single notification as read.
 * Enforces recipient ownership.
 *
 * @param {object} params
 * @param {string} params.notificationId
 * @param {string} params.userId
 * @returns {Promise<object>} Updated notification
 */
export const markNotificationAsRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const error = new Error('Notification not found.');
    error.status = 404;
    throw error;
  }

  // Ownership verification
  if (notification.recipient.toString() !== userId.toString()) {
    const error = new Error('Access denied. You cannot modify notifications belonging to another user.');
    error.status = 403;
    throw error;
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  await notification.populate('actor', 'fullName email role profile.avatarUrl');
  return notification;
};

/**
 * Marks all notifications for a user as read.
 *
 * @param {string} userId - Recipient user ObjectId
 * @returns {Promise<number>} Number of marked notifications
 */
export const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return result.modifiedCount;
};

