import { sendLateSubmissionReminder } from '../utils/azure-email';
import { LateSubmission } from '../types';

/**
 * MOCK: Return fake late submissions for testing
 * Replace this with real database queries later
 */
export async function getLateSubmissions(): Promise<LateSubmission[]> {
    console.log('📋 Using MOCK data (no database connected)');
    
    // Get test email from environment or use default
    const testEmail = process.env.TEST_RECIPIENT_EMAIL || 'test@example.com';
    const testName = process.env.TEST_RECIPIENT_NAME || 'Test Student';
    
    // Mock data - simulate late submissions
    const mockSubmissions: LateSubmission[] = [
        {
            student_id: 1,
            student_email: testEmail,
            student_name: testName,
            assignment_id: 101,
            due_date: new Date('2026-02-01T23:59:00') // Past date
        },
        {
            student_id: 2,
            student_email: testEmail,
            student_name: 'Another Test Student',
            assignment_id: 102,
            due_date: new Date('2026-01-28T18:00:00') // Past date
        }
    ];

    // Filter to only return submissions with past due dates
    const now = new Date();
    return mockSubmissions.filter(sub => sub.due_date < now);
}

/**
 * MOCK: Simulate marking submission as reminded
 * In real implementation, this updates the database
 */
export async function markAsReminded(studentId: number, assignmentId: number): Promise<void> {
    console.log(`   ✅ MOCK: Marked student ${studentId}, assignment ${assignmentId} as reminded`);
    // In production: UPDATE submissions SET reminder_sent = TRUE WHERE student_id = ? AND assignment_id = ?
}

/**
 * Main function to check for late submissions and send reminders
 */
export async function checkAndSendReminders(): Promise<void> {
    const timestamp = new Date().toLocaleString('en-HK', { 
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${timestamp}] 🔍 Starting reminder check...`);
    console.log(`${'='.repeat(80)}\n`);

    try {
        // Fetch late submissions
        const lateSubmissions = await getLateSubmissions();
        
        if (lateSubmissions.length === 0) {
            console.log(`✅ No late submissions found. All students are up to date!\n`);
            return;
        }

        console.log(`📧 Found ${lateSubmissions.length} late submission(s). Sending reminders...\n`);

        let successCount = 0;
        let failCount = 0;

        // Send reminder to each student
        for (const submission of lateSubmissions) {
            console.log(`\n📤 Processing: Student ID ${submission.student_id}, Assignment #${submission.assignment_id}`);
            console.log(`   Email: ${submission.student_email}`);
            console.log(`   Due Date: ${submission.due_date.toLocaleString()}`);
            
            try {
                // Send the reminder email
                await sendLateSubmissionReminder(
                    submission.student_email,
                    submission.student_name,
                    submission.assignment_id,
                    submission.due_date
                );

                // Mark as reminded in database
                await markAsReminded(submission.student_id, submission.assignment_id);
                
                successCount++;

            } catch (error) {
                console.error(`   ❌ Failed to send reminder:`, error);
                failCount++;
            }
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 Summary: Success: ${successCount} | Failed: ${failCount} | Total: ${lateSubmissions.length}`);
        console.log(`${'='.repeat(80)}\n`);

    } catch (error) {
        console.error(`\n❌ Critical error in checkAndSendReminders:`, error);
        throw error;
    }
}
