const nodemailer = require('nodemailer');

// Create a transporter using SMTP settings (e.g., for Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can also use a custom SMTP service
  auth: {
    user: process.env.EMAIL, // Your Gmail address
    pass: process.env.EMAIL_PASSWORD, // Your Gmail password or app-specific password
  },
});

// Function to send an approval email
const sendApprovalEmail = async (email, adSpace, adDetails) => {
  const mailOptions = {
    from: process.env.EMAIL, // Sender's email (your Gmail)
    to: email, // Web owner's email from adSpace.webOwnerEmail
    subject: 'New Ad Request for Approval',
    html: `
      <h2>New Ad Request for Your Space: ${adSpace.spaceType}</h2>
      <p>A new ad has been submitted for approval in your ad space. Please review the details below:</p>
      <p><strong>Business Name:</strong> ${adDetails.businessName}</p>
      <p><strong>Description:</strong> ${adDetails.adDescription}</p>
      <p>Please log in to your dashboard to approve or reject this ad.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendApprovalEmail };
