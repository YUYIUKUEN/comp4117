/**
 * Activity Formatter Utility
 * Converts ActivityLog entries into natural language descriptions
 * 
 * Format: "{UserName} {action_verb} {context_item} on {context_location}"
 * Examples:
 * - "Dr. Samuel Lee added feedback on Feedback"
 * - "Bob Chan replied to the feedback on Progress report"
 * - "Alice Johnson approved topic change on Topic Change Request"
 */

export interface ActivityItem {
  _id: string
  user_id: {
    _id: string
    fullName: string
    email: string
    role: string
  }
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
  timestamp: string
  submission_id?: string
}

// Mapping of actions to their past-tense verbs
const ACTION_VERB_MAP: Record<string, string> = {
  // Application actions
  'APPLY_TOPIC': 'applied for',
  'update_application_status': 'updated application',
  'application_withdrawn': 'withdrew application',
  'application_approved': 'approved application',
  'application_rejected': 'rejected application',
  'APPROVE_APPLICATION': 'approved application',
  'REJECT_APPLICATION': 'rejected application',
  
  // Submission actions
  'document_submitted': 'submitted',
  'submission_updated': 'updated submission',
  'submission_deleted': 'deleted submission',
  'submission_file_deleted': 'deleted file on',
  'submission_declared_not_needed': 'declared not needed',

  // Feedback actions
  'feedback_added': 'added feedback',
  'feedback_updated': 'updated feedback',
  'feedback_deleted': 'deleted feedback',
  'feedback_reply_added': 'replied to',
  'feedback_reply_updated': 'updated reply on',
  'feedback_reply_deleted': 'deleted reply on',

  // Topic Change Request actions
  'topic_change_requested': 'requested change on',
  'topic_change_approved': 'approved change on',
  'topic_change_rejected': 'rejected change on',

  // Topic actions
  'topic_created': 'created',
  'topic_updated': 'updated',
  'topic_deleted': 'deleted',
  'topic_approved': 'approved',
  'topic_rejected': 'rejected',

  // Assignment actions
  'assignment_created': 'created',
  'assignment_updated': 'updated',
  'assignment_submitted': 'submitted',

  // User actions
  'user_created': 'created',
  'user_updated': 'updated',
  'user_deleted': 'deleted',
  'password_changed': 'changed password',

  // Meeting actions
  'meeting_created': 'created',
  'meeting_updated': 'updated',
  'meeting_deleted': 'deleted',
  'meeting_approved': 'approved',
  'meeting_rejected': 'rejected',

  // Auth actions
  'login': 'logged in',
  'logout': 'logged out',
  'login_failed': 'failed login attempt',
  'password_reset': 'reset password',

  // Generic actions
  'added': 'added',
  'updated': 'updated',
  'deleted': 'deleted',
  'approved': 'approved',
  'rejected': 'rejected',
  'mentioned': 'mentioned',
  'assigned': 'assigned',
}

// Mapping of entityType to context location names
const ENTITY_TYPE_MAP: Record<string, string> = {
  'Application': 'Application',
  'Submission': 'Submission',
  'Feedback': 'Feedback',
  'TopicChangeRequest': 'Topic Change Request',
  'Topic': 'Topic',
  'Assignment': 'Task',
  'User': 'User',
  'Meeting': 'Meeting',
  'Comment': 'Comment thread',
  'Approval': 'Approval',
  'ProgressReport': 'Progress report',
  'Document': 'Document',
  'Task': 'Task',
}

/**
 * Extracts the base verb from an action
 * e.g., "feedback_reply_added" -> "added"
 */
function getBaseVerb(action: string): string {
  const verb = ACTION_VERB_MAP[action]
  if (verb) return verb

  // Extract verb from action pattern (snake_case)
  const parts = action.toLowerCase().split('_')
  const lastPart = parts[parts.length - 1]!

  // Map common endings
  const verbMap: Record<string, string> = {
    'added': 'added',
    'updated': 'updated',
    'deleted': 'deleted',
    'created': 'created',
    'approved': 'approved',
    'rejected': 'rejected',
    'submitted': 'submitted',
    'replied': 'replied',
    'mentioned': 'mentioned',
    'assigned': 'assigned',
  }

  return verbMap[lastPart] || 'performed'
}

/**
 * Gets the context type from entityType
 * Handles both direct mapping and fallback to entityType
 */
function getContextType(entityType: string): string {
  return ENTITY_TYPE_MAP[entityType] || entityType
}

/**
 * Determines if the action is a "reply" type action
 */
function isReplyAction(action: string): boolean {
  return action.includes('reply') || action.includes('responded')
}

/**
 * Determines if the action is an "approval" type action
 */
function isApprovalAction(action: string): boolean {
  return (
    action.includes('approved') ||
    action.includes('rejected') ||
    action.includes('pending') ||
    action.includes('reviewed')
  )
}

/**
 * Formats an activity item into a human-readable description
 * 
 * @param activity - The activity log entry
 * @returns Formatted activity description as plain text
 * 
 * Examples:
 * "Dr. Samuel Lee added feedback on Feedback (Progress Report 1)"
 * "Bob Chan replied to the feedback on Progress report (Initial Statement)"
 * "Alice Johnson approved Topic Change Request"
 */
export function formatActivityDescription(activity: ActivityItem): string {
  const userName = activity.user_id?.fullName || 'Unknown User'
  const action = activity.action || ''
  const entityType = activity.entityType || ''

  // Get the verb phrase
  const verb = getBaseVerb(action)
  const contextType = getContextType(entityType)

  // Get submission phase if available
  const submissionPhase = activity.details?.phase || activity.details?.submissionType
  const submissionLabel = submissionPhase ? ` (${submissionPhase})` : ''

  // Construct the description
  let description = `${userName} ${verb}`

  // Handle special cases for different action/entity combinations
  if (isReplyAction(action)) {
    // For reply actions: "{User} replied to {context_type} on {location}"
    description = `${userName} replied to the ${contextType.toLowerCase()} on ${contextType}${submissionLabel}`
  } else if (isApprovalAction(action)) {
    // For approval actions: "{User} {approved|rejected} {context_type}"
    description = `${userName} ${verb} ${contextType}${submissionLabel}`
  } else if (action.includes('delete') || verb === 'deleted') {
    // For deletion: "{User} deleted {context_type}"
    description = `${userName} deleted ${contextType}${submissionLabel}`
  } else if (verb.endsWith(' on')) {
    // If verb already ends with "on", just append contextType
    description = `${userName} ${verb} ${contextType}${submissionLabel}`
  } else {
    // Default: "{User} {verb} on {context_type}"
    description = `${userName} ${verb} on ${contextType}${submissionLabel}`
  }

  return description
}

/**
 * Formats activity timestamp into a relative time string
 * 
 * @param timestamp - ISO date string
 * @returns Relative time description (e.g., "5m ago", "2h ago")
 */
export function formatActivityTimestamp(timestamp: string): string {
  const now = new Date()
  const actDate = new Date(timestamp)
  const diffMs = now.getTime() - actDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return actDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default {
  formatActivityDescription,
  formatActivityTimestamp,
}
