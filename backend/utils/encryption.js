const crypto = require('crypto');
const dotenv = require('dotenv');
const logger = require('../services/logger');

dotenv.config();

// Encryption configuration
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production';
// Use environment variable for salt, fallback to a more complex default or random string
const salt =
  process.env.ENCRYPTION_SALT || 'complex-default-salt-for-derivation-change-in-production';
const key = crypto.scryptSync(secretKey, salt, 32);

/**
 * Encrypt a string with a random IV
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text with IV prepended (format: ivHex:encryptedHex)
 */
function encrypt(text) {
  try {
    // Generate a random 16-byte IV
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prepend the IV (as hex) to the encrypted text
    const ivHex = iv.toString('hex');
    return `${ivHex}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error:', error.message);
    return text; // Return original text if encryption fails
  }
}

/**
 * Decrypt a string that has an IV prepended
 * @param {string} encryptedText - Encrypted text with IV prepended (format: ivHex:encryptedHex)
 * @returns {string} Decrypted text
 */
function decrypt(encryptedText) {
  try {
    // Extract the IV and encrypted text
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }

    const ivHex = parts[0];
    const encryptedHex = parts[1];

    // Convert IV from hex
    const iv = Buffer.from(ivHex, 'hex');

    // Decrypt the text
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error.message);
    return encryptedText; // Return original text if decryption fails
  }
}

/**
 * Decrypt environment variable if it appears to be encrypted
 * @param {string} envVar - Environment variable value
 * @returns {string} Decrypted value or original if not encrypted
 */
function decryptEnvVar(envVar) {
  // If the value looks like it might be encrypted (format: ivHex:encryptedHex)
  // Check if it has the correct format: 32 hex characters for IV, colon, then encrypted data
  if (envVar && typeof envVar === 'string' && /^[0-9a-fA-F]{32}:/.test(envVar)) {
    try {
      // Try to decrypt it
      const decrypted = decrypt(envVar);
      // If decryption succeeds and produces a reasonable result, return it
      if (decrypted && decrypted.length > 0) {
        return decrypted;
      }
    } catch (error) {
      // If decryption fails, return the original value
      return envVar;
    }
  }
  // Return original value if it doesn't look encrypted or decryption failed
  return envVar;
}

/**
 * Get decrypted environment variable
 * @param {string} varName - Environment variable name
 * @param {string} defaultValue - Default value if variable is not set
 * @returns {string} Decrypted environment variable value
 */
function getDecryptedEnvVar(varName, defaultValue = null) {
  const value = process.env[varName] || defaultValue;
  return decryptEnvVar(value);
}

module.exports = {
  encrypt,
  decrypt,
  decryptEnvVar,
  getDecryptedEnvVar,
};
