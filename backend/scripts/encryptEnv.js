const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Encryption configuration
const algorithm = 'aes-256-cbc';
const secretKey = 'your-encryption-key-change-in-production'; // This should be a strong secret key
const key = crypto.scryptSync(secretKey, 'GfG', 32);
const iv = Buffer.alloc(16, 0); // Initialization vector

/**
 * Encrypt a string
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text in hex format
 */
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Read the original .env file
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Environment variables to encrypt
const sensitiveVars = [
  'MONGO_URI',
  'OPENAI_API_KEY',
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY'
];

// Replace the sensitive variables with their encrypted versions
for (const varName of sensitiveVars) {
  const regex = new RegExp(`^${varName}=(.*)$`, 'm');
  const match = envContent.match(regex);
  
  if (match) {
    const originalValue = match[1];
    const encryptedValue = encrypt(originalValue);
    envContent = envContent.replace(regex, `${varName}=${encryptedValue}`);
    console.log(`Encrypted ${varName}: ${encryptedValue}`);
  }
}

// Write the updated .env file
fs.writeFileSync(envPath, envContent);

console.log('Environment variables encrypted successfully!');