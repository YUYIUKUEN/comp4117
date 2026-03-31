const GradingStandard = require('../models/GradingStandard');
const Assignment = require('../models/Assignment');

/**
 * Service to manage pathway-specific rubric and grading standard assignments
 */

/**
 * Get grading standards for a specific submission type and pathway
 * @param {string} submissionType - The submission phase (e.g., "Proposal", "Interim Report")
 * @param {string} pathway - The pathway ('Research-Based' or 'Solution-Based')
 * @returns {Promise<Array>} Array of grading standards matching the criteria
 */
async function getGradingStandardsForPathway(submissionType, pathway) {
  try {
    // Look for standards that include this pathway in their pathways array
    const standards = await GradingStandard.find({
      submissionType,
      enabled: true,
      pathways: pathway, // Check if pathway is in the pathways array
    });

    return standards;
  } catch (error) {
    console.error(`Error fetching grading standards for ${submissionType}/${pathway}:`, error);
    throw error;
  }
}

/**
 * Auto-assign rubrics (grading standards) when an assignment is created
 * This function is called after supervisor approves an application
 * @param {string} assignmentId - The assignment ID
 * @param {string} pathway - The pathway ('Research-Based' or 'Solution-Based')
 * @returns {Promise<Object>} Object with assignment and assigned standards info
 */
async function autoAssignRubricsToAssignment(assignmentId, pathway) {
  try {
    const assignment = await Assignment.findById(assignmentId)
      .populate('student_id')
      .populate('topic_id')
      .populate('supervisor_id');

    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    // Standard submission phases/types in the system
    const submissionTypes = [
      'Proposal',
      'Interim Report',
      'Final Report',
      'Presentation',
      'Continuous Assessment',
    ];

    const assignedStandards = [];

    // For each submission type, find and record the appropriate grading standard
    for (const submissionType of submissionTypes) {
      const standards = await getGradingStandardsForPathway(submissionType, pathway);
      if (standards.length > 0) {
        assignedStandards.push({
          submissionType,
          pathway,
          gradingStandardId: standards[0]._id, // Use first matching standard
          templateName: standards[0].templateName,
          pointRange: standards[0].pointRange,
        });
      }
    }

    // Store assignment info for tracking (could be extended to store on Assignment model)
    const result = {
      assignmentId,
      studentId: assignment.student_id._id,
      topicId: assignment.topic_id._id,
      pathway,
      assignedStandards,
      timestamp: new Date(),
    };

    console.log(`✅ Rubrics auto-assigned for assignment ${assignmentId}:`, assignedStandards);
    return result;
  } catch (error) {
    console.error('Error auto-assigning rubrics:', error);
    throw error;
  }
}

/**
 * Get rubric standards for a student's assignment at their assignment time
 * @param {string} assignmentId - The assignment ID
 * @returns {Promise<Object>} Rubric standards info
 */
async function getRubricStandardsForAssignment(assignmentId) {
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const { pathway } = assignment;

    // Get all submission types for this pathway
    const submissionTypes = [
      'Proposal',
      'Interim Report',
      'Final Report',
      'Presentation',
      'Continuous Assessment',
    ];

    const standardsByType = {};

    for (const submissionType of submissionTypes) {
      const standards = await getGradingStandardsForPathway(submissionType, pathway);
      standardsByType[submissionType] = standards;
    }

    return {
      assignmentId,
      pathway,
      standards: standardsByType,
    };
  } catch (error) {
    console.error('Error fetching rubric standards for assignment:', error);
    throw error;
  }
}

module.exports = {
  getGradingStandardsForPathway,
  autoAssignRubricsToAssignment,
  getRubricStandardsForAssignment,
};
