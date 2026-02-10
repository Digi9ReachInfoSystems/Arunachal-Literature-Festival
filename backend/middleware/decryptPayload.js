import { decryptData, decryptDataCBC } from '../utils/encryption.js';

/**
 * Middleware to decrypt encrypted request payload
 * Supports both encrypted and plain requests for backward compatibility
 */
export const decryptPayload = (req, res, next) => {
  try {
    // Check if request has encrypted data
    const hasEncryptedData = req.body.dataEncrypted === 'true' || req.body.dataEncrypted === true;
    const hasEncryptedBody = req.body.encryptedBody && req.body.encryptedBody.content && req.body.encryptedBody.iv;

    if (!hasEncryptedData || !hasEncryptedBody) {
      // No encryption - pass through as-is (backward compatibility)
      console.log('Request not encrypted, proceeding with plain data');
      return next();
    }

    // Get encryption key from environment
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server encryption configuration error'
      });
    }

    // Extract encrypted data and IV
    const { content, iv } = req.body.encryptedBody;

    console.log('Decrypting request payload...');

    // Try decryption with different modes (GCM first, then CBC for CryptoJS compatibility)
    let decryptedText;
    try {
      // Try AES-256-GCM first
      decryptedText = decryptData(content, iv, encryptionKey);
    } catch (gcmError) {
      console.log('GCM decryption failed, trying CBC mode for CryptoJS compatibility');
      try {
        // Try AES-256-CBC for CryptoJS compatibility
        decryptedText = decryptDataCBC(content, iv, encryptionKey);
      } catch (cbcError) {
        console.error('Decryption failed with both modes:', cbcError.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid encrypted data'
        });
      }
    }

    // Parse decrypted JSON
    try {
      const decryptedData = JSON.parse(decryptedText);
      
      // Replace req.body with decrypted data
      req.body = decryptedData;
      
      console.log('Payload decrypted successfully');
      next();
    } catch (parseError) {
      console.error('Failed to parse decrypted data:', parseError.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid encrypted payload format'
      });
    }

  } catch (error) {
    console.error('Decryption middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process encrypted request'
    });
  }
};

/**
 * Optional: Middleware to encrypt response data
 * Use this if you want to encrypt sensitive response data
 */
export const encryptResponse = (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method
  res.json = function(data) {
    // Check if encryption is requested
    if (req.body.dataEncrypted === 'true' || req.body.dataEncrypted === true) {
      try {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        if (encryptionKey) {
          const { encryptData } = require('../utils/encryption.js');
          const encrypted = encryptData(JSON.stringify(data), encryptionKey);
          
          return originalJson({
            encryptedResponse: encrypted,
            dataEncrypted: true
          });
        }
      } catch (error) {
        console.error('Response encryption failed:', error.message);
      }
    }
    
    // Fall back to normal response
    return originalJson(data);
  };

  next();
};
