const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Encryption configuration
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production';
const key = crypto.scryptSync(secretKey, 'GfG', 32);
const iv = Buffer.alloc(16, 0); // Initialization vector

/**
 * Encrypt a string
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text in hex format
 */
function encrypt(text) {
  try {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error.message);
    return text; // Return original text if encryption fails
  }
}

/**
 * Decrypt a string
 * @param {string} encryptedText - Encrypted text in hex format
 * @returns {string} Decrypted text
 */
function decrypt(encryptedText) {
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return encryptedText; // Return original text if decryption fails
  }
}

/**
 * Decrypt environment variable if it appears to be encrypted
 * @param {string} envVar - Environment variable value
 * @returns {string} Decrypted value or original if not encrypted
 */
function decryptEnvVar(envVar) {
  // If the value looks like it might be encrypted (hex string of appropriate length)
  if (envVar && typeof envVar === 'string' && /^[0-9a-fA-F]+$/.test(envVar) && envVar.length >= 32) {
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
  getDecryptedEnvVar
};