// Validate and sanitize email input
export const validateEmail = (email) => {
  // Check if email is a string (prevent NoSQL injection)
  if (typeof email !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }

  // Remove whitespace and convert to lowercase
  const sanitized = email.trim().toLowerCase();

  // Check if empty after trimming
  if (sanitized === '') {
    return { valid: false, error: 'Email is required' };
  }

  // Validate email format with regex
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check max length (prevent buffer overflow)
  if (sanitized.length > 254) {
    return { valid: false, error: 'Email too long' };
  }

  return { valid: true, sanitized };
};

// Validate password input
export const validatePassword = (password) => {
  // Check if password is a string (prevent NoSQL injection)
  if (typeof password !== 'string') {
    return { valid: false, error: 'Invalid input type' };
  }

  // Check if empty
  if (password === '') {
    return { valid: false, error: 'Password is required' };
  }

  // Check minimum length
  if (password.length < 6) {
    return { valid: false, error: 'Invalid credentials' }; // Generic message for security
  }

  // Check max length (prevent DoS)
  if (password.length > 128) {
    return { valid: false, error: 'Invalid credentials' };
  }

  return { valid: true };
};
