const Post = require('../models/Post');
const postEmitter = require('../events/postEvents');
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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
    await newPost.populate('author', 'username');    // Emit post created event with full post data
    postEmitter.emit('post:created', {
      _id: newPost._id,
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      thumbnail: newPost.thumbnail,
      createdAt: newPost.createdAt,
      author: newPost.author
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

// Export posts to CSV
const exportPostsToCSV = async (req, res) => {
  try {
    const {
      category,
      search,
      author,
      startDate,
      endDate
    } = req.query;

    // Build query based on user role
    let query = {};
    
    // If user is not admin, only export their own posts
    if (req.user.role !== 'admin') {
      query.author = req.user._id;
    }
    
    // Add optional filters
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (author && req.user.role === 'admin') {
      query.author = author;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Fetch posts
    const posts = await Post.find(query)
      .populate('author', 'username fullName email')
      .sort({ createdAt: -1 })
      .lean();

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No posts found for export'
      });
    }

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `posts_export_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    // Define CSV header
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'title', title: 'Title' },
        { id: 'content', title: 'Content' },
        { id: 'category', title: 'Category' },
        { id: 'authorUsername', title: 'Author Username' },
        { id: 'authorFullName', title: 'Author Full Name' },
        { id: 'authorEmail', title: 'Author Email' },
        { id: 'thumbnail', title: 'Thumbnail' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    // Prepare data for CSV
    const csvData = posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      content: post.content.replace(/\n/g, ' ').replace(/,/g, ';'), // Clean content for CSV
      category: post.category,
      authorUsername: post.author?.username || 'Unknown',
      authorFullName: post.author?.fullName || 'N/A',
      authorEmail: post.author?.email || 'N/A',
      thumbnail: post.thumbnail || 'N/A',
      createdAt: new Date(post.createdAt).toISOString(),
      updatedAt: new Date(post.updatedAt).toISOString()
    }));

    // Write to CSV
    await csvWriter.writeRecords(csvData);

    // Log export activity
    console.log(`📊 Posts exported to CSV by user: ${req.user.username}, Posts count: ${posts.length}`);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('File download error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error downloading file'
        });
      }

      // Clean up file after download (optional - comment out if you want to keep files)
      setTimeout(() => {
        try {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      }, 5000); // Delete after 5 seconds
    });

  } catch (error) {
    console.error('Export posts to CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting posts to CSV',
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
  exportPostsToCSV,
  setRedisClient
};
