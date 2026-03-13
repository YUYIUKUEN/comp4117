const MeetingSlot = require('../models/MeetingSlot');
const Notification = require('../models/Notification');
const Assignment = require('../models/Assignment');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// ─── Helper: Get student IDs assigned to a supervisor ───
async function getAssignedStudentIds(supervisorId) {
  const assignments = await Assignment.find({
    supervisor_id: supervisorId,
    status: 'Active',
  }).select('student_id');
  return assignments.map((a) => a.student_id);
}

// ─── Helper: Verify student is assigned to supervisor ───
async function isStudentAssignedToSupervisor(studentId, supervisorId) {
  const assignment = await Assignment.findOne({
    student_id: studentId,
    supervisor_id: supervisorId,
    status: 'Active',
  });
  return !!assignment;
}

/**
 * Create a new meeting slot
 * POST /meetings/slots
 * Role: Supervisor
 */
exports.createSlot = async (req, res) => {
  try {
    const supervisorId = req.user._id;
    const { title, description, date, startTime, endTime, location, meetingType, maxAttendees, timeSlots, recurrence } =
      req.body;

    if (!title || !date) {
      return res.status(400).json({
        error: 'Title and date are required',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // Validate timeSlots or legacy single time
    if (!timeSlots || timeSlots.length === 0) {
      if (!startTime || !endTime) {
        return res.status(400).json({
          error: 'Either timeSlots array or startTime/endTime are required',
          code: 'VALIDATION_ERROR',
          status: 400,
        });
      }
      // Validate time order (legacy)
      if (startTime >= endTime) {
        return res.status(400).json({
          error: 'End time must be after start time',
          code: 'VALIDATION_ERROR',
          status: 400,
        });
      }
    } else {
      // Validate each time slot - ensure all have valid start/end times
      for (let i = 0; i < timeSlots.length; i++) {
        const ts = timeSlots[i];
        if (!ts || !ts.startTime || !ts.endTime) {
          return res.status(400).json({
            error: `Time slot ${i + 1} must have startTime and endTime`,
            code: 'VALIDATION_ERROR',
            status: 400,
          });
        }
        if (ts.startTime >= ts.endTime) {
          return res.status(400).json({
            error: `End time must be after start time for slot ${i + 1}`,
            code: 'VALIDATION_ERROR',
            status: 400,
          });
        }
      }
    }

    // If recurrence is set, expand the dates
    let slotData = {
      supervisor_id: supervisorId,
      title,
      description: description || '',
      date: new Date(date),
      startTime: startTime || null,
      endTime: endTime || null,
      timeSlots: timeSlots || [],
      location: location || '',
      meetingType: meetingType || 'one-to-one',
      maxAttendees: meetingType === 'one-to-one' ? 1 : maxAttendees || 1,
      status: 'Available',
      bookings: [],
      recurrence: recurrence || { pattern: 'none' },
    };

    const slot = await MeetingSlot.create(slotData);

    // Notify all assigned students about the new slot
    const studentIds = await getAssignedStudentIds(supervisorId);
    if (studentIds.length > 0) {
      const notifications = studentIds.map((studentId) => ({
        recipient_id: studentId,
        sender_id: supervisorId,
        type: 'MEETING_SLOT_CREATED',
        title: 'New Meeting Slot Available',
        message: `Your supervisor has proposed a new meeting slot: "${title}" on ${new Date(date).toLocaleDateString()} at ${startTime}.`,
        entityType: 'MeetingSlot',
        entityId: slot._id,
      }));
      await Notification.insertMany(notifications);
    }

    // Log activity
    await ActivityLog.create({
      user_id: supervisorId,
      action: 'CREATE_MEETING_SLOT',
      entityType: 'MeetingSlot',
      entityId: slot._id,
      details: { title, date, startTime, endTime, meetingType },
    });

    res.status(201).json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error('Error creating meeting slot:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        error: messages.join(', '),
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Create multiple meeting slots at once (batch)
 * POST /meetings/slots/batch
 * Role: Supervisor
 */
exports.createSlotsBatch = async (req, res) => {
  try {
    const supervisorId = req.user._id;
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res
        .status(400)
        .json({ error: 'slots array is required', code: 'VALIDATION_ERROR', status: 400 });
    }
    if (slots.length > 20) {
      return res.status(400).json({
        error: 'Maximum 20 slots per batch',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const createdSlots = [];
    for (const s of slots) {
      // Support both legacy and new formats
      if (!s.title || !s.date || ((s.timeSlots && s.timeSlots.length === 0) && (!s.startTime || !s.endTime))) continue;
      
      const slot = await MeetingSlot.create({
        supervisor_id: supervisorId,
        title: s.title,
        description: s.description || '',
        date: new Date(s.date),
        startTime: s.startTime || null,
        endTime: s.endTime || null,
        timeSlots: s.timeSlots || [],
        location: s.location || '',
        meetingType: s.meetingType || 'one-to-one',
        maxAttendees: s.meetingType === 'one-to-one' ? 1 : s.maxAttendees || 1,
        status: 'Available',
        bookings: [],
        recurrence: s.recurrence || { pattern: 'none' },
      });
      createdSlots.push(slot);
    }

    // Notify students
    const studentIds = await getAssignedStudentIds(supervisorId);
    if (studentIds.length > 0 && createdSlots.length > 0) {
      const notifications = studentIds.map((studentId) => ({
        recipient_id: studentId,
        sender_id: supervisorId,
        type: 'MEETING_SLOT_CREATED',
        title: 'New Meeting Slots Available',
        message: `Your supervisor has proposed ${createdSlots.length} new meeting slot(s). Check your meeting bookings page.`,
        entityType: 'MeetingSlot',
        entityId: createdSlots[0]._id,
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      data: createdSlots,
      count: createdSlots.length,
    });
  } catch (error) {
    console.error('Error creating meeting slots batch:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Get supervisor's own meeting slots
 * GET /meetings/slots/my-slots
 * Role: Supervisor
 */
exports.getSupervisorSlots = async (req, res) => {
  try {
    const supervisorId = req.user._id;
    const { status, page = 1, limit = 20, sortBy = 'date', order = 'asc' } = req.query;

    const query = { supervisor_id: supervisorId };
    if (status) query.status = status;

    const total = await MeetingSlot.countDocuments(query);
    const slots = await MeetingSlot.find(query)
      .populate({ path: 'bookings.student_id', select: 'fullName email concentration' })
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Sort bookings within each slot by bookedAt (latest first)
    const slotsWithSortedBookings = slots.map((slot) => {
      const slotObj = slot.toObject();
      if (slotObj.bookings && slotObj.bookings.length > 0) {
        slotObj.bookings.sort((a, b) => 
          new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()
        );
      }
      return slotObj;
    });

    res.json({
      success: true,
      data: slotsWithSortedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching supervisor slots:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Update a meeting slot
 * PUT /meetings/slots/:slotId
 * Role: Supervisor (owner)
 */
exports.updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const supervisorId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res
        .status(400)
        .json({ error: 'Invalid slot ID', code: 'INVALID_ID', status: 400 });
    }

    const slot = await MeetingSlot.findById(slotId);
    if (!slot) {
      return res
        .status(404)
        .json({ error: 'Meeting slot not found', code: 'NOT_FOUND', status: 404 });
    }
    if (!slot.supervisor_id.equals(supervisorId)) {
      return res
        .status(403)
        .json({ error: 'You can only edit your own slots', code: 'FORBIDDEN', status: 403 });
    }
    if (slot.bookings.length > 0) {
      return res.status(400).json({
        error: 'Cannot edit a slot that has bookings. Cancel the slot first.',
        code: 'HAS_BOOKINGS',
        status: 400,
      });
    }

    const { title, description, date, startTime, endTime, location, meetingType, maxAttendees } =
      req.body;
    if (title) slot.title = title;
    if (description !== undefined) slot.description = description;
    if (date) slot.date = new Date(date);
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (location !== undefined) slot.location = location;
    if (meetingType) {
      slot.meetingType = meetingType;
      slot.maxAttendees = meetingType === 'one-to-one' ? 1 : maxAttendees || slot.maxAttendees;
    }

    await slot.save();

    res.json({ success: true, data: slot });
  } catch (error) {
    console.error('Error updating meeting slot:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Cancel (delete) a meeting slot
 * DELETE /meetings/slots/:slotId
 * Role: Supervisor (owner)
 */
exports.deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const supervisorId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res
        .status(400)
        .json({ error: 'Invalid slot ID', code: 'INVALID_ID', status: 400 });
    }

    const slot = await MeetingSlot.findById(slotId);
    if (!slot) {
      return res
        .status(404)
        .json({ error: 'Meeting slot not found', code: 'NOT_FOUND', status: 404 });
    }
    if (!slot.supervisor_id.equals(supervisorId)) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own slots', code: 'FORBIDDEN', status: 403 });
    }

    // If there are bookings, notify students about cancellation
    if (slot.bookings.length > 0) {
      const notifications = slot.bookings.map((b) => ({
        recipient_id: b.student_id,
        sender_id: supervisorId,
        type: 'MEETING_CANCELLED',
        title: 'Meeting Cancelled',
        message: `The meeting "${slot.title}" on ${slot.date.toLocaleDateString()} at ${slot.startTime} has been cancelled by your supervisor.`,
        entityType: 'MeetingSlot',
        entityId: slot._id,
      }));
      await Notification.insertMany(notifications);
    }

    slot.status = 'Cancelled';
    await slot.save();

    await ActivityLog.create({
      user_id: supervisorId,
      action: 'CANCEL_MEETING_SLOT',
      entityType: 'MeetingSlot',
      entityId: slot._id,
      details: { title: slot.title },
    });

    res.json({ success: true, message: 'Meeting slot cancelled' });
  } catch (error) {
    console.error('Error deleting meeting slot:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Mark a meeting slot as completed
 * POST /meetings/slots/:slotId/complete
 * Role: Supervisor (owner)
 */
exports.completeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const supervisorId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res
        .status(400)
        .json({ error: 'Invalid slot ID', code: 'INVALID_ID', status: 400 });
    }

    const slot = await MeetingSlot.findById(slotId);
    if (!slot) {
      return res
        .status(404)
        .json({ error: 'Meeting slot not found', code: 'NOT_FOUND', status: 404 });
    }
    if (!slot.supervisor_id.equals(supervisorId)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN', status: 403 });
    }
    if (slot.status === 'Completed') {
      return res
        .status(400)
        .json({ error: 'Slot already completed', code: 'ALREADY_COMPLETED', status: 400 });
    }

    slot.status = 'Completed';
    await slot.save();

    // Notify booked students
    if (slot.bookings.length > 0) {
      const notifications = slot.bookings.map((b) => ({
        recipient_id: b.student_id,
        sender_id: supervisorId,
        type: 'MEETING_COMPLETED',
        title: 'Meeting Completed',
        message: `The meeting "${slot.title}" has been marked as completed.`,
        entityType: 'MeetingSlot',
        entityId: slot._id,
      }));
      await Notification.insertMany(notifications);
    }

    res.json({ success: true, data: slot });
  } catch (error) {
    console.error('Error completing meeting slot:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

// ═══════════════════════════════════════════
//  STUDENT ENDPOINTS
// ═══════════════════════════════════════════

/**
 * Get available meeting slots for the student's supervisor
 * GET /meetings/slots/available
 * Role: Student
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find the student's active assignment to get their supervisor
    const assignment = await Assignment.findOne({
      student_id: studentId,
      status: 'Active',
    });

    if (!assignment) {
      return res.status(404).json({
        error: 'You do not have an active supervisor assignment',
        code: 'NO_ASSIGNMENT',
        status: 404,
      });
    }

    const supervisorId = assignment.supervisor_id;

    // Fetch all non-cancelled slots from this supervisor
    // Note: sort by single field only (Cosmos DB doesn't support compound sort without composite index)
    const slots = await MeetingSlot.find({
      supervisor_id: supervisorId,
      status: { $in: ['Available', 'Booked', 'Completed'] },
    })
      .populate({ path: 'supervisor_id', select: 'fullName email' })
      .populate({ path: 'bookings.student_id', select: 'fullName email' })
      .sort({ date: 1 });

    // Secondary sort by startTime in-memory
    slots.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    // For each slot, indicate if this student has booked it and sort bookings (latest first)
    const slotsWithBookingInfo = slots.map((slot) => {
      const slotObj = slot.toObject();
      
      // Sort bookings by bookedAt (latest first)
      if (slotObj.bookings && slotObj.bookings.length > 0) {
        slotObj.bookings.sort((a, b) => 
          new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()
        );
      }
      
      slotObj.myBooking = slot.bookings.find(
        (b) => b.student_id && b.student_id._id.toString() === studentId.toString()
      );
      return slotObj;
    });

    res.json({
      success: true,
      data: slotsWithBookingInfo,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Book a meeting slot
 * POST /meetings/slots/:slotId/book
 * Role: Student
 */
exports.bookSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const studentId = req.user._id;
    const { notes, timeSlotIndex } = req.body;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res
        .status(400)
        .json({ error: 'Invalid slot ID', code: 'INVALID_ID', status: 400 });
    }

    const slot = await MeetingSlot.findById(slotId);
    if (!slot) {
      return res
        .status(404)
        .json({ error: 'Meeting slot not found', code: 'NOT_FOUND', status: 404 });
    }

    // Verify student is assigned to this supervisor
    const isAssigned = await isStudentAssignedToSupervisor(studentId, slot.supervisor_id);
    if (!isAssigned) {
      return res.status(403).json({
        error: 'You can only book slots from your assigned supervisor',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Check slot is still available
    if (slot.status !== 'Available') {
      return res.status(400).json({
        error: 'This slot is no longer available for booking',
        code: 'SLOT_UNAVAILABLE',
        status: 400,
      });
    }

    // Check if already booked by this student
    const alreadyBooked = slot.bookings.some(
      (b) => b.student_id.toString() === studentId.toString()
    );
    if (alreadyBooked) {
      return res.status(400).json({
        error: 'You have already booked this slot',
        code: 'ALREADY_BOOKED',
        status: 400,
      });
    }

    // Validate timeSlotIndex if provided and multiple slots exist
    if (slot.timeSlots && slot.timeSlots.length > 0 && timeSlotIndex !== undefined && timeSlotIndex !== null) {
      if (typeof timeSlotIndex !== 'number' || timeSlotIndex < 0 || timeSlotIndex >= slot.timeSlots.length) {
        return res.status(400).json({
          error: 'Invalid time slot index',
          code: 'INVALID_TIME_SLOT',
          status: 400,
        });
      }
    }

    // Check capacity (per time slot if multiple slots, or overall)
    if (slot.timeSlots && slot.timeSlots.length > 1) {
      // For meetings with 2+ time slots: require and validate timeSlotIndex
      if (timeSlotIndex === undefined || timeSlotIndex === null) {
        return res.status(400).json({
          error: 'Please select a time slot',
          code: 'TIME_SLOT_REQUIRED',
          status: 400,
        });
      }
      if (typeof timeSlotIndex !== 'number' || timeSlotIndex < 0 || timeSlotIndex >= slot.timeSlots.length) {
        return res.status(400).json({
          error: 'Invalid time slot index',
          code: 'INVALID_TIME_SLOT',
          status: 400,
        });
      }
      
      // Per-time-slot capacity check
      const bookingsForTimeSlot = slot.bookings.filter(
        (b) => b.timeSlotIndex === timeSlotIndex
      ).length;
      if (bookingsForTimeSlot >= slot.maxAttendees) {
        return res.status(400).json({
          error: `Time slot ${slot.timeSlots[timeSlotIndex].startTime} – ${slot.timeSlots[timeSlotIndex].endTime} is fully booked`,
          code: 'TIME_SLOT_FULL',
          status: 400,
        });
      }
    } else if (slot.timeSlots && slot.timeSlots.length === 1) {
      // For single time slot meetings: validate if timeSlotIndex is provided
      if (timeSlotIndex !== undefined && timeSlotIndex !== null) {
        if (typeof timeSlotIndex !== 'number' || timeSlotIndex !== 0) {
          return res.status(400).json({
            error: 'Invalid time slot index',
            code: 'INVALID_TIME_SLOT',
            status: 400,
          });
        }
      }
      
      // Check overall capacity
      if (slot.bookings.length >= slot.maxAttendees) {
        return res.status(400).json({
          error: 'This slot is fully booked',
          code: 'SLOT_FULL',
          status: 400,
        });
      }
    } else {
      // For meetings with no timeSlots (legacy format): check overall capacity
      if (slot.bookings.length >= slot.maxAttendees) {
        return res.status(400).json({
          error: 'This slot is fully booked',
          code: 'SLOT_FULL',
          status: 400,
        });
      }
    }

    // Add booking with timeSlotIndex
    slot.bookings.push({
      student_id: studentId,
      bookedAt: new Date(),
      notes: notes || '',
      timeSlotIndex: timeSlotIndex !== undefined ? timeSlotIndex : null,
    });

    // Auto-set status to Booked only when ALL time slots are fully booked
    if (slot.timeSlots && slot.timeSlots.length > 1) {
      // For meetings with multiple time slots (2 or more): check if all are fully booked
      const allSlotsFull = slot.timeSlots.every((_, index) => {
        const bookingsForThisSlot = slot.bookings.filter(
          (b) => b.timeSlotIndex === index
        ).length;
        return bookingsForThisSlot >= slot.maxAttendees;
      });
      if (allSlotsFull) {
        slot.status = 'Booked';
      }
    } else if (slot.timeSlots && slot.timeSlots.length === 1) {
      // For single time slot meetings (legacy or 1-slot format)
      if (slot.bookings.length >= slot.maxAttendees) {
        slot.status = 'Booked';
      }
    } else {
      // For meetings with NO timeSlots (legacy format with startTime/endTime): use original logic
      if (slot.bookings.length >= slot.maxAttendees) {
        slot.status = 'Booked';
      }
    }

    await slot.save();

    // Notify the supervisor
    const student = req.user;
    await Notification.create({
      recipient_id: slot.supervisor_id,
      sender_id: studentId,
      type: 'MEETING_BOOKED',
      title: 'Meeting Booked by Student',
      message: `${student.fullName} has booked your meeting slot "${slot.title}" on ${slot.date.toLocaleDateString()} at ${slot.startTime}.`,
      entityType: 'MeetingSlot',
      entityId: slot._id,
    });

    // Log activity
    await ActivityLog.create({
      user_id: studentId,
      action: 'BOOK_MEETING_SLOT',
      entityType: 'MeetingSlot',
      entityId: slot._id,
      details: { title: slot.title, supervisorId: slot.supervisor_id },
    });

    // Populate before returning
    await slot.populate([
      { path: 'supervisor_id', select: 'fullName email' },
      { path: 'bookings.student_id', select: 'fullName email' },
    ]);

    res.json({ success: true, data: slot });
  } catch (error) {
    console.error('Error booking meeting slot:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Cancel a booking (student withdraws)
 * DELETE /meetings/slots/:slotId/book
 * Role: Student
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { slotId } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res
        .status(400)
        .json({ error: 'Invalid slot ID', code: 'INVALID_ID', status: 400 });
    }

    const slot = await MeetingSlot.findById(slotId);
    if (!slot) {
      return res
        .status(404)
        .json({ error: 'Meeting slot not found', code: 'NOT_FOUND', status: 404 });
    }

    const bookingIndex = slot.bookings.findIndex(
      (b) => b.student_id.toString() === studentId.toString()
    );
    if (bookingIndex === -1) {
      return res.status(400).json({
        error: 'You have not booked this slot',
        code: 'NO_BOOKING',
        status: 400,
      });
    }

    slot.bookings.splice(bookingIndex, 1);

    // Recalculate status after cancellation
    // For multi-slot meetings: revert to Available if any slot has capacity
    if (slot.timeSlots && slot.timeSlots.length > 1) {
      // Check if all slots are STILL fully booked
      const allSlotsFull = slot.timeSlots.every((_, index) => {
        const bookingsForThisSlot = slot.bookings.filter(
          (b) => b.timeSlotIndex === index
        ).length;
        return bookingsForThisSlot >= slot.maxAttendees;
      });
      // If any slot now has capacity, revert to Available
      if (!allSlotsFull && slot.status === 'Booked') {
        slot.status = 'Available';
      }
    } else if (slot.timeSlots && slot.timeSlots.length === 1) {
      // For single time slot meetings
      if (slot.status === 'Booked' && slot.bookings.length < slot.maxAttendees) {
        slot.status = 'Available';
      }
    } else {
      // For legacy single slot meetings
      if (slot.status === 'Booked' && slot.bookings.length < slot.maxAttendees) {
        slot.status = 'Available';
      }
    }

    await slot.save();

    // Notify supervisor
    await Notification.create({
      recipient_id: slot.supervisor_id,
      sender_id: studentId,
      type: 'MEETING_CANCELLED',
      title: 'Meeting Booking Cancelled',
      message: `${req.user.fullName} has cancelled their booking for "${slot.title}" on ${slot.date.toLocaleDateString()} at ${slot.startTime}.`,
      entityType: 'MeetingSlot',
      entityId: slot._id,
    });

    res.json({ success: true, message: 'Booking cancelled', data: slot });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

// ═══════════════════════════════════════════
//  NOTIFICATION ENDPOINTS
// ═══════════════════════════════════════════

/**
 * Get notifications for the authenticated user
 * GET /meetings/notifications
 * Role: Any authenticated
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    const query = { recipient_id: userId };
    if (unreadOnly === 'true') query.read = false;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate({ path: 'sender_id', select: 'fullName email role' })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const unreadCount = await Notification.countDocuments({ recipient_id: userId, read: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};

/**
 * Mark notification(s) as read
 * PUT /meetings/notifications/read
 * Role: Any authenticated
 */
exports.markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    const query = { recipient_id: userId };
    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    await Notification.updateMany(query, { $set: { read: true, readAt: new Date() } });

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 });
  }
};
