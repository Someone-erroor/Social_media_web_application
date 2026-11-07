import { Conversation, Message, User, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';
import { sendNotificationToUser, getIO } from './socket.service.js';

/**
 * Retrieves an existing 1-on-1 conversation or creates a new one.
 */
export const getOrCreateConversation = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  if (currentUserId.toString() === targetUserId.toString()) {
    const error = new Error('You cannot start a conversation with yourself.');
    error.status = 400;
    throw error;
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(targetUserId)
  ]);

  if (!targetUser) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  // Safety block check
  if ((targetUser.blockedUsers || []).some(id => id.toString() === currentUserId.toString())) {
    const error = new Error('Unable to message this user.');
    error.status = 403;
    throw error;
  }

  if ((currentUser.blockedUsers || []).some(id => id.toString() === targetUserId.toString())) {
    const error = new Error('You have blocked this user. Unblock them first.');
    error.status = 400;
    throw error;
  }

  // Find existing
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, targetUserId] }
  }).populate('participants', '_id fullName profile email');

  if (conversation) {
    return { success: true, conversation };
  }

  // Determine status: If mutual follow => 'active'; otherwise => 'pending_request'
  const isMutualFollow =
    (currentUser.following || []).some(id => id.toString() === targetUserId.toString()) &&
    (targetUser.following || []).some(id => id.toString() === currentUserId.toString());

  const status = isMutualFollow ? 'active' : 'pending_request';

  conversation = new Conversation({
    participants: [currentUserId, targetUserId],
    initiatedBy: currentUserId,
    status
  });

  await conversation.save();
  await conversation.populate('participants', '_id fullName profile email');

  return { success: true, conversation, isNew: true };
};

/**
 * Lists conversations for the authenticated user.
 */
export const listConversations = async (currentUserId) => {
  const currentUser = await User.findById(currentUserId).select('blockedUsers');
  const blockedIds = (currentUser?.blockedUsers || []).map(id => id.toString());

  const conversations = await Conversation.find({
    participants: currentUserId
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', '_id fullName profile')
    .populate('lastMessage');

  // Filter out conversations with blocked users
  const filtered = conversations.filter(conv => {
    const otherUser = conv.participants.find(p => p._id.toString() !== currentUserId.toString());
    return otherUser && !blockedIds.includes(otherUser._id.toString());
  });

  const enriched = await Promise.all(
    filtered.map(async (conv) => {
      const otherUser = conv.participants.find(p => p._id.toString() !== currentUserId.toString());
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        recipient: currentUserId,
        readAt: null
      });

      return {
        _id: conv._id,
        participants: conv.participants,
        otherUser,
        status: conv.status,
        initiatedBy: conv.initiatedBy,
        isRequest: conv.status === 'pending_request' && conv.initiatedBy.toString() !== currentUserId.toString(),
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount
      };
    })
  );

  return { success: true, conversations: enriched };
};

/**
 * Retrieves available contacts that the current user can start a conversation with.
 *
 * @param {string} currentUserId - The authenticated user ID
 * @param {string} searchQuery - Optional search term matching fullName or email
 * @returns {Promise<object>} List of contacts
 */
export const getAvailableContacts = async (currentUserId, searchQuery = '') => {
  const currentUser = await User.findById(currentUserId).select('blockedUsers following');
  const blockedIds = (currentUser?.blockedUsers || []).map((id) => id.toString());

  const query = {
    _id: { $nin: [...blockedIds, currentUserId] },
    accountStatus: { $ne: 'suspended' }
  };

  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { fullName: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('_id fullName email profile.avatarUrl profile.bio role createdAt')
    .sort({ createdAt: -1 })
    .limit(40);

  const followingSet = new Set((currentUser?.following || []).map((id) => id.toString()));

  return {
    success: true,
    contacts: users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      avatarUrl: u.profile?.avatarUrl || '',
      bio: u.profile?.bio || '',
      isFollowing: followingSet.has(u._id.toString()),
      role: u.role
    }))
  };
};

/**
 * Retrieves paginated messages for a conversation.
 */
export const getMessages = async (conversationId, currentUserId, { page = 1, limit = 50 }) => {
  if (!isValidObjectId(conversationId)) {
    const error = new Error('Invalid conversation ID.');
    error.status = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.status = 404;
    throw error;
  }

  const isParticipant = conversation.participants.some(id => id.toString() === currentUserId.toString());
  if (!isParticipant) {
    const error = new Error('Access denied to this conversation.');
    error.status = 403;
    throw error;
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum)
      .populate('sender', '_id fullName profile.avatarUrl')
      .populate('recipient', '_id fullName profile.avatarUrl'),
    Message.countDocuments({ conversation: conversationId })
  ]);

  return {
    success: true,
    messages,
    conversation: {
      _id: conversation._id,
      status: conversation.status,
      initiatedBy: conversation.initiatedBy
    },
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Sends a message within a conversation.
 */
export const sendMessage = async ({ conversationId, senderId, content, isEncrypted = false, iv = null }) => {
  if (!isValidObjectId(conversationId)) {
    const error = new Error('Invalid conversation ID.');
    error.status = 400;
    throw error;
  }

  if (!content || !content.trim()) {
    const error = new Error('Message content cannot be empty.');
    error.status = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.status = 404;
    throw error;
  }

  const isParticipant = conversation.participants.some(id => id.toString() === senderId.toString());
  if (!isParticipant) {
    const error = new Error('You are not a participant in this conversation.');
    error.status = 403;
    throw error;
  }

  const recipientId = conversation.participants.find(id => id.toString() !== senderId.toString());

  // Check blocks
  const [recipient, sender] = await Promise.all([
    User.findById(recipientId),
    User.findById(senderId)
  ]);

  if ((recipient?.blockedUsers || []).some(id => id.toString() === senderId.toString())) {
    const error = new Error('Unable to send message to this user.');
    error.status = 403;
    throw error;
  }

  const message = new Message({
    conversation: conversationId,
    sender: senderId,
    recipient: recipientId,
    content: content.trim(),
    isEncrypted: Boolean(isEncrypted),
    iv: iv || null
  });

  await message.save();

  // Update conversation lastMessage
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  await message.populate('sender', '_id fullName profile.avatarUrl');

  // Real-time Socket.IO emission to recipient
  try {
    const io = getIO();
    if (io) {
      io.to(`user_${recipientId.toString()}`).emit('new_message', {
        message,
        conversationId
      });
    }
  } catch (err) {
    console.error(`[Socket Error] Message dispatch: ${err.message}`);
  }

  return { success: true, message };
};

/**
 * Marks messages in a conversation as read.
 */
export const markMessagesRead = async (conversationId, currentUserId) => {
  await Message.updateMany(
    { conversation: conversationId, recipient: currentUserId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    const senderId = conversation.participants.find(id => id.toString() !== currentUserId.toString());
    const io = getIO();
    if (io && senderId) {
      io.to(`user_${senderId.toString()}`).emit('messages_read', {
        conversationId,
        readBy: currentUserId,
        readAt: new Date()
      });
    }
  }

  return { success: true, message: 'Messages marked as read.' };
};

/**
 * Accepts or declines a message request.
 */
export const respondToMessageRequest = async (conversationId, currentUserId, action) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.status = 404;
    throw error;
  }

  if (action === 'accept') {
    conversation.status = 'active';
  } else if (action === 'decline' || action === 'reject') {
    conversation.status = 'declined';
  } else {
    const error = new Error('Action must be either accept, decline, or reject.');
    error.status = 400;
    throw error;
  }

  await conversation.save();
  await conversation.populate('participants', '_id fullName profile email');

  return {
    success: true,
    conversation,
    status: conversation.status,
    message: `Message request ${action === 'accept' ? 'accepted' : 'declined'}.`
  };
};

