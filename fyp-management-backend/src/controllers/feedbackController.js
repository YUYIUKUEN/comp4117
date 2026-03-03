const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const ActivityLog = require('../models/ActivityLog');
const GradingStandard = require('../models/GradingStandard');

/**
 * Add feedback to a submission
 * Only supervisor assigned to the student can add feedback
 */
const addFeedback = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const supervisorId = req.auth.userId;
    const { feedbackText, rating, isPrivate, grade, gradingStandard_id, internalNote } = req.body;

    // Validate feedback text
    if (!feedbackText || feedbackText.trim().length === 0) {
      return res.status(400).json({
        error: 'Feedback text required',
        code: 'FEEDBACK_TEXT_REQUIRED',
        status: 400,
      });
    }

    // Validate rating if provided (legacy)
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

    // Validate grade against grading standard if provided
    let gradingSystem = null;
    if (gradingStandard_id && grade) {
      const standard = await GradingStandard.findById(gradingStandard_id);
      if (!standard || !standard.enabled) {
        return res.status(400).json({
          error: 'Invalid or disabled grading standard',
          code: 'INVALID_GRADING_STANDARD',
          status: 400,
        });
      }
      gradingSystem = standard.gradingSystem;

      // Validate grade value matches the standard
      if (standard.gradingSystem === 'point-range') {
        const points = parseFloat(grade);
        if (isNaN(points) || points < standard.pointRange.min || points > standard.pointRange.max) {
          return res.status(400).json({
            error: `Grade must be between ${standard.pointRange.min} and ${standard.pointRange.max}`,
            code: 'INVALID_GRADE',
            status: 400,
          });
        }
      } else if (standard.gradingSystem === 'letter-grade') {
        if (!standard.letterGrades.includes(grade)) {
          return res.status(400).json({
            error: `Invalid letter grade. Must be one of: ${standard.letterGrades.join(', ')}`,
            code: 'INVALID_GRADE',
            status: 400,
          });
        }
      } else if (standard.gradingSystem === 'custom') {
        if (!standard.customOptions.includes(grade)) {
          return res.status(400).json({
            error: `Invalid grade option. Must be one of: ${standard.customOptions.join(', ')}`,
            code: 'INVALID_GRADE',
            status: 400,
          });
        }
      }
    }

    // Create feedback
    const feedback = await Feedback.create({
      submission_id: submissionId,
      supervisor_id: supervisorId,
      feedbackText: feedbackText.trim(),
      rating: rating || undefined,
      isPrivate: isPrivate === true,
      grade: grade || null,
      gradingSystem: gradingSystem,
      gradingStandard_id: gradingStandard_id || null,
      internalNote: internalNote ? internalNote.trim() : '',
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

    // Query feedback (removed sort to avoid Cosmos DB index issues)
    const feedbackDocs = await Feedback.find(filter)
      .populate('supervisor_id', 'fullName email')
      .populate('replies.user_id', 'fullName email role');

    // Strip internalNote from student responses — they should never see it
    const feedback = feedbackDocs.map(fb => {
      const obj = fb.toObject();
      if (userRole === 'Student') {
        delete obj.internalNote;
      }
      return obj;
    });

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

    if (req.body.internalNote !== undefined) {
      feedback.internalNote = req.body.internalNote.trim();
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

/**
 * Get recent feedback for the current student across all their submissions
 * GET /feedback/student/recent
 */
const getStudentRecentFeedback = async (req, res, next) => {
  try {
    const studentId = req.auth.userId;
    const limit = parseInt(req.query.limit) || 5;

    // Find student's submissions
    const submissions = await Submission.find({ student_id: studentId });
    const submissionIds = submissions.map(s => s._id);

    if (submissionIds.length === 0) {
      return res.json({ data: [], status: 200 });
    }

    // Get recent public feedback across all submissions
    const feedback = await Feedback.find({
      submission_id: { $in: submissionIds },
      isPrivate: false,
    })
      .populate('supervisor_id', 'fullName email')
      .populate('submission_id', 'phase')
      .populate('replies.user_id', 'fullName email role')
      .sort({ _id: -1 })
      .limit(limit);

    res.json({
      data: feedback,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a reply to a feedback item
 * Students can reply to feedback on their own submissions
 * Supervisors can reply to feedback they gave
 */
const replyToFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.auth.userId;
    const { replyText } = req.body;

    if (!replyText || replyText.trim().length === 0) {
      return res.status(400).json({
        error: 'Reply text is required',
        code: 'REPLY_TEXT_REQUIRED',
        status: 400,
      });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        error: 'Feedback not found',
        code: 'FEEDBACK_NOT_FOUND',
        status: 404,
      });
    }

    // Verify the user is either the student who owns the submission or the supervisor who gave feedback
    const submission = await Submission.findById(feedback.submission_id);
    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND',
        status: 404,
      });
    }

    const isStudent = submission.student_id.toString() === userId;
    const isSupervisor = feedback.supervisor_id.toString() === userId;

    if (!isStudent && !isSupervisor) {
      return res.status(403).json({
        error: 'You can only reply to feedback on your own submissions',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    feedback.replies.push({
      user_id: userId,
      replyText: replyText.trim(),
    });
    feedback.updatedAt = new Date();
    await feedback.save();

    // Populate the new reply's user_id before returning
    await feedback.populate('replies.user_id', 'fullName email role');

    const newReply = feedback.replies[feedback.replies.length - 1];

    // Log activity for the reply
    await ActivityLog.create({
      user_id: userId,
      action: 'feedback_reply_added',
      entityType: 'Feedback',
      entityId: feedback._id,
      details: {
        submission_id: feedback.submission_id,
        isStudentReply: isStudent,
      },
    });

    res.status(201).json({
      data: newReply,
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all internal notes across feedback — admin only
 * GET /feedback/admin/internal-notes
 */
const getAdminInternalNotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { internalNote: { $exists: true, $ne: '' } };

    const [notes, total] = await Promise.all([
      Feedback.find(filter)
        .populate('supervisor_id', 'fullName email')
        .populate('submission_id', 'phase')
        .populate({
          path: 'submission_id',
          populate: [
            { path: 'student_id', select: 'fullName email' },
            { path: 'topic_id', select: 'title' },
          ],
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      data: notes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a reply to feedback
 * Only the user who made the reply can delete it
 * DELETE /feedback/:feedbackId/replies/:replyId
 */
const deleteReply = async (req, res, next) => {
  try {
    const { feedbackId, replyId } = req.params;
    const userId = req.auth.userId;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        error: 'Feedback not found',
        code: 'FEEDBACK_NOT_FOUND',
        status: 404,
      });
    }

    // Find the reply
    const replyIndex = feedback.replies.findIndex(r => r._id.toString() === replyId);
    if (replyIndex === -1) {
      return res.status(404).json({
        error: 'Reply not found',
        code: 'REPLY_NOT_FOUND',
        status: 404,
      });
    }

    // Verify ownership - only the reply author can delete
    if (feedback.replies[replyIndex].user_id.toString() !== userId) {
      return res.status(403).json({
        error: 'You can only delete your own replies',
        code: 'NOT_OWNER',
        status: 403,
      });
    }

    // Remove the reply
    feedback.replies.splice(replyIndex, 1);
    feedback.updatedAt = new Date();
    await feedback.save();

    res.json({
      data: { success: true },
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
  getStudentRecentFeedback,
  replyToFeedback,
  deleteReply,
  getAdminInternalNotes,
};
