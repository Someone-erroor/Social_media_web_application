import {
  createCircle as createCircleService,
  listCircles as listCirclesService,
  getCircleBySlug as getCircleBySlugService,
  joinCircle as joinCircleService,
  leaveCircle as leaveCircleService,
  getCirclePosts as getCirclePostsService,
  createCirclePost as createCirclePostService
} from '../services/circle.service.js';

export const createCircle = async (req, res, next) => {
  try {
    const { name, description, category, avatarUrl, coverUrl, isPrivate } = req.body;
    const result = await createCircleService({
      creatorId: req.user._id,
      name,
      description,
      category,
      avatarUrl,
      coverUrl,
      isPrivate
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const listCircles = async (req, res, next) => {
  try {
    const { category, search, page, limit } = req.query;
    const result = await listCirclesService({
      category,
      search,
      page,
      limit,
      currentUserId: req.user?._id || null
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCircle = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await getCircleBySlugService(slug, req.user?._id || null);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const joinCircle = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const result = await joinCircleService(circleId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const leaveCircle = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const result = await leaveCircleService(circleId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getCirclePosts = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const { page, limit } = req.query;
    const result = await getCirclePostsService(circleId, req.user?._id || null, { page, limit });
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createCirclePost = async (req, res, next) => {
  try {
    const { circleId } = req.params;
    const { content } = req.body;
    const result = await createCirclePostService(circleId, req.user._id, { content });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export default {
  createCircle,
  listCircles,
  getCircle,
  joinCircle,
  leaveCircle,
  getCirclePosts,
  createCirclePost
};

