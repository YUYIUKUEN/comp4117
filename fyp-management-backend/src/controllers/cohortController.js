const Cohort = require('../models/Cohort');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get all cohorts
 * Admin only
 */
const getAllCohorts = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const skipAmount = (page - 1) * limit;

    const cohorts = await Cohort.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ _id: -1 })
      .skip(skipAmount)
      .limit(parseInt(limit));

    const total = await Cohort.countDocuments(filter);

    // Get student count for each cohort
    const cohortsWithCount = await Promise.all(
      cohorts.map(async (cohort) => {
        const userCount = await User.countDocuments({
          role: 'Student',
          cohort: cohort.name,
        });

        return {
          ...cohort.toObject(),
          totalStudents: userCount,
        };
      })
    );

    res.json({
      data: {
        cohorts: cohortsWithCount,
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
 * Get a specific cohort by ID
 * Admin only
 */
const getCohortById = async (req, res, next) => {
  try {
    const cohort = await Cohort.findById(req.params.cohortId).populate('createdBy', 'fullName email');

    if (!cohort) {
      return res.status(404).json({
        error: 'Cohort not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Get student count
    const totalStudents = await User.countDocuments({
      role: 'Student',
      cohort: cohort.name,
    });

    res.json({
      data: {
        ...cohort.toObject(),
        totalStudents,
      },
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new cohort
 * Admin only
 */
const createCohort = async (req, res, next) => {
  try {
    const { name, academicYear, startDate, endDate, description, status } = req.body;

    // Validate required fields
    if (!name || !academicYear) {
      return res.status(400).json({
        error: 'name and academicYear are required',
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    }

    // Check for duplicate name
    const existing = await Cohort.findOne({ name });
    if (existing) {
      return res.status(409).json({
        error: 'Cohort with this name already exists',
        code: 'DUPLICATE_NAME',
        status: 409,
      });
    }

    // Calculate startDate and endDate from academicYear if not provided
    let computedStartDate = startDate ? new Date(startDate) : undefined;
    let computedEndDate = endDate ? new Date(endDate) : undefined;

    if (!computedStartDate) {
      // Parse academic year (e.g. "2024/2025" or "2024-2025")
      const yearMatch = academicYear.match(/(\d{4})/);
      if (yearMatch) {
        const startYear = parseInt(yearMatch[1]);
        // Academic year starts Sept 1
        computedStartDate = new Date(startYear, 8, 1); // Month is 0-indexed, so 8 = September
      } else {
        computedStartDate = new Date();
      }
    }

    if (!computedEndDate) {
      const yearMatch = academicYear.match(/(\d{4})[/-](\d{4})/);
      if (yearMatch) {
        const endYear = parseInt(yearMatch[2]);
        // Academic year ends Aug 31
        computedEndDate = new Date(endYear, 7, 31); // Month 7 = August
      }
    }

    const cohort = await Cohort.create({
      name,
      academicYear,
      startDate: computedStartDate,
      endDate: computedEndDate,
      description: description || undefined,
      status: status || 'Active',
      createdBy: req.auth.userId,
    });

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'cohort_created',
      entityType: 'Cohort',
      entityId: cohort._id.toString(),
      details: { name, academicYear },
    });

    const populatedCohort = await cohort.populate('createdBy', 'fullName email');

    // Auto-assign students created within this cohort's date range
    const studentFilter = {
      role: 'Student',
      createdAt: {
        $gte: cohort.startDate,
        $lte: cohort.endDate || new Date(),
      },
    };
    const studentsToAssign = await User.find(studentFilter).select('_id');
    
    // Add students to this cohort in a hidden cohort_members field if desired
    if (studentsToAssign.length > 0) {
      await ActivityLog.create({
        user_id: req.auth.userId,
        action: 'cohort_auto_assigned_students',
        entityType: 'Cohort',
        entityId: cohort._id.toString(),
        details: { count: studentsToAssign.length, name: name, academicYear: academicYear },
      });
    }

    res.status(201).json({
      data: { ...populatedCohort.toObject(), autoAssignedCount: studentsToAssign.length },
      status: 201,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a cohort
 * Admin only
 */
const updateCohort = async (req, res, next) => {
  try {
    const { name, academicYear, startDate, endDate, description, status } = req.body;

    const cohort = await Cohort.findById(req.params.cohortId);
    if (!cohort) {
      return res.status(404).json({
        error: 'Cohort not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Check for duplicate name if changing
    if (name && name !== cohort.name) {
      const existing = await Cohort.findOne({ name });
      if (existing) {
        return res.status(409).json({
          error: 'Cohort with this name already exists',
          code: 'DUPLICATE_NAME',
          status: 409,
        });
      }
      cohort.name = name;
    }

    if (academicYear) {
      cohort.academicYear = academicYear;
      // Recalculate dates from new academic year if dates not explicitly provided
      if (!startDate && !endDate) {
        const yearMatch = academicYear.match(/(\d{4})/);
        if (yearMatch) {
          const startYear = parseInt(yearMatch[1]);
          cohort.startDate = new Date(startYear, 8, 1); // September 1
        }
        const yearMatch2 = academicYear.match(/(\d{4})[/-](\d{4})/);
        if (yearMatch2) {
          const endYear = parseInt(yearMatch2[2]);
          cohort.endDate = new Date(endYear, 7, 31); // August 31
        }
      }
    }
    if (startDate) cohort.startDate = new Date(startDate);
    if (endDate) cohort.endDate = new Date(endDate);
    if (description !== undefined) cohort.description = description;
    if (status && ['Active', 'Archived', 'Planning'].includes(status)) {
      cohort.status = status;
    }
    cohort.updatedAt = new Date();

    await cohort.save();

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'cohort_updated',
      entityType: 'Cohort',
      entityId: cohort._id.toString(),
      details: { name, academicYear, status },
    });

    const populatedCohort = await cohort.populate('createdBy', 'fullName email');

    res.json({
      data: populatedCohort,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a cohort (archive)
 * Admin only
 */
const deleteCohort = async (req, res, next) => {
  try {
    const cohort = await Cohort.findByIdAndUpdate(
      req.params.cohortId,
      { status: 'Archived', updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'fullName email');

    if (!cohort) {
      return res.status(404).json({
        error: 'Cohort not found',
        code: 'NOT_FOUND',
        status: 404,
      });
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.auth.userId,
      action: 'cohort_archived',
      entityType: 'Cohort',
      entityId: cohort._id.toString(),
      details: { name: cohort.name },
    });

    res.json({
      data: cohort,
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCohorts,
  getCohortById,
  createCohort,
  updateCohort,
  deleteCohort,
};
