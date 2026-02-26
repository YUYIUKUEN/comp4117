import dotenv from 'dotenv';
import { startScheduler } from './scheduler';
import { checkAndSendReminders } from './services/email-reminder.service';

// Load environment variables
dotenv.config();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    console.log('✅ Email reminder system stopped.\n');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    console.log('✅ Email reminder system stopped.\n');
    process.exit(0);
});

/**
 * Main entry point
 */
(async () => {
    const args = process.argv.slice(2);
    
    // Check for --test flag: npm run test
    if (args.includes('--test')) {
        console.log('╔════════════════════════════════════════════════════════════════╗');
        console.log('║              🧪 Running Manual Test (One-Time Check)          ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
        
        try {
            await checkAndSendReminders();
            console.log('✅ Test completed successfully!\n');
            process.exit(0);
        } catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
    } else {
        // Start the scheduled system
        startScheduler();
    }
})();
