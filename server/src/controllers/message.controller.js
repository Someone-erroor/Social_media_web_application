import {
  getOrCreateConversation as getOrCreateConversationService,
  listConversations as listConversationsService,
  getAvailableContacts as getAvailableContactsService,
  getMessages as getMessagesService,
  sendMessage as sendMessageService,
  markMessagesRead as markMessagesReadService,
  respondToMessageRequest as respondToMessageRequestService
} from '../services/message.service.js';

export const getContacts = async (req, res, next) => {
  try {
    const { search } = req.query;
    const result = await getAvailableContactsService(req.user._id, search || '');
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const result = await getOrCreateConversationService(req.user._id, targetUserId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const result = await listConversationsService(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page, limit } = req.query;
    const result = await getMessagesService(conversationId, req.user._id, { page, limit });
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, isEncrypted, iv } = req.body;
    const result = await sendMessageService({
      conversationId,
      senderId: req.user._id,
      content,
      isEncrypted,
      iv
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const result = await markMessagesReadService(conversationId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const respondRequest = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { action } = req.body;
    const result = await respondToMessageRequestService(conversationId, req.user._id, action);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export default {
  getContacts,
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  respondRequest
};

