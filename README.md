# Post Management System API

A comprehensive Node.js Post Management System with Express, MongoDB, JWT Authentication, Redis Cache, and **Swagger Documentation**.

## 🚀 Tính năng

- ✅ **Authentication & Authorization**
  - Đăng ký và đăng nhập với JWT authentication
  - Role-based access control (Admin/User)
  - User profile management
- ✅ **Post Management**
  - CRUD operations cho bài viết (Posts)
  - Upload ảnh thumbnail với Multer
  - Phân trang, lọc, sắp xếp bài viết
- ✅ **User Management (Admin)**
  - Quản lý danh sách users
  - Activate/Deactivate user accounts
  - User statistics và analytics
- ✅ **Performance & Caching**
  - Redis cache để tăng hiệu suất
  - Database indexing tối ưu
- ✅ **Documentation & Monitoring**
  - **Swagger API Documentation** - Interactive API docs
  - Comprehensive logging system
  - Health check endpoints
- ✅ **File Upload & Security**
  - File upload validation và security
  - Input validation và error handling
- ✅ **Architecture**
  - Event-driven architecture với EventEmitter
  - Mongoose ODM với MongoDB
  - Modular structure

## 📦 Công nghệ sử dụng

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (mongoose)
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt
- **File Upload**: Multer
- **Logging**: Morgan
- **Environment**: dotenv

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd NodeASM
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env` và cấu hình:
```env
NODE_ENV=development
PORT=3000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/post-management
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/post-management

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=2097152
```

### 4. Khởi chạy ứng dụng

#### Seed Data (Tùy chọn)
Tạo dữ liệu mẫu cho users:
```bash
npm run seed:users
```

Điều này sẽ tạo:
- 1 admin user: `admin/admin123`
- 4 regular users: `john_doe`, `jane_smith`, `tech_writer`, `lifestyle_blogger` (password: `password123`)

#### Khởi động server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Swagger Interactive Documentation

API documentation được tích hợp với Swagger UI để cung cấp giao diện interactive cho việc test API.

#### Truy cập Swagger UI
```
https://apiasm.vunet.vn/api-docs
```

#### Tính năng Swagger
- 📖 **Interactive API Documentation**: Test API trực tiếp từ browser
- 🔐 **Authentication Support**: Test các protected endpoints với JWT token
- 📝 **Request/Response Examples**: Ví dụ chi tiết cho mọi endpoint
- 🎯 **Try It Out**: Execute API calls trực tiếp từ documentation
- 📋 **Schema Definitions**: Chi tiết cấu trúc data models

#### Cách sử dụng Swagger UI

1. **Khởi động server**: `npm run dev`
2. **Mở Swagger UI**: Truy cập `https://apiasm.vunet.vn/api-docs`
3. **Authentication**:
   - Đăng ký/đăng nhập để lấy JWT token
   - Click vào nút "Authorize" trên Swagger UI
   - Nhập: `Bearer <your-jwt-token>`
   - Bây giờ có thể test các protected endpoints
4. **Test API endpoints**:
   - Chọn endpoint muốn test
   - Click "Try it out"
   - Điền parameters/request body
   - Click "Execute"

### API Endpoints Overview

#### Authentication
- `POST /api/register` - Đăng ký user mới
- `POST /api/login` - Đăng nhập và nhận JWT token

#### User Management
- `GET /api/users/profile` - Lấy thông tin profile (authenticated)
- `PUT /api/users/profile` - Cập nhật profile (authenticated)
- `GET /api/users` - Lấy danh sách users (admin only)
- `GET /api/users/{id}` - Lấy thông tin user theo ID (admin only)
- `PUT /api/users/{id}/status` - Cập nhật trạng thái user (admin only)
- `GET /api/users/stats` - Thống kê users (admin only)

#### Posts Management
- `GET /api/posts` - Lấy danh sách posts (public)
- `GET /api/posts/{id}` - Lấy chi tiết 1 post (public)
- `POST /api/posts` - Tạo post mới (authenticated)
- `PUT /api/posts/{id}` - Cập nhật post (authenticated, owner only)
- `DELETE /api/posts/{id}` - Xóa post (authenticated, owner only)

#### System
- `GET /health` - Health check
- `GET /` - API welcome message

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Toàn quyền quản lý users và posts
- **User**: Quản lý posts của riêng mình

### Authentication Flow
1. Đăng ký tài khoản mới hoặc đăng nhập
2. Nhận JWT token (có hiệu lực 24 giờ)
3. Gửi token trong header: `Authorization: Bearer <token>`
4. Server xác thực và kiểm tra quyền truy cập

### Default Admin Account
```
Username: admin
Password: admin123
Role: admin
```

## 👥 User Management Features

### For All Users
- Xem và cập nhật profile cá nhân
- Quản lý posts của riêng mình
- Upload avatar/thumbnail

### For Admins Only
- Xem danh sách tất cả users
- Activate/Deactivate user accounts
- Xem thống kê và analytics
- Xem chi tiết thông tin bất kỳ user nào

### Quick Start Examples

#### 1. Đăng ký user mới
```http
POST /api/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 2. Đăng nhập
```http
POST /api/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### Post Endpoints

#### 3. Lấy danh sách bài viết (Public)
```http
GET /api/posts?page=1&limit=10&sortBy=createdAt&category=tech&search=keyword
```

#### 4. Lấy chi tiết bài viết (Public)
```http
GET /api/posts/:id
```

#### 5. Tạo bài viết mới (Requires Authentication)
```http
POST /api/posts
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data

Form data:
- title: "Tên bài viết"
- content: "Nội dung bài viết"
- category: "tech"
- thumbnail: <file> (optional)
```

#### 6. Cập nhật bài viết (Owner only)
```http
PUT /api/posts/:id
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data

Form data:
- title: "Tên bài viết mới"
- content: "Nội dung mới"
- category: "lifestyle"
- thumbnail: <file> (optional)
```

#### 7. Xóa bài viết (Owner only)
```http
DELETE /api/posts/:id
Authorization: Bearer <your-jwt-token>
```

### User Management Endpoints

#### 8. Lấy thông tin profile (Authenticated)
```http
GET /api/users/profile
Authorization: Bearer <your-jwt-token>
```

#### 9. Cập nhật profile (Authenticated)
```http
PUT /api/users/profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "fullName": "John Smith Updated",
  "email": "john.smith.updated@example.com"
}
```

#### 10. Lấy danh sách users (Admin only)
```http
GET /api/users?page=1&limit=10&role=user&search=john&isActive=true
Authorization: Bearer <admin-jwt-token>
```

#### 11. Lấy thông tin user theo ID (Admin only)
```http
GET /api/users/:userId
Authorization: Bearer <admin-jwt-token>
```

#### 12. Cập nhật trạng thái user (Admin only)
```http
PUT /api/users/:userId/status
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "isActive": false
}
```

#### 13. Lấy thống kê users (Admin only)
```http
GET /api/users/stats
Authorization: Bearer <admin-jwt-token>
```

## 📚 Swagger API Documentation

API documentation đã được tích hợp với Swagger UI để cung cấp giao diện interactive cho việc test API.

### Truy cập Swagger UI
```
https://apiasm.vunet.vn/api-docs
```

### Tính năng Swagger
- 📖 **Interactive API Documentation**: Test API trực tiếp từ browser
- 🔐 **Authentication Support**: Test các protected endpoints với JWT token
- 📝 **Request/Response Examples**: Ví dụ chi tiết cho mọi endpoint
- 🎯 **Try It Out**: Execute API calls trực tiếp từ documentation
- 📋 **Schema Definitions**: Chi tiết cấu trúc data models
- 👥 **Role-based Testing**: Test cả user và admin endpoints

### Cách sử dụng Swagger UI

1. **Khởi động server**:
```bash
npm run dev
```

2. **Mở Swagger UI**: Truy cập `https://apiasm.vunet.vn/api-docs`

3. **Authentication**:
   - Đăng ký/đăng nhập để lấy JWT token
   - Click vào nút "Authorize" trên Swagger UI
   - Nhập: `Bearer <your-jwt-token>`
   - Bây giờ có thể test các protected endpoints

4. **Test API endpoints**:
   - Chọn endpoint muốn test
   - Click "Try it out"
   - Điền parameters/request body
   - Click "Execute"

### Testing với Admin Account
Để test admin endpoints, sử dụng tài khoản admin:
- Username: `admin`
- Password: `admin123`
- Sau khi login, sử dụng token để test admin-only endpoints

### API Endpoints Overview

#### Authentication
- `POST /api/register` - Đăng ký user mới
- `POST /api/login` - Đăng nhập và nhận JWT token

#### Posts Management
- `GET /api/posts` - Lấy danh sách posts (public)
- `GET /api/posts/{id}` - Lấy chi tiết 1 post (public)
- `POST /api/posts` - Tạo post mới (authenticated)
- `PUT /api/posts/{id}` - Cập nhật post (authenticated, owner only)
- `DELETE /api/posts/{id}` - Xóa post (authenticated, owner only)

#### User Management
- `GET /api/users/profile` - Lấy profile (authenticated)
- `PUT /api/users/profile` - Cập nhật profile (authenticated)
- `GET /api/users` - Lấy danh sách users (admin only)
- `GET /api/users/{id}` - Lấy user theo ID (admin only)
- `PUT /api/users/{id}/status` - Cập nhật status user (admin only)
- `GET /api/users/stats` - Thống kê users (admin only)

#### System
- `GET /health` - Health check
- `GET /` - API welcome message

## 📊 Schema Database

### User Schema
```javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'user'], default: 'user'),
  email: String (optional),
  fullName: String (optional),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Post Schema
```javascript
{
  title: String (required),
  content: String (required),
  author: ObjectId (ref: 'User'),
  category: String (enum: ['tech', 'lifestyle', 'business', 'education', 'health', 'entertainment', 'other']),
  thumbnail: String (file path),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Authentication

Hệ thống sử dụng JWT tokens cho authentication:
- Token có thời hạn 24 giờ
- Middleware `verifyToken` bảo vệ các route cần authentication
- Public routes: `/register`, `/login`, `GET /posts`, `GET /posts/:id`

## 📁 File Upload

- Hỗ trợ upload ảnh thumbnail cho bài viết
- Định dạng cho phép: `.jpg`, `.jpeg`, `.png`
- Dung lượng tối đa: 2MB
- Files được lưu trong thư mục `uploads/`
- Auto-generate unique filenames

## 🎯 Events

Hệ thống sử dụng EventEmitter để xử lý events:
- `post:created` - Khi tạo bài viết mới
- `post:updated` - Khi cập nhật bài viết
- `post:deleted` - Khi xóa bài viết

Events được log ra console và file log.

## 📝 Logging

- Request logging với Morgan
- Custom logger middleware
- Log files được tạo theo ngày trong thư mục `logs/`
- Event logging cho post operations

## ⚡ Redis Cache

- Cache danh sách bài viết (5 phút)
- Cache chi tiết bài viết (10 phút)
- Auto-clear cache khi có thay đổi dữ liệu
- Graceful fallback nếu Redis không khả dụng

## 🔧 Query Parameters

### GET /api/posts
- `page`: Số trang (default: 1)
- `limit`: Số bài viết mỗi trang (default: 10)
- `sortBy`: Sắp xếp theo field (default: createdAt)
- `order`: Thứ tự sắp xếp asc/desc (default: desc)
- `category`: Lọc theo category
- `search`: Tìm kiếm trong title và content

## 🚨 Error Handling

- Global error handler
- Validation errors
- Authentication errors
- File upload errors
- Database errors
- Detailed error messages trong development mode

## 📊 Health Check

```http
GET /health
```

Trả về status của server và các thông tin hệ thống.

## 🏗️ Cấu trúc dự án

```
NodeASM/
├── config/
│   └── database.js          # MongoDB và Redis configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── postController.js    # Post CRUD logic
├── events/
│   └── postEvents.js        # EventEmitter cho posts
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── logger.js            # Logging middleware
│   └── upload.js            # File upload với Multer
├── models/
│   ├── User.js              # User schema
│   └── Post.js              # Post schema
├── routes/
│   ├── auth.js              # Authentication routes
│   └── posts.js             # Post routes
├── uploads/                 # Uploaded files
├── logs/                    # Log files
├── .env                     # Environment variables
├── package.json
└── server.js                # Main application file
```

## 🧪 Testing

Có thể test API bằng:
- Postman
- Thunder Client (VS Code extension)
- curl commands
- Frontend application

## 📈 Performance

- MongoDB indexing cho các fields thường query
- Redis caching cho improved response time
- Pagination để tránh load quá nhiều data
- File size limits để tối ưu storage

## 🔐 Security Features

- Password hashing với bcrypt (12 salt rounds)
- JWT token authentication
- File type validation
- File size limits
- Input validation
- CORS enabled
- Environment variables cho sensitive data
