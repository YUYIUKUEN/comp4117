const GradingStandard = require('../models/GradingStandard');
const RubricTemplate = require('../models/RubricTemplate');

/**
 * Helper function to resolve rubric items from template
 * Gets the first available template (preferring Research-Based, then Solution-Based)
 */
const resolveRubricItemsFromTemplate = async (rubricTemplatesByPathway) => {
  if (!rubricTemplatesByPathway) return [];
  
  // Try Research-Based first, then Solution-Based
  const templateId = rubricTemplatesByPathway['Research-Based'] || rubricTemplatesByPathway['Solution-Based'];
  
  if (!templateId) return [];

  try {
    const template = await RubricTemplate.findById(templateId);
    return template?.rubricItems || [];
  } catch (error) {
    console.error('Failed to resolve rubric template:', error);
    return [];
  }
};

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
    const { submissionType, pointRange, description, dueDate, enabled, templateName, rubricItems, rubricTemplatesByPathway, pathways, enabledByPathway } = req.body;

    console.log('🔵 Backend received pointRange:', pointRange);
    console.log('🔵 Backend received all body:', req.body);

    if (!submissionType) {
      return res.status(400).json({ error: 'submissionType is required', code: 'INVALID_REQUEST', status: 400 });
    }

    // Validate pointRange
    if (pointRange) {
      if (typeof pointRange.min !== 'number' || typeof pointRange.max !== 'number' || pointRange.min >= pointRange.max) {
        return res.status(400).json({ error: 'Invalid pointRange: min must be less than max', code: 'INVALID_POINT_RANGE', status: 400 });
      }
      // Ensure step is valid (default 1 for whole numbers)
      if (!pointRange.step) {
        pointRange.step = 1;
      }
    }

    // Initialize enabledByPathway from param or use enabled as default
    const defaultEnabledByPathway = enabledByPathway || {
      'Research-Based': enabled !== false,
      'Solution-Based': enabled !== false,
    };

    // Resolve rubricItems from template if template(s) are selected
    let resolvedRubricItems = rubricItems || [];
    if (rubricTemplatesByPathway && !rubricItems) {
      resolvedRubricItems = await resolveRubricItemsFromTemplate(rubricTemplatesByPathway);
    }

    const standard = await GradingStandard.create({
      submissionType,
      gradingSystem: 'point-range',
      pointRange: pointRange || { min: 0, max: 20, step: 1 },
      templateName: templateName || null,
      rubricItems: resolvedRubricItems,
      rubricTemplatesByPathway: rubricTemplatesByPathway || { 'Research-Based': null, 'Solution-Based': null },
      pathways: pathways || ['Research-Based', 'Solution-Based'],
      description: description || '',
      dueDate: dueDate || null,
      enabled: enabled !== false,
      enabledByPathway: defaultEnabledByPathway,
      createdBy: req.auth.userId,
    });

    console.log('🟢 Backend saved pointRange:', standard.pointRange);
    console.log('🟢 Backend saved standard:', standard);

    res.status(201).json({ data: standard, status: 201 });
  } catch (error) {
    console.error('🔴 Backend error creating standard:', error);
    next(error);
  }
};

/**
 * PUT /grading-standards/:id  (Admin only)
 */
const updateGradingStandard = async (req, res, next) => {
  try {
    const { submissionType, pointRange, description, dueDate, enabled, templateName, rubricItems, rubricTemplatesByPathway, pathways, enabledByPathway } = req.body;

    console.log('🔵 Backend received UPDATE with pointRange:', pointRange);
    console.log('🔵 Backend UPDATE all body:', req.body);

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
        pointRange.step = 1;
      }
      standard.pointRange = pointRange;
    }

    if (submissionType) standard.submissionType = submissionType;
    if (description !== undefined) standard.description = description;
    if (dueDate !== undefined) standard.dueDate = dueDate;
    if (enabled !== undefined) standard.enabled = enabled;
    if (enabledByPathway !== undefined) {
      standard.enabledByPathway = enabledByPathway;
      standard.markModified('enabledByPathway');
    }
    if (templateName !== undefined) standard.templateName = templateName;
    if (rubricItems !== undefined) {
      standard.rubricItems = rubricItems;
      standard.markModified('rubricItems');
    } else if (rubricTemplatesByPathway !== undefined) {
      // If template is changed but no explicit rubricItems provided, resolve from template
      const resolvedRubricItems = await resolveRubricItemsFromTemplate(rubricTemplatesByPathway);
      standard.rubricItems = resolvedRubricItems;
      standard.markModified('rubricItems');
    }
    if (rubricTemplatesByPathway !== undefined) {
      standard.rubricTemplatesByPathway = rubricTemplatesByPathway;
      standard.markModified('rubricTemplatesByPathway');
    }
    if (pathways !== undefined) {
      standard.pathways = pathways;
      standard.markModified('pathways');
    }
    
    standard.updatedAt = new Date();

    await standard.save();
    
    console.log('🟢 Backend UPDATE saved pointRange:', standard.pointRange);
    console.log('🟢 Backend UPDATE saved standard:', standard);
    
    res.json({ data: standard, status: 200 });
  } catch (error) {
    console.error('🔴 Backend UPDATE error:', error);
    next(error);
  }
};

/**
 * GET /grading-standards/by-type/:submissionType
 * Get grading standard by submission type (for supervisor feedback form)
 */
const getGradingStandardBySubmissionType = async (req, res, next) => {
  try {
    const { submissionType } = req.params;
    const decodedSubmissionType = decodeURIComponent(submissionType);
    
    // Find enabled standard by submission type
    const standard = await GradingStandard.findOne({
      submissionType: decodedSubmissionType,
      enabled: true,
    });
    
    if (!standard) {
      return res.status(404).json({ error: 'No active grading standard found for this submission type', code: 'NOT_FOUND', status: 404 });
    }
    
    res.json({ data: standard, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /grading-standards/by-type-pathway/:submissionType/:pathway
 * Get grading standard by submission type AND pathway
 * Only returns standards that apply to the specified pathway
 */
const getGradingStandardBySubmissionTypeAndPathway = async (req, res, next) => {
  try {
    // Extract from query parameters (cleaner than path parameters for special characters)
    const { submissionType, pathway } = req.query;
    
    console.log('🔵 Query params:', { submissionType, pathway });
    
    if (!submissionType || !pathway) {
      return res.status(400).json({
        error: 'Missing required query parameters: submissionType and pathway',
        code: 'BAD_REQUEST',
        status: 400
      });
    }
    
    console.log('🔵 Fetching grading standard with:', { submissionType, pathway });
    
    // Find grading standard by submission type and check if it applies to this pathway
    const standard = await GradingStandard.findOne({
      submissionType,
      pathways: pathway, // Only return if this pathway is included
    });
    
    if (!standard) {
      return res.status(404).json({ 
        error: `No active grading standard found for submission type "${submissionType}" and pathway "${pathway}"`, 
        code: 'NOT_FOUND', 
        status: 404 
      });
    }

    // Check if enabled for this specific pathway
    const isEnabledForPathway = standard.enabledByPathway ? standard.enabledByPathway[pathway] : standard.enabled;
    if (!isEnabledForPathway) {
      return res.status(404).json({ 
        error: `Grading standard for "${submissionType}" is disabled for pathway "${pathway}"`, 
        code: 'NOT_FOUND', 
        status: 404 
      });
    }
    
    console.log('🟢 Found grading standard:', standard.submissionType);
    res.json({ data: standard, status: 200 });
  } catch (error) {
    console.error('❌ Error fetching grading standard by type and pathway:', error.message, error.stack);
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
  getGradingStandardBySubmissionType,
  getGradingStandardBySubmissionTypeAndPathway,
  createGradingStandard,
  updateGradingStandard,
  deleteGradingStandard,
};
