import cron from 'node-cron';
import { checkAndSendReminders } from './services/email-reminder.service';


export function startScheduler(): void {
    // For testing: every 5 minutes
    // For production: every hour at minute 0
    const cronPattern = '*/5 * * * *'; // Change to '0 * * * *' for production
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           📧 Email Reminder System Starting...                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`⏰ Schedule: ${cronPattern}`);
    console.log(`   (Currently set to check every 5 minutes for testing)`);
    console.log(`   Change to '0 * * * *' in scheduler.ts for hourly checks\n`);

    // Schedule the reminder check
    cron.schedule(cronPattern, async () => {
        try {
            await checkAndSendReminders();
        } catch (error) {
            console.error('❌ Scheduler execution error:', error);
        }
    });

    console.log('✅ Scheduler started successfully!');
    console.log('   Press Ctrl+C to stop the system.\n');
    console.log(`${'─'.repeat(80)}\n`);
}
