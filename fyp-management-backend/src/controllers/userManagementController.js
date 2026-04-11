const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

/**
 * Get all users with filtering and pagination
 * Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    // Role check is handled by requireRole('Admin') middleware on the route
    const { role, status = 'active', limit = 50, page = 1 } = req.query;

    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (status === 'active') {
      filter.deactivatedAt = null;
    } else if (status === 'deactivated') {
      filter.deactivatedAt = { $ne: null };
    }

    const skipAmount = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-passwordHash')
      .skip(skipAmount)
      .limit(parseInt(limit))
      .sort({ _id: -1 });

    // For students, fetch their assignments to populate supervisor and topic info
    const Assignment = require('../models/Assignment');
    const Topic = require('../models/Topic');
    
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        
        if (user.role === 'Student') {
          // Find active assignment for this student
          const assignment = await Assignment.findOne({
            student_id: user._id,
            status: 'Active',
          }).populate('supervisor_id', 'fullName email').populate('topic_id', 'title pathway');
          
          if (assignment) {
            userObj.supervisor = assignment.supervisor_id;
            userObj.topicTitle = assignment.topic_id?.title;
            userObj.topicPathway = assignment.topic_id?.pathway;
          }
        }
        
        return userObj;
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      data: {
        users: enrichedUsers,
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

/**
 * Get a specific user by ID
 * Admin only
 */
const getUserById = async (req, res, next) => {
  try {
    // Role check is handled by requireRole('Admin') middleware on the route
    const user = await User.findById(req.params.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    res.json({
      data: user,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a user
 * Admin only - Cannot deactivate self
 */
const deactivateUser = async (req, res, next) => {
  try {
    // Role check is handled by requireRole('Admin') middleware on the route
    const { userId } = req.params;
    const { reason } = req.body;

    // Prevent self-deactivation
    if (userId === req.auth.userId) {
      return res.status(400).json({
        error: 'Cannot deactivate yourself',
        code: 'INVALID_OPERATION',
        status: 400,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Skip if already deactivated
    if (user.deactivatedAt) {
      return res.status(400).json({
        error: 'User is already deactivated',
        code: 'INVALID_OPERATION',
        status: 400,
      });
    }

    user.deactivatedAt = new Date();
    await user.save();

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'user_deactivated',
      entityType: 'User',
      entityId: userId,
      details: { reason: reason || 'No reason provided' },
    });

    res.json({
      data: user,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate a user
 * Admin only
 */
const reactivateUser = async (req, res, next) => {
  try {
    // Role check is handled by requireRole('Admin') middleware on the route
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Skip if already active
    if (!user.deactivatedAt) {
      return res.status(400).json({
        error: 'User is already active',
        code: 'INVALID_OPERATION',
        status: 400,
      });
    }

    user.deactivatedAt = null;
    await user.save();

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'user_reactivated',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { reason: 'User reactivated by admin' },
    });

    res.json({
      data: user,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user
 * Admin only
 */
const createUser = async (req, res, next) => {
  try {
    // Role check is handled by requireRole('Admin') middleware on the route
    const { email, fullName, role, concentration, phone, password, cohort } = req.body;

    // Validate required fields
    if (!email || !fullName || !role) {
      return res.status(400).json({
        error: 'Email, fullName, and role are required',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // Validate role
    if (!['Student', 'Supervisor', 'Admin'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be Student, Supervisor, or Admin',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // Check if an active user already exists with this email
    const existingActive = await User.findOne({ email: email.toLowerCase(), deactivatedAt: null });
    if (existingActive) {
      return res.status(409).json({
        error: 'A user with this email already exists',
        code: 'DUPLICATE_EMAIL',
        status: 409,
      });
    }

    const bcrypt = require('bcryptjs');
    const defaultPassword = password || 'changeme123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Check if a deactivated user exists with this email — reactivate & update instead of creating
    const deactivatedUser = await User.findOne({ email: email.toLowerCase(), deactivatedAt: { $ne: null } });

    let user;
    if (deactivatedUser) {
      deactivatedUser.fullName = fullName;
      deactivatedUser.role = role;
      deactivatedUser.passwordHash = passwordHash;
      deactivatedUser.concentration = concentration || undefined;
      deactivatedUser.phone = phone || undefined;
      deactivatedUser.cohort = cohort || null;
      deactivatedUser.deactivatedAt = null;
      deactivatedUser.updatedAt = new Date();
      await deactivatedUser.save();
      user = deactivatedUser;
    } else {
      user = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role,
        concentration: concentration || undefined,
        phone: phone || undefined,
        cohort: cohort || null,
      });
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'user_created',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { role, email },
    });

    // Return user without passwordHash
    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.status(201).json({
      data: userObj,
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user's profile
 * Admin only
 */
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, email, concentration, phone, role, pathway, cohort } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // If email is changing, check for duplicates (exclude deactivated users)
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId }, deactivatedAt: null });
      if (existing) {
        return res.status(409).json({
          error: 'A user with this email already exists',
          code: 'DUPLICATE_EMAIL',
          status: 409,
        });
      }
      // Remove any deactivated user holding this email so the unique index doesn't block
      await User.deleteOne({ email: email.toLowerCase(), _id: { $ne: userId }, deactivatedAt: { $ne: null } });
      user.email = email.toLowerCase();
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (concentration !== undefined) user.concentration = concentration || null;
    if (phone !== undefined) user.phone = phone;
    if (pathway !== undefined) user.pathway = pathway || null;
    if (cohort !== undefined) user.cohort = cohort || null;
    if (role && ['Student', 'Supervisor', 'Admin'].includes(role)) {
      user.role = role;
    }
    user.updatedAt = new Date();
    await user.save();

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'user_updated',
      entityType: 'User',
      entityId: userId,
      details: { fullName, email, concentration, phone, role, pathway, cohort },
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;

    res.json({
      data: userObj,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import users from an uploaded Excel/CSV file
 * Admin only
 * POST /admin/users/import
 * Expected columns: email, fullName, role, concentration (optional), phone (optional)
 */
const importUsersFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please upload an .xlsx or .csv file.',
        code: 'NO_FILE',
        status: 400,
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({
        error: 'The uploaded file contains no sheets.',
        code: 'EMPTY_FILE',
        status: 400,
      });
    }

    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (!rawRows.length) {
      return res.status(400).json({
        error: 'The uploaded file contains no data rows.',
        code: 'EMPTY_FILE',
        status: 400,
      });
    }

    // Normalise header names (case-insensitive, trimmed)
    const normalise = (key) => key.toString().trim().toLowerCase().replace(/[\s_-]+/g, '');
    const headerMap = {};
    Object.keys(rawRows[0]).forEach(k => { headerMap[normalise(k)] = k; });

    const col = (row, ...names) => {
      for (const n of names) {
        const original = headerMap[normalise(n)];
        if (original && row[original] !== undefined && String(row[original]).trim()) {
          return String(row[original]).trim();
        }
      }
      return '';
    };

    const defaultHash = await bcrypt.hash('changeme123', 10);
    const results = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2; // Excel row (1-indexed header + data)

      const email = col(row, 'email', 'e-mail', 'emailaddress');
      const fullName = col(row, 'fullName', 'full name', 'name', 'student', 'studentname');
      const role = col(row, 'role') || 'Student';
      const concentration = col(row, 'concentration', 'programme', 'program', 'major');
      const phone = col(row, 'phone', 'telephone', 'phonenumber');
      const cohort = col(row, 'cohort', 'cohort name', 'year');

      if (!email || !fullName) {
        results.errors.push({ row: rowNum, reason: 'Missing email or fullName' });
        results.skipped++;
        continue;
      }

      if (!['Student', 'Supervisor', 'Admin'].includes(role)) {
        results.errors.push({ row: rowNum, reason: `Invalid role "${role}"` });
        results.skipped++;
        continue;
      }

      // Skip if an active user with this email already exists
      const existing = await User.findOne({ email: email.toLowerCase(), deactivatedAt: null });
      if (existing) {
        results.errors.push({ row: rowNum, reason: `Email "${email}" already exists` });
        results.skipped++;
        continue;
      }

      // Reactivate deactivated user or create new
      const deactivated = await User.findOne({ email: email.toLowerCase(), deactivatedAt: { $ne: null } });
      if (deactivated) {
        deactivated.fullName = fullName;
        deactivated.role = role;
        deactivated.passwordHash = defaultHash;
        deactivated.concentration = concentration || undefined;
        deactivated.phone = phone || undefined;
        deactivated.cohort = cohort || undefined;
        deactivated.deactivatedAt = null;
        deactivated.updatedAt = new Date();
        await deactivated.save();
      } else {
        await User.create({
          email: email.toLowerCase(),
          passwordHash: defaultHash,
          fullName,
          role,
          concentration: concentration || undefined,
          phone: phone || undefined,
          cohort: cohort || undefined,
        });
      }
      results.created++;
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'users_imported',
      entityType: 'User',
      entityId: 'bulk',
      details: { created: results.created, skipped: results.skipped, totalRows: rawRows.length },
    });

    res.status(200).json({
      data: results,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign selected students to a supervisor
 * Admin only
 * POST /admin/users/bulk-assign-supervisor
 */
const assignStudentsToSupervisor = async (req, res, next) => {
  try {
    const { studentIds, supervisorName } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        error: 'studentIds must be a non-empty array',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    if (!supervisorName || typeof supervisorName !== 'string') {
      return res.status(400).json({
        error: 'supervisorName is required',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // Find supervisor by name
    const supervisor = await User.findOne({
      fullName: supervisorName,
      role: 'Supervisor',
    });

    if (!supervisor) {
      return res.status(404).json({
        error: `Supervisor "${supervisorName}" not found`,
        code: 'SUPERVISOR_NOT_FOUND',
        status: 404,
      });
    }

    // Update assignments for each student
    const Assignment = require('../models/Assignment');
    const Topic = require('../models/Topic');
    let updated = 0;

    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (!student || student.role !== 'Student') {
        continue;
      }

      // Find student's active assignment with their topic
      const assignment = await Assignment.findOne({
        student_id: studentId,
        status: 'Active',
      }).populate('topic_id');

      if (assignment) {
        // Update supervisor in existing assignment
        assignment.supervisor_id = supervisor._id;
        await assignment.save();
        updated++;
      } else if (student.topicId) {
        // If no assignment but student has a topic, create one
        const topic = await Topic.findById(student.topicId);
        if (topic) {
          await Assignment.create({
            student_id: studentId,
            topic_id: topic._id,
            supervisor_id: supervisor._id,
            pathway: topic.pathway || 'Research-Based',
            status: 'Active',
          });
          updated++;
        }
      }
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'bulk_assign_supervisor',
      entityType: 'Assignment',
      entityId: 'bulk',
      details: { studentCount: studentIds.length, supervisorName, updated },
    });

    res.json({
      data: {
        message: `Assigned ${updated} student(s) to ${supervisor.fullName}`,
        updated,
        supervisorId: supervisor._id,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark selected students as ethics not required
 * Admin only
 * POST /admin/users/bulk-mark-ethics-not-required
 */
const markStudentsEthicsNotRequired = async (req, res, next) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        error: 'studentIds must be a non-empty array',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    const Submission = require('../models/Submission');
    let updated = 0;

    // Find ethics-related submission phases (typically "Ethics Clearance" or similar)
    const ethicsPhases = ['Ethics Clearance', 'Research Ethics Clearance', 'REC'];

    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (!student || student.role !== 'Student') {
        continue;
      }

      // Find active assignment to get the topic
      const Assignment = require('../models/Assignment');
      const assignment = await Assignment.findOne({
        student_id: studentId,
        status: 'Active',
      });

      if (assignment) {
        // Update or create submission records for ethics phases
        for (const phase of ethicsPhases) {
          const submission = await Submission.findOneAndUpdate(
            { student_id: studentId, topic_id: assignment.topic_id, phase },
            {
              status: 'Declared Not Needed',
              declaredAt: new Date(),
              declarationReason: 'Marked by admin - ethics not required for this project',
            },
            { upsert: true, new: true }
          );
          updated++;
        }
      }
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'bulk_mark_ethics_not_required',
      entityType: 'Submission',
      entityId: 'bulk',
      details: { studentCount: studentIds.length, updated },
    });

    res.json({
      data: {
        message: `Marked ${updated} ethics submissions as not required for ${studentIds.length} student(s)`,
        updated,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all submissions for a specific student
 * Admin only
 */
const getStudentSubmissions = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const Submission = require('../models/Submission');
    const User = require('../models/User');
    const GradingStandard = require('../models/GradingStandard');

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Get grading standards configured for this student's pathway
    const studentPathway = student.pathway || 'Research-Based';
    const gradingStandards = await GradingStandard.find({
      enabled: true,
      $or: [
        { pathways: { $in: [studentPathway] } },
        { pathways: { $size: 0 } }, // include those with no pathway restrictions
      ],
    }).select('submissionType');

    const allowedPhases = gradingStandards.map(gs => gs.submissionType);

    // Fetch all submissions for this student
    const allSubmissions = await Submission.find({ student_id: studentId })
      .populate('topic_id', 'title')
      .sort({ phase: 1 });

    // Filter to only show submissions matching grading standards
    const filteredSubmissions = allSubmissions.filter(sub =>
      allowedPhases.includes(sub.phase)
    );

    res.json({
      data: {
        studentId,
        studentName: student.fullName,
        pathway: studentPathway,
        allowedPhases,
        submissions: filteredSubmissions.map(sub => ({
          id: sub._id,
          phase: sub.phase,
          status: sub.status,
          submittedAt: sub.submittedAt,
          submittedDate: sub.submittedDate,
          dueDate: sub.dueDate,
          topic: sub.topic_id?.title,
          files: sub.files || [],
          declarationReason: sub.declarationReason,
        })),
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a submission file for a student (admin only)
 */
const downloadStudentSubmissionFile = async (req, res, next) => {
  try {
    const { studentId, phase, filename } = req.params;
    const { getFile } = require('../config/storage');
    const Submission = require('../models/Submission');
    const fs = require('fs');

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND',
        status: 404,
      });
    }

    // Get submission
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

    // Find the file in submission
    const file = submission.files.find(f => f.filename === filename);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
        status: 404,
      });
    }

    // Get file path
    let filepath;
    try {
      filepath = getFile(studentId, phase, filename);
    } catch (fileError) {
      console.error('File path error:', fileError);
      return res.status(404).json({
        error: 'File not found on server',
        code: 'FILE_NOT_FOUND',
        status: 404,
      });
    }

    // Verify file actually exists
    if (!fs.existsSync(filepath)) {
      console.error('File does not exist at:', filepath);
      return res.status(404).json({
        error: 'File not found on server',
        code: 'FILE_NOT_FOUND',
        status: 404,
      });
    }

    // Log activity first, then download
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'admin_download_submission_file',
      entityType: 'Submission',
      entityId: submission._id,
      details: { studentId, phase, filename },
    });

    // Send download (this should be the last operation)
    res.download(filepath, file.originalName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  importUsersFromExcel,
  assignStudentsToSupervisor,
  markStudentsEthicsNotRequired,
  getStudentSubmissions,
  downloadStudentSubmissionFile,
};
