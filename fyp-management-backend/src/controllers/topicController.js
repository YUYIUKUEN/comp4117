const Topic = require('../models/Topic');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const createTopic = async (req, res, next) => {
  try {
    const { title, description, concentration, academicYear, keywords, referenceDocuments } = req.body;
    const supervisorId = req.auth.userId;

    // Verify user is supervisor
    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'Supervisor') {
      return res.status(403).json({
        error: 'Only supervisors can create topics',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Validation
    if (!title || !description || !concentration) {
      return res.status(400).json({
        error: 'Title, description, and concentration required',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    const topic = new Topic({
      title,
      description,
      supervisor_id: supervisorId,
      concentration,
      academicYear,
      keywords: keywords || [],
      referenceDocuments: referenceDocuments || [],
      status: 'Draft',
    });

    await topic.save();

    await ActivityLog.create({
      user_id: supervisorId,
      action: 'topic_created',
      entityType: 'Topic',
      entityId: topic._id,
      details: { title },
    });

    res.status(201).json({
      data: topic,
      status: 201,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: Object.values(error.errors)
          .map(e => e.message)
          .join(', '),
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }
    next(error);
  }
};

const getTopics = async (req, res, next) => {
  try {
    const {
      status = 'Active',
      concentration,
      academicYear,
      keyword,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { status };

    if (concentration) {
      filter.concentration = concentration;
    }

    if (academicYear) {
      filter.academicYear = parseInt(academicYear);
    }

    if (search) {
      // Full-text search
      filter.$text = { $search: search };
    }

    if (keyword && !search) {
      // Keyword filter (exact match)
      filter.keywords = keyword;
    }

    const skipAmount = (page - 1) * limit;

    const topics = await Topic.find(filter)
      .populate('supervisor_id', 'fullName email')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skipAmount)
      .limit(parseInt(limit));

    const total = await Topic.countDocuments(filter);

    res.json({
      data: {
        topics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const getTopicById = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const topic = await Topic.findById(topicId).populate(
      'supervisor_id',
      'fullName email phone officeHours'
    );

    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    res.json({
      data: topic,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const supervisorId = req.auth.userId;
    const updates = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Verify ownership
    if (topic.supervisor_id.toString() !== supervisorId) {
      return res.status(403).json({
        error: 'Can only edit own topics',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Only allow updates if Draft
    if (topic.status !== 'Draft') {
      return res.status(400).json({
        error: 'Can only edit draft topics',
        code: 'INVALID_STATE',
        status: 400,
      });
    }

    // Update allowed fields
    const allowedFields = ['title', 'description', 'concentration', 'academicYear', 'keywords', 'referenceDocuments'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        topic[field] = updates[field];
      }
    });

    topic.updatedAt = new Date();
    await topic.save();

    await ActivityLog.create({
      user_id: supervisorId,
      action: 'topic_updated',
      entityType: 'Topic',
      entityId: topic._id,
    });

    res.json({
      data: topic,
      status: 200,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: Object.values(error.errors)
          .map(e => e.message)
          .join(', '),
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }
    next(error);
  }
};

const publishTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const supervisorId = req.auth.userId;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Verify ownership
    if (topic.supervisor_id.toString() !== supervisorId) {
      return res.status(403).json({
        error: 'Can only publish own topics',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    // Only allow publishing if Draft
    if (topic.status !== 'Draft') {
      return res.status(400).json({
        error: 'Can only publish draft topics',
        code: 'INVALID_STATE',
        status: 400,
      });
    }

    topic.status = 'Active';
    topic.updatedAt = new Date();
    await topic.save();

    await ActivityLog.create({
      user_id: supervisorId,
      action: 'topic_published',
      entityType: 'Topic',
      entityId: topic._id,
      details: { title: topic.title },
    });

    res.json({
      data: topic,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const archiveTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const supervisorId = req.auth.userId;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Verify ownership
    if (topic.supervisor_id.toString() !== supervisorId) {
      return res.status(403).json({
        error: 'Can only archive own topics',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    topic.status = 'Archived';
    topic.archivedAt = new Date();
    topic.updatedAt = new Date();
    await topic.save();

    await ActivityLog.create({
      user_id: supervisorId,
      action: 'topic_archived',
      entityType: 'Topic',
      entityId: topic._id,
    });

    res.json({
      data: topic,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const adminId = req.auth.userId;

    const topic = await Topic.findByIdAndDelete(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    await ActivityLog.create({
      user_id: adminId,
      action: 'topic_deleted',
      entityType: 'Topic',
      entityId: topicId,
      details: { title: topic.title },
    });

    res.json({
      data: { message: 'Topic deleted successfully' },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const getMyTopics = async (req, res, next) => {
  try {
    const supervisorId = req.auth.userId;
    const { status } = req.query;

    const filter = { supervisor_id: supervisorId };
    if (status) {
      filter.status = status;
    }

    const topics = await Topic.find(filter).sort({ createdAt: -1 });

    res.json({
      data: {
        topics,
        count: topics.length,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTopic,
  getTopics,
  getTopicById,
  updateTopic,
  publishTopic,
  archiveTopic,
  deleteTopic,
  getMyTopics,
};
