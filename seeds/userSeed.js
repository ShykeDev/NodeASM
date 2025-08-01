require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Sample users data
const usersData = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    email: 'admin@postmanagement.com',
    fullName: 'System Administrator',
    isActive: true
  },
  {
    username: 'john_doe',
    password: 'password123',
    role: 'user',
    email: 'john@example.com',
    fullName: 'John Doe',
    isActive: true
  },
  {
    username: 'jane_smith',
    password: 'password123',
    role: 'user',
    email: 'jane@example.com',
    fullName: 'Jane Smith',
    isActive: true
  },
  {
    username: 'tech_writer',
    password: 'password123',
    role: 'user',
    email: 'writer@techblog.com',
    fullName: 'Tech Writer',
    isActive: true
  },
  {
    username: 'lifestyle_blogger',
    password: 'password123',
    role: 'user',
    email: 'blogger@lifestyle.com',
    fullName: 'Lifestyle Blogger',
    isActive: true
  }
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'postmanagement'
    });
    console.log('✅ Connected to MongoDB for seeding');

    console.log('🌱 Starting user seeding process...');

    for (const userData of usersData) {
      // Check if user already exists
      const existingUser = await User.findOne({ username: userData.username });
      
      if (existingUser) {
        console.log(`⚠️  User '${userData.username}' already exists - skipping`);
        continue;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create new user
      const newUser = new User({
        ...userData,
        password: hashedPassword
      });

      await newUser.save();
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    console.log('🎉 User seeding completed successfully!');

    // Display summary
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    console.log('\n📊 User Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admin Users: ${adminUsers}`);
    console.log(`   Regular Users: ${regularUsers}`);

    // Display all users
    const allUsers = await User.find({}, 'username role email fullName isActive createdAt').sort({ role: -1, username: 1 });
    console.log('\n👥 All Users:');
    allUsers.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      const statusIcon = user.isActive ? '✅' : '❌';
      console.log(`   ${roleIcon} ${user.username} (${user.role}) ${statusIcon} - ${user.fullName || 'No name'}`);
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run seeding
seedUsers();
