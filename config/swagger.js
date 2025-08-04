const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration options
const options = {
  definition: {
    openapi: '3.0.0',    info: {
      title: 'Post Management System API',
      version: '1.0.0',
      description: `
# Readme !!!!!!!!!!!

A comprehensive Node.js Post Management System with Express, MongoDB, JWT Authentication, Redis Cache, and **Swagger Documentation**.

## 🚀 Features

### Authentication & Authorization
- ✅ User registration and login with JWT authentication
- ✅ Role-based access control (Admin/User)
- ✅ User profile management

### Post Management
- ✅ CRUD operations for posts
- ✅ Image thumbnail upload with Multer
- ✅ Pagination, filtering, and sorting for posts

### User Management (Admin Only)
- ✅ User list management
- ✅ Activate/Deactivate user accounts
- ✅ User statistics and analytics

### Performance & Caching
- ✅ Redis cache for improved performance
- ✅ Optimized database indexing

### Documentation & Monitoring
- ✅ **Interactive Swagger API Documentation**
- ✅ Comprehensive logging system
- ✅ Health check endpoints

### File Upload & Security
- ✅ File upload validation and security
- ✅ Input validation and error handling

### Architecture
- ✅ Event-driven architecture with EventEmitter
- ✅ Mongoose ODM with MongoDB
- ✅ Modular structure

## 📦 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (mongoose)
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt
- **File Upload**: Multer
- **Logging**: Morgan
- **Environment**: dotenv

## 🔐 Authentication

### Default Users (after running seed)
- **Admin**: username: \`admin\`, password: \`admin123\`
- **Users**: \`john_doe\`, \`jane_smith\`, \`tech_writer\`, \`lifestyle_blogger\` (password: \`password123\`)

### How to Authenticate
1. **Register/Login** to get JWT token
2. **Click "Authorize" button** above
3. **Enter**: \`Bearer <your-jwt-token>\`
4. **Now you can test protected endpoints**

## 📊 API Categories

### Public Endpoints
- Health check
- User registration/login
- View posts (read-only)

### Authenticated Endpoints
- Profile management
- Create/Update/Delete own posts

### Admin Only Endpoints
- User management
- User statistics
- Manage all users

## 🎯 Quick Start

1. Run seed data: \`npm run seed:users\`
2. Start server: \`npm run dev\`
3. Login with admin account
4. Get JWT token and authorize in Swagger
5. Test endpoints!

---

**Note**: This API supports file upload for post thumbnails. Use \`multipart/form-data\` for posts with images.
      `,
      contact: {
        name: 'APTECH Student',
        email: 'student@aptech.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }    },
    servers: [
      {
        url: 'https://apiasm.vunet.vn',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username',
              minLength: 3,
              maxLength: 30
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'User role'
            },
            email: {
              type: 'string',
              description: 'User email address',
              nullable: true
            },
            fullName: {
              type: 'string',
              description: 'User full name',
              nullable: true
            },
            isActive: {
              type: 'boolean',
              description: 'User active status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp'
            }
          }
        },
        Post: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Post ID'
            },
            title: {
              type: 'string',
              description: 'Post title',
              maxLength: 200
            },
            content: {
              type: 'string',
              description: 'Post content'
            },
            author: {
              $ref: '#/components/schemas/User'
            },
            category: {
              type: 'string',
              enum: ['tech', 'lifestyle', 'business', 'education', 'health', 'entertainment', 'other'],
              description: 'Post category'
            },
            thumbnail: {
              type: 'string',
              description: 'Thumbnail image URL',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Post creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Post last update timestamp'
            }
          }
        },
        PostInput: {
          type: 'object',
          required: ['title', 'content', 'category'],
          properties: {
            title: {
              type: 'string',
              description: 'Post title',
              maxLength: 200
            },
            content: {
              type: 'string',
              description: 'Post content'
            },
            category: {
              type: 'string',
              enum: ['tech', 'lifestyle', 'business', 'education', 'health', 'entertainment', 'other'],
              description: 'Post category'
            }
          }
        },
        RegisterInput: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              minLength: 3,
              maxLength: 30
            },
            password: {
              type: 'string',
              description: 'Password',
              minLength: 6
            }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username'
            },
            password: {
              type: 'string',
              description: 'Password'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object',
              properties: {
                posts: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Post'
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: {
                      type: 'integer'
                    },
                    totalPages: {
                      type: 'integer'
                    },
                    totalPosts: {
                      type: 'integer'
                    },
                    hasNext: {
                      type: 'boolean'
                    },
                    hasPrev: {
                      type: 'boolean'
                    },
                    limit: {
                      type: 'integer'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Posts',
        description: 'Post management endpoints'
      },
      {
        name: 'System',
        description: 'System health and information endpoints'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js'] // Path to the API files
};

// Generate Swagger specification
const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
