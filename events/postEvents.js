const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { sendBulkEmail, generateNewPostEmailTemplate } = require('../services/emailService');

class PostEventEmitter extends EventEmitter {}

const postEmitter = new PostEventEmitter();

// Event listener for post creation
postEmitter.on('post:created', async (postData) => {
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

  // Send email notifications to all active users (except the author)
  try {
    // Get all active users with email addresses (excluding the post author)
    const users = await User.find({ 
      isActive: true, 
      email: { $exists: true, $ne: null, $ne: '' },
      _id: { $ne: postData.author._id }
    }).select('email username');

    if (users.length > 0) {
      const emailList = users.map(user => user.email);
      const subject = `📝 New Post: "${postData.title}"`;
      const htmlContent = generateNewPostEmailTemplate(postData, postData.author);

      console.log(`📧 Sending new post notification to ${emailList.length} users...`);
      
      // Send emails in background (don't wait for completion)
      sendBulkEmail(emailList, subject, htmlContent)
        .then(result => {
          console.log(`✅ Email notifications sent: ${result.successCount} success, ${result.failCount} failed`);
        })
        .catch(error => {
          console.error('❌ Error sending email notifications:', error);
        });
    } else {
      console.log('📧 No users with email addresses found for notification');
    }
  } catch (error) {
    console.error('❌ Error fetching users for email notification:', error);
  }
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
