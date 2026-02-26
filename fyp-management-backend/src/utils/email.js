const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING;
const senderAddress = process.env.SENDER_EMAIL;

let emailClient = null;

// Initialize Azure email client if credentials are available
if (connectionString && senderAddress) {
  try {
    const { EmailClient } = require('@azure/communication-email');
    emailClient = new EmailClient(connectionString);
    console.log('✅ Azure Email Service initialized');
  } catch (err) {
    console.warn('⚠️  @azure/communication-email not installed. Email sending will be simulated.');
    console.warn('   Run: npm install @azure/communication-email');
  }
} else {
  console.warn('⚠️  Azure email credentials not configured. Email sending will be simulated.');
  console.warn('   Set AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING and SENDER_EMAIL in .env');
}

/**
 * Send an email using Azure Communication Service.
 * Falls back to console logging when Azure is not configured.
 *
 * @param {string} recipientEmail
 * @param {string} recipientName
 * @param {string} subject
 * @param {string} plainText
 * @param {string} [htmlContent]
 * @returns {Promise<{ id: string, status: string }>}
 */
async function sendEmail(recipientEmail, recipientName, subject, plainText, htmlContent) {
  const message = {
    senderAddress: senderAddress || 'noreply@fyp-platform.com',
    content: {
      subject,
      plainText,
      ...(htmlContent && { html: htmlContent }),
    },
    recipients: {
      to: [
        {
          address: recipientEmail,
          displayName: recipientName,
        },
      ],
    },
  };

  // If Azure email client is available, send real email
  if (emailClient) {
    try {
      console.log(`📤 Sending email to ${recipientEmail}...`);
      const poller = await emailClient.beginSend(message);
      const response = await poller.pollUntilDone();
      console.log(`✅ Email sent — ID: ${response.id}, Status: ${response.status}`);
      return { id: response.id, status: response.status };
    } catch (error) {
      console.error(`❌ Error sending email to ${recipientEmail}:`, error.message);
      throw error;
    }
  }

  // Fallback: simulate email in development
  console.log(`📧 [SIMULATED] Email to ${recipientEmail} (${recipientName})`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body preview: ${plainText.substring(0, 120)}...`);
  return { id: `sim-${Date.now()}`, status: 'Simulated' };
}

module.exports = { sendEmail };
