const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const ActivityLog = require('../models/ActivityLog');
const { validateFile } = require('../utils/fileUpload');
const { saveFile, deleteFile, getFile } = require('../config/storage');
const fs = require('fs');

const calculateDueDate = (phase) => {
  const now = new Date();
  const dueDates = {
    'Initial Statement': new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    'Progress Report 1': new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    'Progress Report 2': new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
    'Final Dissertation': new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
  };
  return dueDates[phase] || now;
};

const submitDocument = async (req, res, next) => {
  try {
    const { phase } = req.params;
    const studentId = req.auth.userId;

    if (!req.file) {
      return res.status(400).json({
        error: 'File required',
        code: 'NO_FILE',
        status: 400,
      });
    }

    // Validate file
    const validation = validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.errors.join('; '),
        code: 'INVALID_FILE',
        status: 400,
      });
    }

    // Find active assignment
    const assignment = await Assignment.findOne({
      student_id: studentId,
      status: 'Active',
    });

    if (!assignment) {
      return res.status(400).json({
        error: 'No active assignment found',
        code: 'NO_ASSIGNMENT',
        status: 400,
      });
    }

    // Find or create submission
    let submission = await Submission.findOne({
      student_id: studentId,
      phase,
      topic_id: assignment.topic_id,
    });

    if (!submission) {
      const dueDate = calculateDueDate(phase);
      submission = await Submission.create({
        student_id: studentId,
        topic_id: assignment.topic_id,
        phase,
        dueDate,
      });
    }

    // Save file
    const { filename, filepath } = saveFile(req.file, studentId, phase);

    // Add file to submission
    submission.files.push({
      filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/api/v1/submissions/${phase}/files/${filename}`,
    });

    submission.status = 'Submitted';
    submission.submittedAt = new Date();
    submission.updatedAt = new Date();
    await submission.save();

    await ActivityLog.create({
      user_id: studentId,
      action: 'document_submitted',
      entityType: 'Submission',
      entityId: submission._id,
      details: { phase, filename: req.file.originalname },
    });

    res.status(201).json({
      data: submission,
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

const getSubmission = async (req, res, next) => {
  try {
    const { phase } = req.params;
    const studentId = req.auth.userId;

    const submission = await Submission.findOne({
      student_id: studentId,
      phase,
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    res.json({
      data: submission,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { phase, filename } = req.params;
    const studentId = req.auth.userId;

    const submission = await Submission.findOne({
      student_id: studentId,
      phase,
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    const file = submission.files.find(f => f.filename === filename);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
        status: 404,
      });
    }

    const filepath = getFile(studentId, phase, filename);
    res.download(filepath, file.originalName);
  } catch (error) {
    next(error);
  }
};

const declareNotNeeded = async (req, res, next) => {
  try {
    const { phase } = req.params;
    const { reason } = req.body;
    const studentId = req.auth.userId;

    if (!reason) {
      return res.status(400).json({
        error: 'Declaration reason required',
        code: 'INVALID_INPUT',
        status: 400,
      });
    }

    const assignment = await Assignment.findOne({
      student_id: studentId,
      status: 'Active',
    });

    if (!assignment) {
      return res.status(400).json({
        error: 'No active assignment found',
        code: 'NO_ASSIGNMENT',
        status: 400,
      });
    }

    let submission = await Submission.findOne({
      student_id: studentId,
      phase,
      topic_id: assignment.topic_id,
    });

    if (!submission) {
      const dueDate = calculateDueDate(phase);
      submission = await Submission.create({
        student_id: studentId,
        topic_id: assignment.topic_id,
        phase,
        dueDate,
      });
    }

    submission.status = 'Declared Not Needed';
    submission.declarationReason = reason;
    submission.declaredAt = new Date();
    await submission.save();

    await ActivityLog.create({
      user_id: studentId,
      action: 'submission_declared_not_needed',
      entityType: 'Submission',
      entityId: submission._id,
      details: { phase, reason },
    });

    res.json({
      data: submission,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const getSupervisorSubmissions = async (req, res, next) => {
  try {
    const supervisorId = req.auth.userId;
    const { phase, status } = req.query;

    // Find all assignments where supervisor is assigned
    const assignments = await Assignment.find({
      supervisor_id: supervisorId,
      status: 'Active',
    });

    const topicIds = assignments.map(a => a.topic_id);

    const filter = { topic_id: { $in: topicIds } };
    if (phase) {
      filter.phase = phase;
    }
    if (status) {
      filter.status = status;
    }

    const submissions = await Submission.find(filter)
      .populate('student_id', 'fullName email')
      .populate('topic_id', 'title')
      .sort({ submittedAt: -1 });

    res.json({
      data: submissions,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const getSupervisorStudentSubmission = async (req, res, next) => {
  try {
    const supervisorId = req.auth.userId;
    const { studentId, phase } = req.params;

    // Verify supervisor has access to student's work
    const assignment = await Assignment.findOne({
      student_id: studentId,
      supervisor_id: supervisorId,
      status: 'Active',
    });

    if (!assignment) {
      return res.status(403).json({
        error: 'Not authorized to view this submission',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const submission = await Submission.findOne({
      student_id: studentId,
      phase,
      topic_id: assignment.topic_id,
    })
      .populate('student_id', 'fullName email')
      .populate('topic_id', 'title');

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    res.json({
      data: submission,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

const downloadSupervisorFile = async (req, res, next) => {
  try {
    const supervisorId = req.auth.userId;
    const { studentId, phase, filename } = req.params;

    // Verify supervisor has access
    const assignment = await Assignment.findOne({
      student_id: studentId,
      supervisor_id: supervisorId,
      status: 'Active',
    });

    if (!assignment) {
      return res.status(403).json({
        error: 'Not authorized to view this file',
        code: 'FORBIDDEN',
        status: 403,
      });
    }

    const submission = await Submission.findOne({
      student_id: studentId,
      phase,
      topic_id: assignment.topic_id,
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    const file = submission.files.find(f => f.filename === filename);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
        status: 404,
      });
    }

    const filepath = getFile(studentId, phase, filename);
    res.download(filepath, file.originalName);

    await ActivityLog.create({
      user_id: supervisorId,
      action: 'submission_file_viewed',
      entityType: 'Submission',
      entityId: submission._id,
      details: { phase, filename: file.originalName, studentId },
    });
  } catch (error) {
    next(error);
  }
};

const getSubmissionStatistics = async (req, res, next) => {
  try {
    const supervisorId = req.auth.userId;

    // Find all assignments for this supervisor
    const assignments = await Assignment.find({
      supervisor_id: supervisorId,
      status: 'Active',
    });

    const topicIds = assignments.map(a => a.topic_id);

    const result = await Submission.aggregate([
      { $match: { topic_id: { $in: topicIds } } },
      {
        $group: {
          _id: '$phase',
          total: { $sum: 1 },
          submitted: { $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] } },
          notSubmitted: { $sum: { $cond: [{ $eq: ['$status', 'Not Submitted'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
          declaredNotNeeded: { $sum: { $cond: [{ $eq: ['$status', 'Declared Not Needed'] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      data: result,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitDocument,
  getSubmission,
  downloadFile,
  declareNotNeeded,
  getSupervisorSubmissions,
  getSupervisorStudentSubmission,
  downloadSupervisorFile,
  getSubmissionStatistics,
};
