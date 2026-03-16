const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  _id: false,
  startTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/,
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/,
  },
}, { _id: false });

const meetingSlotSchema = new mongoose.Schema(
  {
    supervisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    // Legacy single date/time (kept for backward compatibility)
    date: {
      type: Date,
      required: false,
    },
    startTime: {
      type: String,
      required: false,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: false,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    // Multiple time slots support (NEW)
    timeSlots: [timeSlotSchema], // array of {startTime, endTime}
    
    location: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    meetingType: {
      type: String,
      enum: ['one-to-one', 'group'],
      default: 'one-to-one',
    },
    maxAttendees: {
      type: Number,
      default: 2,
      min: 1,
      max: 50,
    },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Completed', 'Cancelled'],
      default: 'Available',
    },
    // Recurrence support (NEW)
    recurrence: {
      pattern: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly'],
        default: 'none',
      },
      endDate: {
        type: Date,
        default: null,
      },
      daysOfWeek: [Number], // 0-6 for weekly recurrence
    },
    bookings: [
      {
        student_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        bookedAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          maxlength: 500,
          default: '',
        },
        timeSlotIndex: {
          type: Number,
          default: null, // null if booking is for legacy single slot
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
meetingSlotSchema.index({ supervisor_id: 1 });
meetingSlotSchema.index({ date: 1 });
meetingSlotSchema.index({ status: 1 });
meetingSlotSchema.index({ 'bookings.student_id': 1 });

// Virtual: check if slot is fully booked
meetingSlotSchema.virtual('isFullyBooked').get(function () {
  return this.bookings.length >= this.maxAttendees;
});

// Pre-save: auto-update status when fully booked (respecting multi-slot logic)
meetingSlotSchema.pre('save', function (next) {
  // Only auto-update status if not explicitly set in the current operation
  // Multi-slot logic: ALL time slots must be full to mark as 'Booked'
  if (this.timeSlots && this.timeSlots.length > 1) {
    // For meetings with multiple time slots
    const allSlotsFull = this.timeSlots.every((_, index) => {
      const bookingsForThisSlot = this.bookings.filter((b) => b.timeSlotIndex === index).length;
      return bookingsForThisSlot >= this.maxAttendees;
    });
    if (allSlotsFull && this.status === 'Available') {
      this.status = 'Booked';
    }
  } else if (this.timeSlots && this.timeSlots.length === 1) {
    // For single time slot
    if (this.bookings.length >= this.maxAttendees && this.status === 'Available') {
      this.status = 'Booked';
    }
  } else {
    // For legacy single slot meetings
    if (this.bookings.length >= this.maxAttendees && this.status === 'Available') {
      this.status = 'Booked';
    }
  }
  next();
});

meetingSlotSchema.set('toJSON', { virtuals: true });
meetingSlotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MeetingSlot', meetingSlotSchema);
