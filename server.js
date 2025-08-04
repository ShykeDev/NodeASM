require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import configurations and middleware
const { connectMongoDB, connectRedis } = require('./config/database');
const { logger, morganConfig } = require('./middleware/logger');
const { setRedisClient } = require('./controllers/postController');
const { swaggerUi, specs } = require('./config/swagger');
const { testEmailConfig } = require('./services/emailService');

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// Logging middleware
app.use(logger);
app.use(morganConfig);

// Static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Post Management API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    url: '/api-docs/swagger.json',
    // Force disable any cached servers
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    // Prevent falling back to default servers
    defaultServerUrl: 'https://apiasm.vunet.vn'
  }
}));

// Custom swagger.json endpoint with ONLY production server
app.get('/api-docs/swagger.json', (req, res) => {
  const customSpecs = {
    ...specs,
    servers: [
      {
        url: 'https://apiasm.vunet.vn',
        description: 'Production server'
      }
    ]
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(customSpecs);
});

// Routes
app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * @swagger
 * /test-email:
 *   get:
 *     summary: Test email configuration
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Email configuration test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
app.get('/test-email', async (req, res) => {
  try {
    const isValid = await testEmailConfig();
    res.status(200).json({
      success: isValid,
      message: isValid ? 'Email configuration is valid' : 'Email configuration has issues',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        from: process.env.FROM_EMAIL
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing email configuration',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /send-test-email:
 *   post:
 *     summary: Send a test email
 *     tags: [System]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient email address
 *           example:
 *             to: "test@example.com"
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *       500:
 *         description: Error sending test email
 */
app.post('/send-test-email', async (req, res) => {
  try {
    const { sendEmail } = require('./services/emailService');
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required'
      });
    }
    
    const result = await sendEmail(
      to,
      'Test Email from Post Management System',
      `
        <h1>🎉 Test Email Successful!</h1>
        <p>This is a test email from Post Management System.</p>
        <p>If you receive this email, the SMTP configuration is working correctly.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    );
    
    res.status(200).json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      details: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome endpoint with API information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API welcome message with endpoint information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Welcome to Post Management System API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: object
 *                       properties:
 *                         register:
 *                           type: string
 *                           example: "POST /api/register"
 *                         login:
 *                           type: string
 *                           example: "POST /api/login"
 *                     posts:
 *                       type: object
 *                       properties:
 *                         getAll:
 *                           type: string
 *                           example: "GET /api/posts"
 *                         getById:
 *                           type: string
 *                           example: "GET /api/posts/:id"
 *                         create:
 *                           type: string
 *                           example: "POST /api/posts"
 *                         update:
 *                           type: string
 *                           example: "PUT /api/posts/:id"
 *                         delete:
 *                           type: string
 *                           example: "DELETE /api/posts/:id"
 */
app.get('/', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  res.status(200).json({
    success: true,
    message: 'Welcome to Post Management System API',
    version: '1.0.0',
    documentation: `${baseUrl}/api-docs`,
    endpoints: {
      auth: {
        register: 'POST /api/register',
        login: 'POST /api/login'
      },
      posts: {
        getAll: 'GET /api/posts',
        getById: 'GET /api/posts/:id',
        create: 'POST /api/posts',
        update: 'PUT /api/posts/:id',
        delete: 'DELETE /api/posts/:id'
      }
    }
  });
});

// Debug email configuration endpoint
app.get('/debug-email-config', async (req, res) => {
  try {
    console.log('🔍 Debugging email configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('FROM_NAME:', process.env.FROM_NAME);
    
    const isValid = await testEmailConfig();
    
    res.status(200).json({
      success: isValid,
      message: isValid ? 'Email configuration is valid' : 'Email configuration has issues',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.FROM_EMAIL,
        fromName: process.env.FROM_NAME
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug email config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error debugging email configuration',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Connect to Redis (optional)
    const redisClient = await connectRedis();
    if (redisClient) {
      setRedisClient(redisClient);
    }      // Start HTTP server
    app.listen(PORT, () => {
      const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 API Documentation: ${baseUrl}/api-docs`);
      console.log(`🏠 Home: ${baseUrl}/`);
      console.log(`🏥 Health Check: ${baseUrl}/health`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Base URL: ${baseUrl}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();
