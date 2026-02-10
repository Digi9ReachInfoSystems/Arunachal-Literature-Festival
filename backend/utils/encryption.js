import crypto from 'crypto';

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Base64 or hex encoded encrypted data
 * @param {string} ivHex - Initialization vector in hex format
 * @param {string} keyHex - Encryption key in hex format (64 chars = 32 bytes)
 * @returns {string} - Decrypted plain text
 */
export const decryptData = (encryptedData, ivHex, keyHex) => {
  try {
    // Convert hex strings to buffers
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Try to parse as base64 first, then hex
    let encryptedBuffer;
    try {
      encryptedBuffer = Buffer.from(encryptedData, 'base64');
    } catch (e) {
      encryptedBuffer = Buffer.from(encryptedData, 'hex');
    }

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    // Decrypt
    let decrypted = decipher.update(encryptedBuffer, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Decrypt data using AES-256-CBC (alternative for CryptoJS compatibility)
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} ivHex - Initialization vector in hex format
 * @param {string} keyHex - Encryption key in hex format (64 chars = 32 bytes)
 * @returns {string} - Decrypted plain text
 */
export const decryptDataCBC = (encryptedData, ivHex, keyHex) => {
  try {
    // Convert hex strings to buffers
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Decode base64 encrypted data
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');

    // Create decipher with AES-256-CBC (CryptoJS default)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption CBC error:', error.message);
    throw new Error('Failed to decrypt data (CBC mode)');
  }
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Plain text data to encrypt
 * @param {string} keyHex - Encryption key in hex format (64 chars = 32 bytes)
 * @returns {object} - Object containing encrypted data and IV
 */
export const encryptData = (data, keyHex) => {
  try {
    // Convert key to buffer
    const key = Buffer.from(keyHex, 'hex');
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return {
      content: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Generate a random 32-byte encryption key
 * @returns {string} - 64 character hex string (32 bytes)
 */
export const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};
