const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class PostEventEmitter extends EventEmitter {}

const postEmitter = new PostEventEmitter();

// Event listener for post creation
postEmitter.on('post:created', (postData) => {
  // Log to console
  console.log(`🎉 New post created: "${postData.title}" by ${postData.author.username}`);
  
  // Log to file
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `posts-${new Date().toISOString().split('T')[0]}.log`);
  const logMessage = `[${new Date().toISOString()}] POST_CREATED - Title: "${postData.title}", Author: ${postData.author.username}, Category: ${postData.category}\n`;
  
  fs.appendFileSync(logFile, logMessage);
});

// Event listener for post update
postEmitter.on('post:updated', (postData) => {
  console.log(`✏️ Post updated: "${postData.title}" by ${postData.author.username}`);
  
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `posts-${new Date().toISOString().split('T')[0]}.log`);
  const logMessage = `[${new Date().toISOString()}] POST_UPDATED - Title: "${postData.title}", Author: ${postData.author.username}\n`;
  
  fs.appendFileSync(logFile, logMessage);
});

// Event listener for post deletion
postEmitter.on('post:deleted', (postData) => {
  console.log(`🗑️ Post deleted: "${postData.title}" by ${postData.author.username}`);
  
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `posts-${new Date().toISOString().split('T')[0]}.log`);
  const logMessage = `[${new Date().toISOString()}] POST_DELETED - Title: "${postData.title}", Author: ${postData.author.username}\n`;
  
  fs.appendFileSync(logFile, logMessage);
});

module.exports = postEmitter;
