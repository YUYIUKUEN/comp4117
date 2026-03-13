const GradingStandard = require('../models/GradingStandard');

/**
 * GET /grading-standards
 * Anyone authenticated can list (supervisors need to see them when grading)
 */
const getAllGradingStandards = async (req, res, next) => {
  try {
    const { enabledOnly } = req.query;
    const filter = {};
    if (enabledOnly === 'true') filter.enabled = true;

    const standards = await GradingStandard.find(filter);
    // Sort in JS to avoid Cosmos DB index issues
    standards.sort((a, b) => a.submissionType.localeCompare(b.submissionType));

    res.json({ data: standards, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /grading-standards/:id
 */
const getGradingStandardById = async (req, res, next) => {
  try {
    const standard = await GradingStandard.findById(req.params.id);
    if (!standard) {
      return res.status(404).json({ error: 'Grading standard not found', code: 'NOT_FOUND', status: 404 });
    }
    res.json({ data: standard, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /grading-standards  (Admin only)
 */
const createGradingStandard = async (req, res, next) => {
  try {
    const { submissionType, gradingSystem, pointRange, letterGrades, customOptions, description, dueDate, enabled, templateName, rubricItems, hkbuGradingScale, gradeRangeMapping } = req.body;

    if (!submissionType || !gradingSystem) {
      return res.status(400).json({ error: 'submissionType and gradingSystem are required', code: 'INVALID_REQUEST', status: 400 });
    }

    // Validate pointRange if using point-range system
    if (gradingSystem === 'point-range' && pointRange) {
      if (typeof pointRange.min !== 'number' || typeof pointRange.max !== 'number' || pointRange.min >= pointRange.max) {
        return res.status(400).json({ error: 'Invalid pointRange: min must be less than max', code: 'INVALID_POINT_RANGE', status: 400 });
      }
      // Ensure step is valid (default 0.5)
      if (!pointRange.step) {
        pointRange.step = 0.5;
      }
    }

    const standard = await GradingStandard.create({
      submissionType,
      gradingSystem,
      pointRange: gradingSystem === 'point-range' ? (pointRange || { min: 0, max: 100, step: 0.5 }) : undefined,
      letterGrades: gradingSystem === 'letter-grade' ? (letterGrades || ['A', 'B', 'C', 'D', 'F']) : undefined,
      customOptions: gradingSystem === 'custom' ? (customOptions || []) : undefined,
      hkbuGradingScale: hkbuGradingScale || null,
      gradeRangeMapping: gradeRangeMapping || null,
      templateName: templateName || null,
      rubricItems: rubricItems || [],
      description: description || '',
      dueDate: dueDate || null,
      enabled: enabled !== false,
      createdBy: req.auth.userId,
    });

    res.status(201).json({ data: standard, status: 201 });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /grading-standards/:id  (Admin only)
 */
const updateGradingStandard = async (req, res, next) => {
  try {
    const { submissionType, gradingSystem, pointRange, letterGrades, customOptions, description, dueDate, enabled, templateName, rubricItems, hkbuGradingScale, gradeRangeMapping } = req.body;

    const standard = await GradingStandard.findById(req.params.id);
    if (!standard) {
      return res.status(404).json({ error: 'Grading standard not found', code: 'NOT_FOUND', status: 404 });
    }

    // Validate pointRange if provided
    if (pointRange !== undefined) {
      if (typeof pointRange.min !== 'number' || typeof pointRange.max !== 'number' || pointRange.min >= pointRange.max) {
        return res.status(400).json({ error: 'Invalid pointRange: min must be less than max', code: 'INVALID_POINT_RANGE', status: 400 });
      }
      if (!pointRange.step) {
        pointRange.step = 0.5;
      }
      standard.pointRange = pointRange;
    }

    if (submissionType) standard.submissionType = submissionType;
    if (gradingSystem) standard.gradingSystem = gradingSystem;
    if (letterGrades !== undefined) standard.letterGrades = letterGrades;
    if (customOptions !== undefined) standard.customOptions = customOptions;
    if (description !== undefined) standard.description = description;
    if (dueDate !== undefined) standard.dueDate = dueDate;
    if (enabled !== undefined) standard.enabled = enabled;
    if (templateName !== undefined) standard.templateName = templateName;
    if (rubricItems !== undefined) {
      standard.rubricItems = rubricItems;
      standard.markModified('rubricItems'); // Mark nested array as modified so Mongoose saves it
    }
    if (hkbuGradingScale !== undefined) standard.hkbuGradingScale = hkbuGradingScale;
    if (gradeRangeMapping !== undefined) standard.gradeRangeMapping = gradeRangeMapping;
    
    standard.updatedAt = new Date();

    await standard.save();
    res.json({ data: standard, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /grading-standards/:id  (Admin only)
 */
const deleteGradingStandard = async (req, res, next) => {
  try {
    const standard = await GradingStandard.findById(req.params.id);
    if (!standard) {
      return res.status(404).json({ error: 'Grading standard not found', code: 'NOT_FOUND', status: 404 });
    }
    await GradingStandard.deleteOne({ _id: standard._id });
    res.json({ message: 'Grading standard deleted', status: 200 });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGradingStandards,
  getGradingStandardById,
  createGradingStandard,
  updateGradingStandard,
  deleteGradingStandard,
};
