import {
  validateCreatePostInput,
  validateUpdatePostInput,
  validatePaginationQuery,
  isValidObjectId
} from '../validators/post.validator.js';
import {
  createPost as createPostService,
  getPostById as getPostByIdService,
  getMyPosts as getMyPostsService,
  getUserPosts as getUserPostsService,
  getFeed as getFeedService,
  getExplorePosts as getExploreService,
  updatePost as updatePostService,
  deletePost as deletePostService
} from '../services/post.service.js';

/**
 * Creates a new post.
 * Requires authenticated user with isEmailVerified: true.
 * POST /api/posts
 */
export const createPost = async (req, res, next) => {
  try {
    // Enforce email verification requirement
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to publish posts.'
      });
    }

    const { isValid, errors, sanitized } = validateCreatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid post content.',
        errors
      });
    }

    const post = await createPostService({
      authorId: req.user._id,
      content: sanitized.content,
      postType: sanitized.postType,
      primaryMedia: sanitized.primaryMedia,
      realityMedia: sanitized.realityMedia,
      circle: sanitized.circle
    });

    return res.status(201).json({
      success: true,
      message: 'Post published successfully.',
      post
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
 * Uploads and stores a media asset for a post.
 * POST /api/posts/upload
 */
export const uploadPostMedia = async (req, res, next) => {
  try {
    const mediaInput = req.body.media || req.body.image;
    if (!mediaInput) {
      return res.status(400).json({
        success: false,
        message: 'Media payload is required ("media" or "image" string).'
      });
    }

    const { processAndStoreMedia } = await import('../services/media.service.js');
    const result = await processAndStoreMedia(mediaInput);

    return res.status(201).json({
      success: true,
      message: 'Media uploaded and processed successfully.',
      mediaUrl: result.mediaUrl
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
 * Retrieves a single post by ID.
 * GET /api/posts/:postId
 */
export const getPostById = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    const post = await getPostByIdService(postId, req.user?._id, req.user?.role);

    return res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.status === 403) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Retrieves posts created by current authenticated user.
 * GET /api/posts/mine
 */
export const getMyPosts = async (req, res, next) => {
  try {
    const pagination = validatePaginationQuery(req.query);

    const result = await getMyPostsService({
      authorId: req.user._id,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip
    });

    return res.status(200).json({
      success: true,
      posts: result.posts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves posts authored by a specific user.
 * GET /api/profiles/:userId/posts
 */
export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const pagination = validatePaginationQuery(req.query);

    const result = await getUserPostsService({
      userId,
      viewerId: req.user?._id || null,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip
    });

    return res.status(200).json({
      success: true,
      posts: result.posts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the global social media feed ordered chronologically.
 * GET /api/feed?page=1&limit=10
 */
export const getFeed = async (req, res, next) => {
  try {
    const pagination = validatePaginationQuery(req.query);
    const mode = ['following', 'explore', 'latest'].includes(req.query.mode)
      ? req.query.mode
      : 'latest';

    const result = await getFeedService({
      userId: req.user?._id || null,
      mode,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip
    });

    return res.status(200).json({
      success: true,
      mode: result.mode,
      posts: result.posts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves recent public posts for explore/discovery.
 * GET /api/explore or GET /api/feed/explore
 */
export const getExplore = async (req, res, next) => {
  try {
    const pagination = validatePaginationQuery(req.query);
    const category = req.query.category || 'all';

    const result = await getExploreService({
      userId: req.user?._id || null,
      category,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip
    });

    return res.status(200).json({
      success: true,
      mode: 'explore',
      posts: result.posts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a post. Only the author may update their post.
 * PATCH /api/posts/:postId
 */
export const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    const { isValid, errors, sanitized } = validateUpdatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid post content.',
        errors
      });
    }

    const updatedPost = await updatePostService({
      postId,
      authorId: req.user._id,
      content: sanitized.content
    });

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      post: updatedPost
    });
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Deletes a post. Only the author may delete their post.
 * DELETE /api/posts/:postId
 */
export const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    await deletePostService({
      postId,
      authorId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully.'
    });
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export default {
  createPost,
  getPostById,
  getMyPosts,
  getUserPosts,
  getFeed,
  getExplore,
  updatePost,
  deletePost
};

