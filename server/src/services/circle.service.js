import { Circle, Post, Like, Comment, User, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';

/**
 * Creates a slug from a name string.
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Creates a new interest circle.
 */
export const createCircle = async ({ creatorId, name, description, category = 'Other', avatarUrl = '', coverUrl = '', isPrivate = false }) => {
  if (!name || name.trim().length < 2) {
    const error = new Error('Circle name must be at least 2 characters.');
    error.status = 400;
    throw error;
  }

  let slug = slugify(name);
  const existing = await Circle.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const circle = new Circle({
    name: name.trim(),
    slug,
    description: (description || '').trim(),
    category,
    avatarUrl: (avatarUrl || '').trim(),
    coverUrl: (coverUrl || '').trim(),
    creator: creatorId,
    isPrivate: Boolean(isPrivate),
    members: [creatorId],
    memberCount: 1
  });

  await circle.save();

  try {
    const auditLog = new ActivityLog({
      actor: creatorId,
      action: 'circle_creation',
      targetType: 'Circle',
      targetId: circle._id,
      metadata: { name: circle.name, slug: circle.slug }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Circle creation: ${err.message}`);
  }

  return { success: true, circle, message: `Circle "${circle.name}" created successfully!` };
};

/**
 * Lists circles with category filter and search.
 */
export const listCircles = async ({ category, search, page = 1, limit = 20, currentUserId = null }) => {
  const query = {};
  if (category && category !== 'all') {
    query.category = category;
  }
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [circles, total] = await Promise.all([
    Circle.find(query)
      .sort({ memberCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('creator', '_id fullName profile.avatarUrl'),
    Circle.countDocuments(query)
  ]);

  const enriched = circles.map(c => ({
    ...c.toObject(),
    isMember: currentUserId ? (c.members || []).some(m => m.toString() === currentUserId.toString()) : false
  }));

  return {
    success: true,
    circles: enriched,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Retrieves a single circle by slug.
 */
export const getCircleBySlug = async (slug, currentUserId = null) => {
  const circle = await Circle.findOne({ slug })
    .populate('creator', '_id fullName profile.avatarUrl')
    .populate('members', '_id fullName profile.avatarUrl');

  if (!circle) {
    const error = new Error('Circle not found.');
    error.status = 404;
    throw error;
  }

  const isMember = currentUserId
    ? (circle.members || []).some(m => m._id.toString() === currentUserId.toString())
    : false;

  return {
    success: true,
    circle,
    isMember
  };
};

/**
 * Joins a circle.
 */
export const joinCircle = async (circleId, currentUserId) => {
  if (!isValidObjectId(circleId)) {
    const error = new Error('Invalid circle ID.');
    error.status = 400;
    throw error;
  }

  const circle = await Circle.findById(circleId);
  if (!circle) {
    const error = new Error('Circle not found.');
    error.status = 404;
    throw error;
  }

  const isMember = (circle.members || []).some(m => m.toString() === currentUserId.toString());
  if (isMember) {
    return { success: true, isMember: true, message: 'You are already a member of this Circle.' };
  }

  circle.members.push(currentUserId);
  circle.memberCount = circle.members.length;
  await circle.save();

  return {
    success: true,
    isMember: true,
    memberCount: circle.memberCount,
    message: `Joined ${circle.name}!`
  };
};

/**
 * Leaves a circle.
 */
export const leaveCircle = async (circleId, currentUserId) => {
  if (!isValidObjectId(circleId)) {
    const error = new Error('Invalid circle ID.');
    error.status = 400;
    throw error;
  }

  const circle = await Circle.findById(circleId);
  if (!circle) {
    const error = new Error('Circle not found.');
    error.status = 404;
    throw error;
  }

  circle.members = circle.members.filter(m => m.toString() !== currentUserId.toString());
  circle.memberCount = circle.members.length;
  await circle.save();

  return {
    success: true,
    isMember: false,
    memberCount: circle.memberCount,
    message: `Left ${circle.name}.`
  };
};

/**
 * Retrieves posts inside a specific circle.
 */
export const getCirclePosts = async (circleId, currentUserId, { page = 1, limit = 20 }) => {
  if (!isValidObjectId(circleId)) {
    const error = new Error('Invalid circle ID.');
    error.status = 400;
    throw error;
  }

  const circle = await Circle.findById(circleId);
  if (!circle) {
    const error = new Error('Circle not found.');
    error.status = 404;
    throw error;
  }

  // If private, verify membership
  const isMember = (circle.members || []).some(m => m.toString() === currentUserId.toString());
  if (circle.isPrivate && !isMember) {
    const error = new Error('This Circle is private. Join to view member discussions.');
    error.status = 403;
    throw error;
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [posts, total] = await Promise.all([
    Post.find({ circle: circleId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', '_id fullName profile.avatarUrl profile.bio'),
    Post.countDocuments({ circle: circleId })
  ]);

  const enriched = await Promise.all(
    posts.map(async (p) => {
      const [likesCount, commentsCount] = await Promise.all([
        Like.countDocuments({ post: p._id }),
        Comment.countDocuments({ post: p._id })
      ]);
      const obj = p.toObject ? p.toObject() : { ...p };
      obj.likesCount = likesCount;
      obj.commentsCount = commentsCount;
      return obj;
    })
  );

  return {
    success: true,
    circleName: circle.name,
    posts: enriched,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Creates a post within a circle.
 */
export const createCirclePost = async (circleId, authorId, { content }) => {
  if (!content || !content.trim()) {
    const error = new Error('Post content cannot be empty.');
    error.status = 400;
    throw error;
  }

  const circle = await Circle.findById(circleId);
  if (!circle) {
    const error = new Error('Circle not found.');
    error.status = 404;
    throw error;
  }

  const isMember = (circle.members || []).some(m => m.toString() === authorId.toString());
  if (!isMember) {
    const error = new Error('You must be a member of this Circle to post.');
    error.status = 403;
    throw error;
  }

  const post = new Post({
    author: authorId,
    circle: circleId,
    content: content.trim()
  });

  await post.save();
  await post.populate('author', '_id fullName profile.avatarUrl profile.bio');

  return {
    success: true,
    post: {
      ...post.toObject(),
      likesCount: 0,
      commentsCount: 0
    },
    message: 'Post published to Circle!'
  };
};

