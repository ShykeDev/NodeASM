// Middleware to check if user has admin role
const isAdmin = (req, res, next) => {
  try {
    // Check if user exists (from auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin privileges',
      error: error.message
    });
  }
};

// Middleware to check if user is active
const isActiveUser = (req, res, next) => {
  try {
    // Check if user exists (from auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account is deactivated.'
      });
    }

    next();
  } catch (error) {
    console.error('Active user check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking user status',
      error: error.message
    });
  }
};

module.exports = {
  isAdmin,
  isActiveUser
};
