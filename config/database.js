const mongoose = require('mongoose');
const redis = require('redis');

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'postmanagement' // Specify database name here
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Redis Connection
const connectRedis = async () => {
  try {
    const client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    client.on('ready', () => {
      console.log('✅ Redis ready to accept commands');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    return null;
  }
};

module.exports = {
  connectMongoDB,
  connectRedis
};
