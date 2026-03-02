const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  createSlot,
  createSlotsBatch,
  getSupervisorSlots,
  updateSlot,
  deleteSlot,
  completeSlot,
  getAvailableSlots,
  bookSlot,
  cancelBooking,
  getNotifications,
  markNotificationsRead,
} = require('../controllers/meetingController');

/**
 * Supervisor endpoints — manage meeting slots
 */

// Create a single meeting slot
router.post('/slots', authenticate, requireRole(['Supervisor']), createSlot);

// Create multiple slots in batch
router.post('/slots/batch', authenticate, requireRole(['Supervisor']), createSlotsBatch);

// Get supervisor's own slots
router.get('/slots/my-slots', authenticate, requireRole(['Supervisor']), getSupervisorSlots);

// Update a slot (only if no bookings yet)
router.put('/slots/:slotId', authenticate, requireRole(['Supervisor']), updateSlot);

// Cancel a slot
router.delete('/slots/:slotId', authenticate, requireRole(['Supervisor']), deleteSlot);

// Mark slot as completed
router.post('/slots/:slotId/complete', authenticate, requireRole(['Supervisor']), completeSlot);

/**
 * Student endpoints — view & book meeting slots
 */

// Get available slots from assigned supervisor
router.get('/slots/available', authenticate, requireRole(['Student']), getAvailableSlots);

// Book a slot
router.post('/slots/:slotId/book', authenticate, requireRole(['Student']), bookSlot);

// Cancel own booking
router.delete('/slots/:slotId/book', authenticate, requireRole(['Student']), cancelBooking);

/**
 * Notification endpoints — any authenticated user
 */

// Get notifications
router.get('/notifications', authenticate, getNotifications);

// Mark notifications as read
router.put('/notifications/read', authenticate, markNotificationsRead);

module.exports = router;
