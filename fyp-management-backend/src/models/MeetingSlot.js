const mongoose = require('mongoose');

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
    date: {
      type: Date,
      required: true,
    },
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
      default: 1,
      min: 1,
      max: 50,
    },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Completed', 'Cancelled'],
      default: 'Available',
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

// Pre-save: auto-update status when fully booked
meetingSlotSchema.pre('save', function (next) {
  if (this.bookings.length >= this.maxAttendees && this.status === 'Available') {
    this.status = 'Booked';
  }
  next();
});

meetingSlotSchema.set('toJSON', { virtuals: true });
meetingSlotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MeetingSlot', meetingSlotSchema);
