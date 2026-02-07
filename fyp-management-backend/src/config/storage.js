const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORAGE_DIR = path.join(__dirname, '../../uploads');
const UPLOADS_SUBDIR = 'submissions';
const SUBMISSIONS_DIR = path.join(STORAGE_DIR, UPLOADS_SUBDIR);

// Ensure directories exist
[STORAGE_DIR, SUBMISSIONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const getSubmissionPath = (studentId, phase) => {
  const sanitizedPhase = phase.replace(/\s+/g, '-').toLowerCase();
  return path.join(SUBMISSIONS_DIR, studentId, sanitizedPhase);
};

const generateFilename = (originalName) => {
  const ext = path.extname(originalName);
  const suffix = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${suffix}${ext}`;
};

const saveFile = (file, studentId, phase) => {
  const submissionPath = getSubmissionPath(studentId, phase);
  
  // Ensure submission directory exists
  if (!fs.existsSync(submissionPath)) {
    fs.mkdirSync(submissionPath, { recursive: true });
  }

  const filename = generateFilename(file.originalname);
  const filepath = path.join(submissionPath, filename);

  // Write file to disk
  fs.writeFileSync(filepath, file.buffer);

  return {
    filename,
    filepath,
  };
};

const getFile = (studentId, phase, filename) => {
  const submissionPath = getSubmissionPath(studentId, phase);
  const filepath = path.join(submissionPath, filename);

  // Security check: ensure the resolved path is within the submissions directory
  const realPath = path.resolve(filepath);
  const realSubmissionsDir = path.resolve(submissionPath);
  
  if (!realPath.startsWith(realSubmissionsDir)) {
    throw new Error('Invalid file path');
  }

  if (!fs.existsSync(filepath)) {
    throw new Error('File not found');
  }

  return filepath;
};

const deleteFile = (studentId, phase, filename) => {
  try {
    const filepath = getFile(studentId, phase, filename);
    fs.unlinkSync(filepath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  STORAGE_DIR,
  SUBMISSIONS_DIR,
  getSubmissionPath,
  generateFilename,
  saveFile,
  getFile,
  deleteFile,
};
