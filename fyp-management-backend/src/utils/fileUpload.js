const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const validateFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('File required');
  } else {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      errors.push('Only PDF and DOCX files allowed');
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size must be under 50MB (uploaded: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  ALLOWED_MIMETYPES,
  MAX_FILE_SIZE,
  validateFile,
};
