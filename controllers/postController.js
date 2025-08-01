const Post = require('../models/Post');
const postEmitter = require('../events/postEvents');
const path = require('path');
const fs = require('fs');

// Cache helper functions (assuming Redis client is available globally)
let redisClient = null;
const setRedisClient = (client) => {
  redisClient = client;
};

const getCacheKey = (page, limit, sortBy, category, search) => {
  return `posts:${page}:${limit}:${sortBy}:${category || 'all'}:${search || 'none'}`;
};

// Get all posts with pagination, filtering, and sorting
const getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      category,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Check cache first
    const cacheKey = getCacheKey(page, limit, sortBy, category, search);
    if (redisClient) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({
            success: true,
            message: 'Posts retrieved from cache',
            ...JSON.parse(cachedData)
          });
        }
      } catch (cacheError) {
        console.error('Cache get error:', cacheError);
      }
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    // Execute queries
    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .populate('author', 'username')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalPosts / limitNum);

    const result = {
      data: {
        posts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalPosts,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    };

    // Cache the result
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(result)); // Cache for 5 minutes
      } catch (cacheError) {
        console.error('Cache set error:', cacheError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
      ...result
    });

  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving posts',
      error: error.message
    });
  }
};

// Get single post by ID
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `post:${id}`;
    if (redisClient) {
      try {
        const cachedPost = await redisClient.get(cacheKey);
        if (cachedPost) {
          return res.status(200).json({
            success: true,
            message: 'Post retrieved from cache',
            data: JSON.parse(cachedPost)
          });
        }
      } catch (cacheError) {
        console.error('Cache get error:', cacheError);
      }
    }

    const post = await Post.findById(id)
      .populate('author', 'username')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Cache the result
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(post)); // Cache for 10 minutes
      } catch (cacheError) {
        console.error('Cache set error:', cacheError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post retrieved successfully',
      data: post
    });

  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving post',
      error: error.message
    });
  }
};

// Create new post
const createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user._id;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }

    // Handle thumbnail upload
    let thumbnailPath = null;
    if (req.file) {
      thumbnailPath = `/uploads/${req.file.filename}`;
    }

    // Create new post
    const newPost = new Post({
      title,
      content,
      category,
      author: userId,
      thumbnail: thumbnailPath
    });

    await newPost.save();

    // Populate author information
    await newPost.populate('author', 'username');

    // Emit post created event
    postEmitter.emit('post:created', {
      title: newPost.title,
      author: newPost.author,
      category: newPost.category,
      id: newPost._id
    });

    // Clear relevant cache
    if (redisClient) {
      try {
        const keys = await redisClient.keys('posts:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (cacheError) {
        console.error('Cache clear error:', cacheError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own posts'
      });
    }

    // Handle thumbnail upload
    let thumbnailPath = post.thumbnail;
    if (req.file) {
      // Delete old thumbnail if exists
      if (post.thumbnail) {
        const oldThumbnailPath = path.join(__dirname, '..', post.thumbnail);
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }
      thumbnailPath = `/uploads/${req.file.filename}`;
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        thumbnail: thumbnailPath
      },
      { new: true, runValidators: true }
    ).populate('author', 'username');

    // Emit post updated event
    postEmitter.emit('post:updated', {
      title: updatedPost.title,
      author: updatedPost.author,
      id: updatedPost._id
    });

    // Clear relevant cache
    if (redisClient) {
      try {
        const keys = await redisClient.keys(`posts:*`);
        keys.push(`post:${id}`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (cacheError) {
        console.error('Cache clear error:', cacheError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(id).populate('author', 'username');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Delete thumbnail file if exists
    if (post.thumbnail) {
      const thumbnailPath = path.join(__dirname, '..', post.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // Delete post
    await Post.findByIdAndDelete(id);

    // Emit post deleted event
    postEmitter.emit('post:deleted', {
      title: post.title,
      author: post.author,
      id: post._id
    });

    // Clear relevant cache
    if (redisClient) {
      try {
        const keys = await redisClient.keys(`posts:*`);
        keys.push(`post:${id}`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (cacheError) {
        console.error('Cache clear error:', cacheError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  setRedisClient
};
