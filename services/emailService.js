const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // For self-signed certificates
    }
  });
};

// Send email to single recipient
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send error to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Send email to multiple recipients
const sendBulkEmail = async (recipients, subject, htmlContent) => {
  const results = [];
  
  // Send emails in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(email => 
      sendEmail(email, subject, htmlContent)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Wait 1 second between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`📧 Bulk email results: ${successCount} sent, ${failCount} failed`);
  return { results, successCount, failCount };
};

// Generate HTML template for new post notification
const generateNewPostEmailTemplate = (post, author) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Post Published</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .post-info {
          background: #ecf0f1;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .post-title {
          color: #2980b9;
          font-size: 1.3em;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .post-meta {
          color: #7f8c8d;
          font-size: 0.9em;
          margin-bottom: 15px;
        }
        .post-content {
          margin: 15px 0;
          color: #2c3e50;
        }
        .btn {
          display: inline-block;
          background: #3498db;
          color: white;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .btn:hover {
          background: #2980b9;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #7f8c8d;
          font-size: 0.8em;
          border-top: 1px solid #ecf0f1;
          padding-top: 20px;
        }
        .thumbnail {
          max-width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 New Post Published!</h1>
          <p>A new post has been published on Post Management System</p>
        </div>
        
        <div class="post-info">
          <div class="post-title">${post.title}</div>
          <div class="post-meta">
            👤 Author: <strong>${author.username}</strong> ${author.fullName ? `(${author.fullName})` : ''}<br>
            📂 Category: <strong>${post.category}</strong><br>
            📅 Published: <strong>${new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</strong>
          </div>
          
          ${post.thumbnail ? `<img src="${baseUrl}${post.thumbnail}" alt="Post thumbnail" class="thumbnail">` : ''}
          
          <div class="post-content">
            <strong>Content Preview:</strong><br>
            ${post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${baseUrl}/api/posts/${post._id}" class="btn">📖 Read Full Post</a>
        </div>
        
        <div class="footer">
          <p>This email was sent automatically from Post Management System</p>
          <p>📧 Contact: ${process.env.FROM_EMAIL}</p>
          <p>🌐 Visit: <a href="${baseUrl}">${baseUrl}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ SMTP configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  generateNewPostEmailTemplate,
  testEmailConfig
};
