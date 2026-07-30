const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
const handlebars = require('handlebars');
const fs = require('fs');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email HTML content
 */
const sendEmail = async ({ email, subject, message }) => {
  try {
    // Create transporter
    let transporter;

    if (process.env.EMAIL_SERVICE === 'gmail') {
      // Gmail OAuth2 configuration
      const oAuth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );
      oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

      const accessToken = await oAuth2Client.getAccessToken();

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          accessToken: accessToken,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
      });
    } else {
      // SMTP configuration (fallback)
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SentinelX AI" <noreply@sentinelxai.com>',
      to: email,
      subject: subject,
      html: message
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;