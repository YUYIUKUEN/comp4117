const Application = require('../models/Application');
const Topic = require('../models/Topic');
const Assignment = require('../models/Assignment');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

const MAX_APPLICATIONS_PER_STUDENT = 5;

/**
 * Apply to a topic
 * POST /applications/
 */
exports.applyToTopic = async (req, res) => {
  try {
    const { topic_id, preference_rank } = req.body;
    const student_id = req.user._id;

    // Validate required fields
    if (!topic_id || preference_rank === undefined) {
      return res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'topic_id and preference_rank are required',
      });
    }

    // Validate preference_rank
    if (!Number.isInteger(preference_rank) || preference_rank < 1 || preference_rank > 5) {
      return res.status(400).json({
        code: 'INVALID_PREFERENCE_RANK',
        message: 'preference_rank must be an integer between 1 and 5',
      });
    }

    // Check if student already has an approved/active assignment
    const existingAssignment = await Assignment.findOne({
      student_id,
      status: 'Active'
    });

    if (existingAssignment) {
      return res.status(400).json({
        code: 'ALREADY_ASSIGNED',
        message: 'You already have an active approved topic assignment',
      });
    }

    // Verify topic exists
    const topic = await Topic.findById(topic_id);
    if (!topic) {
      return res.status(404).json({
        code: 'TOPIC_NOT_FOUND',
        message: 'Topic not found',
      });
    }

    // Verify topic is active (can only apply to active topics)
    if (topic.status !== 'Active') {
      return res.status(400).json({
        code: 'TOPIC_NOT_ACTIVE',
        message: 'Can only apply to active topics',
      });
    }

    // Check if student already applied to this topic
    const existingApplication = await Application.findOne({
      student_id,
      topic_id,
    });

    if (existingApplication) {
      return res.status(400).json({
        code: 'DUPLICATE_APPLICATION',
        message: 'You have already applied to this topic',
      });
    }

    // Check application limit (max 5 per student)
    const applicationCount = await Application.countDocuments({
      student_id,
      status: 'Pending',
    });

    if (applicationCount >= MAX_APPLICATIONS_PER_STUDENT) {
      return res.status(400).json({
        code: 'APPLICATION_LIMIT_EXCEEDED',
        message: `You can have a maximum of ${MAX_APPLICATIONS_PER_STUDENT} pending applications`,
      });
    }

    // Create application
    const application = new Application({
      student_id,
      topic_id,
      preference_rank,
      status: 'Pending',
    });

    await application.save();

    // Log activity
    await ActivityLog.create({
      user_id: student_id,
      action: 'APPLY_TOPIC',
      entityType: 'Application',
      entityId: application._id,
      details: {
        status: 'Pending',
        preference_rank,
      },
    });

    // Populate and return
    await application.populate(['student_id', 'topic_id']);

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error applying to topic:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Get student's applications
 * GET /applications/my-applications
 */
exports.getMyApplications = async (req, res) => {
  try {
    const student_id = req.user._id;
    const { page = 1, limit = 10, status = null } = req.query;

    const query = { student_id };
    if (status) {
      query.status = status;
    }

    // Get total count
    const total = await Application.countDocuments(query);

    // Fetch applications with pagination
    const applications = await Application.find(query)
      .populate('student_id')
      .populate({
        path: 'topic_id',
        populate: { path: 'supervisor_id', select: 'fullName email' },
      })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Filter out applications from deactivated students
    const activeApplications = applications.filter(app => !app.student_id?.deactivatedAt);

    // Sort in JS to avoid Cosmos DB index issues
    activeApplications.sort((a, b) => (a.preference_rank || 99) - (b.preference_rank || 99));

    res.json({
      success: true,
      data: activeApplications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activeApplications.length,
        pages: Math.ceil(activeApplications.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Get applications for supervisor's topics
 * GET /applications/supervisor/applications
 */
exports.getSupervisorApplications = async (req, res) => {
  try {
    console.log('=== getSupervisorApplications Called ===');
    console.log('req.user:', req.user);
    console.log('req.auth:', req.auth);
    
    if (!req.user || !req.user._id) {
      console.error('ERROR: req.user not found');
      console.error('Available req properties:', Object.keys(req).filter(k => k !== 'app').slice(0, 10));
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const supervisor_id = req.user._id;
    const { page = 1, limit = 10, status = null } = req.query;
    
    console.log('supervisor_id:', supervisor_id);
    console.log('Finding topics for supervisor...');

    // Find topics supervised by this user
    const topics = await Topic.find({ supervisor_id }).select('_id');
    console.log('Topics found:', topics.length);
    
    const topicIds = topics.map(t => t._id);

    if (topicIds.length === 0) {
      console.log('No topics found for this supervisor');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
        },
      });
    }

    const query = { topic_id: { $in: topicIds } };
    if (status) {
      query.status = status;
    }

    // Fetch applications without sort (Cosmos DB compatibility)
    const applications = await Application.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    console.log('Raw applications found:', applications.length);

    // Manually fetch related data to avoid populate issues
    const User = require('../models/User');
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const student = await User.findById(app.student_id).lean();
        const topic = await Topic.findById(app.topic_id).lean();
        return {
          ...app,
          student_id: student,
          topic_id: topic,
        };
      })
    );

    // Filter out applications from deactivated students
    const activeApplications = enrichedApplications.filter(app => !app.student_id?.deactivatedAt);

    const total = activeApplications.length;
    console.log('Returning enriched applications (deactivated filtered):', activeApplications.length);
    
    res.json({
      success: true,
      data: activeApplications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching supervisor applications:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Get application by ID
 * GET /applications/:id
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: 'INVALID_ID',
        message: 'Invalid application ID',
      });
    }

    const application = await Application.findById(id).populate(['student_id', 'topic_id']);

    if (!application) {
      return res.status(404).json({
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Withdraw application (only for Pending status)
 * DELETE /applications/:id
 */
exports.withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: 'INVALID_ID',
        message: 'Invalid application ID',
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      });
    }

    // Verify ownership
    if (!application.student_id.equals(student_id)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only withdraw your own applications',
      });
    }

    // Can only withdraw Pending applications
    if (application.status !== 'Pending') {
      return res.status(400).json({
        code: 'CANNOT_WITHDRAW',
        message: 'Can only withdraw pending applications',
      });
    }

    // Delete application
    await Application.findByIdAndDelete(id);

    // Log activity
    await ActivityLog.create({
      user_id: student_id,
      action: 'WITHDRAW_APPLICATION',
      entityType: 'Application',
      entityId: id,
      details: {
        status: 'Withdrawn',
      },
    });

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Get application statistics
 * GET /applications/stats/overview
 */
exports.getApplicationStats = async (req, res) => {
  try {
    const supervisor_id = req.user._id;

    // Find topics supervised by this user
    const topics = await Topic.find({ supervisor_id }).select('_id');
    const topicIds = topics.map(t => t._id);

    if (topicIds.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      });
    }

    // Aggregate statistics
    const stats = await Application.aggregate([
      { $match: { topic_id: { $in: topicIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    stats.forEach(stat => {
      result.total += stat.count;
      if (stat._id === 'Pending') result.pending = stat.count;
      if (stat._id === 'Approved') result.approved = stat.count;
      if (stat._id === 'Rejected') result.rejected = stat.count;
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Get statistics for a specific topic
 * GET /applications/topic/:topicId/stats
 */
exports.getTopicApplicationStats = async (req, res) => {
  try {
    const { topicId } = req.params;
    const supervisor_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({
        code: 'INVALID_ID',
        message: 'Invalid topic ID',
      });
    }

    // Verify topic exists and belongs to supervisor
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        code: 'TOPIC_NOT_FOUND',
        message: 'Topic not found',
      });
    }

    if (!topic.supervisor_id.equals(supervisor_id)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only view statistics for your own topics',
      });
    }

    // Aggregate statistics for this topic
    const stats = await Application.aggregate([
      { $match: { topic_id: new mongoose.Types.ObjectId(topicId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      topicId,
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    stats.forEach(stat => {
      result.total += stat.count;
      if (stat._id === 'Pending') result.pending = stat.count;
      if (stat._id === 'Approved') result.approved = stat.count;
      if (stat._id === 'Rejected') result.rejected = stat.count;
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching topic application stats:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Approve application - creates Assignment and auto-rejects other pending
 * POST /applications/:applicationId/approve
 */
exports.approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supervisor_id = req.user._id;
    const { supervisorNotes = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        code: 'INVALID_ID',
        message: 'Invalid application ID',
      });
    }

    const application = await Application.findById(applicationId).populate('topic_id');

    if (!application) {
      return res.status(404).json({
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      });
    }

    // Verify supervisor owns the topic
    if (!application.topic_id.supervisor_id.equals(supervisor_id)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only approve applications for your own topics',
      });
    }

    // Can only approve Pending applications
    if (application.status !== 'Pending') {
      return res.status(400).json({
        code: 'CANNOT_APPROVE',
        message: 'Can only approve pending applications',
      });
    }

    // Check if student already has an active assignment
    const existingAssignment = await Assignment.findOne({
      student_id: application.student_id,
      status: 'Active',
    });

    if (existingAssignment) {
      return res.status(400).json({
        code: 'STUDENT_ALREADY_ASSIGNED',
        message: 'Student already has an active topic assignment',
      });
    }

    // Create assignment
    const assignment = new Assignment({
      student_id: application.student_id,
      topic_id: application.topic_id._id,
      supervisor_id,
      status: 'Active',
    });

    await assignment.save();

    // Update application status
    application.status = 'Approved';
    application.decidedAt = new Date();
    application.supervisorNotes = supervisorNotes;
    await application.save();

    // Auto-reject other pending applications from this student
    const otherApps = await Application.find({
      student_id: application.student_id,
      status: 'Pending',
      _id: { $ne: applicationId },
    });

    for (const otherApp of otherApps) {
      otherApp.status = 'Rejected';
      otherApp.decidedAt = new Date();
      otherApp.supervisorNotes = 'Student assigned to another topic';
      await otherApp.save();

      // Log individual rejections
      await ActivityLog.create({
        user_id: supervisor_id,
        action: 'REJECT_APPLICATION',
        entityType: 'Application',
        entityId: otherApp._id,
        details: {
          status: 'Rejected',
          reason: 'Student assigned to another topic',
        },
      });
    }

    // Log activity
    await ActivityLog.create({
      user_id: supervisor_id,
      action: 'APPROVE_APPLICATION',
      entityType: 'Application',
      entityId: applicationId,
      details: {
        status: 'Approved',
        assignment_id: assignment._id,
      },
    });

    // Return updated application with assignment info
    await application.populate(['student_id', 'topic_id']);

    res.json({
      success: true,
      data: {
        application,
        assignment: {
          _id: assignment._id,
          status: assignment.status,
          assigned_at: assignment.assigned_at,
        },
      },
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Reject application
 * POST /applications/:applicationId/reject
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supervisor_id = req.user._id;
    const { supervisorNotes = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        code: 'INVALID_ID',
        message: 'Invalid application ID',
      });
    }

    const application = await Application.findById(applicationId).populate('topic_id');

    if (!application) {
      return res.status(404).json({
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      });
    }

    // Verify supervisor owns the topic
    if (!application.topic_id.supervisor_id.equals(supervisor_id)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only reject applications for your own topics',
      });
    }

    // Can only reject Pending applications
    if (application.status !== 'Pending') {
      return res.status(400).json({
        code: 'CANNOT_REJECT',
        message: 'Can only reject pending applications',
      });
    }

    // Update application status
    application.status = 'Rejected';
    application.decidedAt = new Date();
    application.supervisorNotes = supervisorNotes;
    await application.save();

    // Log activity
    await ActivityLog.create({
      user_id: supervisor_id,
      action: 'REJECT_APPLICATION',
      entityType: 'Application',
      entityId: applicationId,
      details: {
        status: 'Rejected',
        reason: supervisorNotes,
      },
    });

    // Return updated application
    await application.populate(['student_id', 'topic_id']);

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};
