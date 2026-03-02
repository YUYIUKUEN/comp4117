const TopicChangeRequest = require('../models/TopicChangeRequest');
const Assignment = require('../models/Assignment');
const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get pending topic change requests for a supervisor
 * GET /topic-change-requests/supervisor/pending
 */
const getSupervisorPendingRequests = async (req, res, next) => {
  try {
    const supervisorId = req.auth.userId;

    // Find all topics supervised by this user
    const topics = await Topic.find({ supervisor_id: supervisorId }).select('_id');
    const topicIds = topics.map(t => t._id);

    if (topicIds.length === 0) {
      return res.json({
        data: {
          requests: [],
          count: 0,
        },
        status: 200,
      });
    }

    // Find pending topic change requests for these topics
    const requests = await TopicChangeRequest.find({
      current_topic_id: { $in: topicIds },
      status: 'Pending',
    })
      .populate('student_id', 'fullName email')
      .populate('current_topic_id', 'title')
      .populate('proposed_topic_id', 'title')
      .sort({ createdAt: -1 });

    res.json({
      data: {
        requests,
        count: requests.length,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a topic change request (student)
 * POST /topic-change-requests
 */
const createTopicChangeRequest = async (req, res, next) => {
  try {
    const { current_topic_id, proposed_topic_id, proposed_topic_title, reason } = req.body;
    const studentId = req.auth.userId;

    // Validate required fields
    if (!current_topic_id || !reason) {
      return res.status(400).json({
        error: 'current_topic_id and reason are required',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    // Verify student is assigned to current topic
    const assignment = await Assignment.findOne({
      student_id: studentId,
      topic_id: current_topic_id,
      status: 'Active',
    });

    if (!assignment) {
      return res.status(403).json({
        error: 'You are not assigned to this topic',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Check if pending request already exists
    const existingRequest = await TopicChangeRequest.findOne({
      student_id: studentId,
      current_topic_id,
      status: 'Pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        error: 'You already have a pending topic change request for this topic',
        code: 'DUPLICATE_REQUEST',
        status: 400,
      });
    }

    const request = new TopicChangeRequest({
      student_id: studentId,
      current_topic_id,
      proposed_topic_id: proposed_topic_id || null,
      proposed_topic_title: proposed_topic_title || null,
      reason,
    });

    await request.save();

    // Log the action
    await ActivityLog.create({
      user_id: studentId,
      action: 'topic_change_requested',
      entityType: 'TopicChangeRequest',
      entityId: request._id,
      details: { reason },
    });

    res.status(201).json({
      data: request,
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a topic change request
 * POST /topic-change-requests/:requestId/approve
 */
const approveTopicChangeRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { supervisor_notes = '' } = req.body;
    const supervisorId = req.auth.userId;

    const request = await TopicChangeRequest.findById(requestId)
      .populate('current_topic_id')
      .populate('student_id');

    if (!request) {
      return res.status(404).json({
        error: 'Topic change request not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Verify supervisor owns the current topic
    const topic = await Topic.findById(request.current_topic_id._id);
    if (topic.supervisor_id.toString() !== supervisorId) {
      return res.status(403).json({
        error: 'You are not authorized to approve this request',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Update request status
    request.status = 'Approved';
    request.supervisor_notes = supervisor_notes;
    await request.save();

    // Log the action
    await ActivityLog.create({
      user_id: supervisorId,
      action: 'topic_change_approved',
      entityType: 'TopicChangeRequest',
      entityId: request._id,
      details: {
        studentId: request.student_id._id,
        topicId: request.current_topic_id._id,
      },
    });

    res.json({
      data: request,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a topic change request
 * POST /topic-change-requests/:requestId/reject
 */
const rejectTopicChangeRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { supervisor_notes = '' } = req.body;
    const supervisorId = req.auth.userId;

    const request = await TopicChangeRequest.findById(requestId)
      .populate('current_topic_id')
      .populate('student_id');

    if (!request) {
      return res.status(404).json({
        error: 'Topic change request not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Verify supervisor owns the current topic
    const topic = await Topic.findById(request.current_topic_id._id);
    if (topic.supervisor_id.toString() !== supervisorId) {
      return res.status(403).json({
        error: 'You are not authorized to reject this request',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Update request status
    request.status = 'Rejected';
    request.supervisor_notes = supervisor_notes;
    await request.save();

    // Log the action
    await ActivityLog.create({
      user_id: supervisorId,
      action: 'topic_change_rejected',
      entityType: 'TopicChangeRequest',
      entityId: request._id,
      details: {
        studentId: request.student_id._id,
        topicId: request.current_topic_id._id,
      },
    });

    res.json({
      data: request,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSupervisorPendingRequests,
  createTopicChangeRequest,
  approveTopicChangeRequest,
  rejectTopicChangeRequest,
};
