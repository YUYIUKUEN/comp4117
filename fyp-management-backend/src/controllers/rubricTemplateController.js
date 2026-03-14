const RubricTemplate = require('../models/RubricTemplate');

/**
 * GET /rubric-templates
 * Get all rubric templates
 */
const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await RubricTemplate.find().sort({ name: 1 });
    res.json({ data: templates, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /rubric-templates/:id
 * Get a specific rubric template
 */
const getTemplateById = async (req, res, next) => {
  try {
    const template = await RubricTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ 
        error: 'Rubric template not found', 
        code: 'NOT_FOUND', 
        status: 404 
      });
    }
    res.json({ data: template, status: 200 });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /rubric-templates
 * Create a new rubric template (admin only)
 */
const createTemplate = async (req, res, next) => {
  try {
    const { name, description, rubricItems, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Template name is required', 
        code: 'INVALID_REQUEST', 
        status: 400 
      });
    }

    const template = await RubricTemplate.create({
      name,
      description: description || '',
      rubricItems: rubricItems || [],
      isDefault: isDefault || false,
      createdBy: req.auth.userId,
    });

    res.status(201).json({ data: template, status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Template name already exists', 
        code: 'DUPLICATE_NAME', 
        status: 400 
      });
    }
    next(error);
  }
};

/**
 * PUT /rubric-templates/:id
 * Update a rubric template (admin only)
 */
const updateTemplate = async (req, res, next) => {
  try {
    const { name, description, rubricItems, isDefault } = req.body;

    const template = await RubricTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ 
        error: 'Rubric template not found', 
        code: 'NOT_FOUND', 
        status: 404 
      });
    }

    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (rubricItems !== undefined) {
      template.rubricItems = rubricItems;
      template.markModified('rubricItems');
    }
    if (isDefault !== undefined) template.isDefault = isDefault;

    template.updatedAt = new Date();
    await template.save();

    res.json({ data: template, status: 200 });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Template name already exists', 
        code: 'DUPLICATE_NAME', 
        status: 400 
      });
    }
    next(error);
  }
};

/**
 * DELETE /rubric-templates/:id
 * Delete a rubric template (admin only)
 */
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await RubricTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ 
        error: 'Rubric template not found', 
        code: 'NOT_FOUND', 
        status: 404 
      });
    }

    await RubricTemplate.deleteOne({ _id: req.params.id });
    res.json({ message: 'Rubric template deleted', status: 200 });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
