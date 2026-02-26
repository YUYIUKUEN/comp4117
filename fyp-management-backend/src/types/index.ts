/** Type definitions for email reminder system */

export interface EmailRecipient {
    address: string;
    displayName: string;
}

export interface EmailContent {
    subject: string;
    plainText: string;
    html?: string;
}

export interface EmailMessage {
    senderAddress: string;
    content: EmailContent;
    recipients: {
        to: EmailRecipient[];
    };
}

export interface LateSubmission {
    student_id: number;
    student_email: string;
    student_name: string;
    assignment_id: number;
    due_date: Date;
}

export interface EmailResponse {
    id: string;
    status: string;
}
