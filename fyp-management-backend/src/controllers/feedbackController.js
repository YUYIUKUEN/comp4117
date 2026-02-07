const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const ActivityLog = require('../models/ActivityLog');

/**
 * Add feedback to a submission
 * Only supervisor assigned to the student can add feedback
 */
const addFeedback = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const supervisorId = req.auth.userId;
    const { feedbackText, rating, isPrivate } = req.body;

    // Validate feedback text
    if (!feedbackText || feedbackText.trim().length === 0) {
      return res.status(400).json({
        error: 'Feedback text required',
        code: 'FEEDBACK_TEXT_REQUIRED',
        status: 400,
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5',
        code: 'INVALID_RATING',
        status: 400,
      });
    }

    // Get submission
    const submission = await Submission.findById(submissionId).populate('topic_id');
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND',
        status: 404,
      });
    }

    // Verify supervisor is assigned to this submission's student
    const assignment = await Assignment.findOne({
      student_id: submission.student_id,
      supervisor_id: supervisorId,
      status: 'Active',
    });

    if (!assignment) {
      return res.status(403).json({
        error: 'You are not assigned to this student',
        code: 'NOT_ASSIGNED',
        status: 403,
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      submission_id: submissionId,
      supervisor_id: supervisorId,
      feedbackText: feedbackText.trim(),
      rating: rating || undefined,
      isPrivate: isPrivate === true,
    });

    // Log activity
    await ActivityLog.create({
      user_id: supervisorId,
      action: 'feedback_added',
      entityType: 'Feedback',
      entityId: feedback._id,
      details: {
        submission_id: submissionId,
        isPrivate: isPrivate === true,
        hasRating: rating !== undefined,
      },
    });

    res.status(201).json({
      data: feedback,
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback for a submission
 * Students can only see public feedback
 * Supervisors can see all feedback
 */
const getFeedback = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const userId = req.auth.userId;
    const userRole = req.auth.role;

    // Get submission to verify it exists
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND',
        status: 404,
      });
    }

    // Build filter for feedback
    let filter = { submission_id: submissionId };

    // If student, only show public feedback
    if (userRole === 'Student') {
      // Verify student owns this submission
      if (submission.student_id.toString() !== userId) {
        return res.status(403).json({
          error: 'You do not have access to this submission',
          code: 'ACCESS_DENIED',
          status: 403,
        });
      }
      filter.isPrivate = false;
    }

    // If supervisor, verify they are assigned
    if (userRole === 'Supervisor') {
      const assignment = await Assignment.findOne({
        student_id: submission.student_id,
        supervisor_id: userId,
        status: 'Active',
      });

      if (!assignment) {
        return res.status(403).json({
          error: 'You are not assigned to this student',
          code: 'NOT_ASSIGNED',
          status: 403,
        });
      }
    }

    // Query feedback
    const feedback = await Feedback.find(filter)
      .populate('supervisor_id', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      data: {
        feedback,
        count: feedback.length,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update feedback
 * Only the creating supervisor can update
 */
const updateFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const { feedbackText, rating, isPrivate } = req.body;
    const supervisorId = req.auth.userId;

    // Get feedback
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        error: 'Feedback not found',
        code: 'FEEDBACK_NOT_FOUND',
        status: 404,
      });
    }

    // Verify ownership
    if (feedback.supervisor_id.toString() !== supervisorId) {
      return res.status(403).json({
        error: 'You can only update your own feedback',
        code: 'NOT_OWNER',
        status: 403,
      });
    }

    // Validate inputs
    if (feedbackText !== undefined) {
      if (feedbackText.trim().length === 0) {
        return res.status(400).json({
          error: 'Feedback text cannot be empty',
          code: 'FEEDBACK_TEXT_REQUIRED',
          status: 400,
        });
      }
      feedback.feedbackText = feedbackText.trim();
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'Rating must be between 1 and 5',
          code: 'INVALID_RATING',
          status: 400,
        });
      }
      feedback.rating = rating;
    }

    if (isPrivate !== undefined) {
      feedback.isPrivate = isPrivate === true;
    }

    feedback.updatedAt = new Date();
    await feedback.save();

    // Log activity
    await ActivityLog.create({
      user_id: supervisorId,
      action: 'feedback_updated',
      entityType: 'Feedback',
      entityId: feedback._id,
      details: {
        submission_id: feedback.submission_id,
      },
    });

    res.json({
      data: feedback,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete feedback
 * Only the creating supervisor can delete
 */
const deleteFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const supervisorId = req.auth.userId;

    // Get feedback
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        error: 'Feedback not found',
        code: 'FEEDBACK_NOT_FOUND',
        status: 404,
      });
    }

    // Verify ownership
    if (feedback.supervisor_id.toString() !== supervisorId) {
      return res.status(403).json({
        error: 'You can only delete your own feedback',
        code: 'NOT_OWNER',
        status: 403,
      });
    }

    const submissionId = feedback.submission_id;
    await Feedback.findByIdAndDelete(feedbackId);

    // Log activity
    await ActivityLog.create({
      user_id: supervisorId,
      action: 'feedback_deleted',
      entityType: 'Feedback',
      entityId: feedbackId,
      details: {
        submission_id: submissionId,
      },
    });

    res.json({
      data: { message: 'Feedback deleted' },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback statistics
 * Only non-private feedback is included in stats
 */
const getFeedbackStats = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    // Verify submission exists
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND',
        status: 404,
      });
    }

    // Aggregate feedback statistics (non-private only)
    const stats = await Feedback.aggregate([
      {
        $match: {
          submission_id: new mongoose.Types.ObjectId(submissionId),
          isPrivate: false,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' },
        },
      },
    ]);

    const result = stats[0] || {
      count: 0,
      avgRating: null,
      minRating: null,
      maxRating: null,
    };

    res.json({
      data: result,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
};
