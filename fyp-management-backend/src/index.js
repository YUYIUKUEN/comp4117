const app = require('./app');
const cron = require('node-cron');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`✓ Server running on http://localhost:${port}`);

  // Auto-reminder cron: runs every hour, checks settings to decide whether to send
  cron.schedule('0 * * * *', async () => {
    try {
      const SystemSetting = require('./models/SystemSetting');
      const settings = await SystemSetting.get('autoReminderSettings', { enabled: false });

      if (!settings || !settings.enabled) return;

      console.log('[Cron] Running auto-reminder job…');
      const { runAutoReminders } = require('./controllers/adminReminderController');
      // Call without req/res – the function handles it gracefully
      await runAutoReminders({ auth: { userId: null } }, null, null);
    } catch (err) {
      console.error('[Cron] Auto-reminder error:', err.message);
    }
  });
  console.log('✓ Auto-reminder cron job registered (hourly)');
});
