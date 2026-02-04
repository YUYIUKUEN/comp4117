import { EmailClient } from '@azure/communication-email';
import dotenv from 'dotenv';
import { EmailMessage, EmailResponse } from '../types';

dotenv.config();

const connectionString = process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING;
const senderAddress = process.env.SENDER_EMAIL;

if (!connectionString) {
    throw new Error('❌ AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING not found in .env file');
}

if (!senderAddress) {
    throw new Error('❌ SENDER_EMAIL not found in .env file');
}

const emailClient = new EmailClient(connectionString);

/**
 * Send an email using Azure Communication Service
 * 
 * @param recipientEmail - Recipient's email address
 * @param recipientName - Recipient's display name
 * @param subject - Email subject
 * @param plainText - Plain text email body
 * @param htmlContent - Optional HTML email body
 * @returns Promise with email response containing id and status
 */
export async function sendEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    plainText: string,
    htmlContent?: string
): Promise<EmailResponse> {
    const message: EmailMessage = {
        senderAddress: senderAddress!,
        content: {
            subject,
            plainText,
            ...(htmlContent && { html: htmlContent })
        },
        recipients: {
            to: [
                {
                    address: recipientEmail,
                    displayName: recipientName
                }
            ]
        }
    };

    try {
        console.log(`📤 Sending email to ${recipientEmail}...`);
        
        const poller = await emailClient.beginSend(message);
        const response = await poller.pollUntilDone();
        
        console.log(`✅ Email sent successfully!`);
        console.log(`   Message ID: ${response.id}`);
        console.log(`   Status: ${response.status}`);
        
        return {
            id: response.id,
            status: response.status
        };
    } catch (error) {
        console.error(`❌ Error sending email to ${recipientEmail}:`, error);
        throw error;
    }
}

/**
 * Send late submission reminder email
 * 
 * @param studentEmail - Student's email address
 * @param studentName - Student's name
 * @param assignmentId - Assignment ID
 * @param dueDate - Original due date
 * @returns Promise with email response
 */
export async function sendLateSubmissionReminder(
    studentEmail: string,
    studentName: string,
    assignmentId: number,
    dueDate: Date
): Promise<EmailResponse> {
    const subject = 'Late Submission Reminder - Assignment Overdue';
    
    const formatDate = (date: Date): string => {
        return date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
    };

    const plainText = `
Dear ${studentName},

This is a reminder that your submission for Assignment #${assignmentId} is overdue.

Original Due Date: ${formatDate(dueDate)}

Please submit your work as soon as possible through the learning platform to avoid further penalties.

Best regards,
FYP Java Learning Platform Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Late Submission Reminder</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px 40px;
        }
        .content p {
            margin: 15px 0;
        }
        .info-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #856404;
        }
        .highlight {
            color: #d9534f;
            font-weight: 600;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 500;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 40px;
            border-top: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
        }
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">⚠️</div>
            <h1>Late Submission Reminder</h1>
        </div>
        
        <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            
            <p>This is an automated reminder that your submission for <strong>Assignment #${assignmentId}</strong> is currently overdue.</p>
            
            <div class="info-box">
                <strong>Original Due Date:</strong> <span class="highlight">${formatDate(dueDate)}</span>
            </div>
            
            <p>Please submit your work as soon as possible through the learning platform to avoid further penalties.</p>
            
            <p>If you have already submitted or have questions about this assignment, please contact your instructor.</p>
        </div>
        
        <div class="footer">
            <p><strong>Best regards,</strong></p>
            <p>FYP Java Learning Platform Team</p>
            <p style="margin-top: 15px; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return sendEmail(studentEmail, studentName, subject, plainText, htmlContent);
}
