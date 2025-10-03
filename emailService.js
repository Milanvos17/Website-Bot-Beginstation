const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Send registration approval request to owner
async function sendApprovalRequest(userEmail, approvalToken) {
  // Use the public URL if available, otherwise fallback to localhost
  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT}`;
  const approvalLink = `${baseUrl}/approve-registration?token=${approvalToken}`;
  
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.OWNER_EMAIL,
    subject: 'New User Registration Approval Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc143c;">Beginstation Robot Control - Registration Request</h2>
        <p>A new user has registered and requires your approval:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #dc143c; margin: 20px 0;">
          <strong>Email:</strong> ${userEmail}
        </div>
        <p>Please click the link below to review and approve/deny this registration:</p>
        <a href="${approvalLink}" style="display: inline-block; background-color: #dc143c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
          Review Registration Request
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${approvalLink}
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Approval request email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send approval notification to user
async function sendApprovalNotification(userEmail, approved, role = null) {
  const subject = approved ? 'Registration Approved' : 'Registration Denied';
  const message = approved 
    ? `Your registration has been approved! You have been assigned the role: <strong>${role}</strong>. You can now log in to the system.`
    : 'Your registration request has been denied. Please contact the administrator for more information.';

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: userEmail,
    subject: `Beginstation Robot Control - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc143c;">Beginstation Robot Control</h2>
        <div style="background-color: ${approved ? '#d4edda' : '#f8d7da'}; padding: 15px; border-left: 4px solid ${approved ? '#28a745' : '#dc143c'}; margin: 20px 0;">
          <p>${message}</p>
        </div>
        ${approved ? `<p>You can now <a href="${process.env.PUBLIC_URL || `http://localhost:${process.env.PORT}`}/login" style="color: #dc143c;">log in</a> to access the system.</p>` : ''}
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

module.exports = {
  sendApprovalRequest,
  sendApprovalNotification
};