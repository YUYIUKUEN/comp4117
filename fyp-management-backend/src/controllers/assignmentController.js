const Assignment = require('../models/Assignment');
const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

/**
 * Get student's active assignment
 * GET /assignments/my-assignment
 */
exports.getMyAssignment = async (req, res) => {
  try {
    const student_id = req.user._id;

    const assignment = await Assignment.findOne({
      student_id,
      status: 'Active',
    }).populate(['topic_id', 'supervisor_id']);

    if (!assignment) {
      return res.status(404).json({
        code: 'NO_ACTIVE_ASSIGNMENT',
        message: 'You do not have an active assignment',
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error fetching student assignment:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Get supervisor's assignments (for their topics)
 * GET /assignments/supervisor/assignments
 */
exports.getSupervisorAssignments = async (req, res) => {
  try {
    const supervisor_id = req.user._id;
    const { page = 1, limit = 10, status = null } = req.query;

    // Find topics supervised by this user
    const topics = await Topic.find({ supervisor_id }).select('_id');
    const topicIds = topics.map(t => t._id);

    if (topicIds.length === 0) {
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

    // Get total count
    const total = await Assignment.countDocuments(query);

    // Fetch assignments with pagination
    const assignments = await Assignment.find(query)
      .populate(['student_id', 'topic_id'])
      .sort({ assigned_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching supervisor assignments:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Get assignment by ID
 * GET /assignments/:id
 */
exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: 'INVALID_ID',
        message: 'Invalid assignment ID',
      });
    }

    const assignment = await Assignment.findById(id).populate([
      'student_id',
      'topic_id',
      'supervisor_id',
    ]);

    if (!assignment) {
      return res.status(404).json({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};

/**
 * Complete assignment
 * POST /assignments/:id/complete
 */
exports.completeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const supervisor_id = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: 'INVALID_ID',
        message: 'Invalid assignment ID',
      });
    }

    const assignment = await Assignment.findById(id).populate('topic_id');

    if (!assignment) {
      return res.status(404).json({
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found',
      });
    }

    // Verify supervisor owns the topic
    if (!assignment.topic_id.supervisor_id.equals(supervisor_id)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only complete assignments for your own topics',
      });
    }

    // Can only complete Active assignments
    if (assignment.status !== 'Active') {
      return res.status(400).json({
        code: 'CANNOT_COMPLETE',
        message: 'Can only complete active assignments',
      });
    }

    // Update assignment status
    assignment.status = 'Completed';
    await assignment.save();

    // Log activity
    await ActivityLog.create({
      user_id: supervisor_id,
      action: 'COMPLETE_ASSIGNMENT',
      entity_type: 'Assignment',
      entity_id: id,
      changes: {
        status: 'Completed',
      },
    });

    // Return updated assignment
    await assignment.populate(['student_id', 'topic_id', 'supervisor_id']);

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error completing assignment:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }
};
