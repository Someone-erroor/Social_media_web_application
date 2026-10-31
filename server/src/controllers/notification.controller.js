import { isValidObjectId } from '../validators/comment.validator.js';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notification.service.js';

/**
 * Retrieves paginated notifications for the current user.
 * GET /api/notifications
 */
export const handleGetNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await getUserNotifications({
      userId: req.user._id,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves unread notification count.
 * GET /api/notifications/unread-count
 */
export const handleGetUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await getUnreadNotificationCount(req.user._id);
    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks a single notification as read.
 * PATCH /api/notifications/:notificationId/read
 */
export const handleMarkAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.'
      });
    }

    const notification = await markNotificationAsRead({
      notificationId,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Marks all notifications as read.
 * PATCH /api/notifications/read-all
 */
export const handleMarkAllAsRead = async (req, res, next) => {
  try {
    const modifiedCount = await markAllNotificationsAsRead(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

