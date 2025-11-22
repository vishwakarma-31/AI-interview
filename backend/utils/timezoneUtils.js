const { interview } = require('../config');

/**
 * Timezone Utility
 * Handles timezone conversions and formatting for scheduled interviews
 */

/**
 * Convert a date to a specific timezone
 * @param {Date} date - Date to convert
 * @param {string} timezone - Target timezone (e.g., 'America/New_York')
 * @returns {Date} - Date converted to the target timezone
 */
function convertToTimezone(date, timezone) {
  if (!date) return null;
  
  // If no timezone specified, use default
  const targetTimezone = timezone || interview.defaultTimezone;
  
  // Validate timezone
  if (!isValidTimezone(targetTimezone)) {
    console.warn(`Invalid timezone: ${targetTimezone}, using UTC instead`);
    return new Date(date.getTime()); // Return original date if timezone is invalid
  }
  
  try {
    // Create a new Date object in the target timezone
    const convertedDate = new Date(
      date.toLocaleString('en-US', { timeZone: targetTimezone })
    );
    
    return convertedDate;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return new Date(date.getTime()); // Return original date if conversion fails
  }
}

/**
 * Format a date for display in a specific timezone
 * @param {Date} date - Date to format
 * @param {string} timezone - Target timezone
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted date string
 */
function formatInTimezone(date, timezone, locale = 'en-US') {
  if (!date) return '';
  
  // If no timezone specified, use default
  const targetTimezone = timezone || interview.defaultTimezone;
  
  // Validate timezone
  if (!isValidTimezone(targetTimezone)) {
    console.warn(`Invalid timezone: ${targetTimezone}, using UTC instead`);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }
  
  try {
    // Format the date in the target timezone
    return date.toLocaleString(locale, {
      timeZone: targetTimezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error formatting timezone:', error);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }
}

/**
 * Get current time in a specific timezone
 * @param {string} timezone - Target timezone
 * @returns {Date} - Current time in the target timezone
 */
function getCurrentTimeInTimezone(timezone) {
  const targetTimezone = timezone || interview.defaultTimezone;
  
  // Validate timezone
  if (!isValidTimezone(targetTimezone)) {
    console.warn(`Invalid timezone: ${targetTimezone}, using UTC instead`);
    return new Date();
  }
  
  try {
    const now = new Date();
    
    // Create a new Date object representing current time in the target timezone
    return new Date(
      now.toLocaleString('en-US', { timeZone: targetTimezone })
    );
  } catch (error) {
    console.error('Error getting current time in timezone:', error);
    return new Date(); // Return current time if conversion fails
  }
}

/**
 * Validate if a timezone string is valid
 * @param {string} timezone - Timezone to validate
 * @returns {boolean} - Whether the timezone is valid
 */
function isValidTimezone(timezone) {
  if (!timezone) return false;
  
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get list of supported timezones
 * @returns {Array} - Array of supported timezone strings
 */
function getSupportedTimezones() {
  // For now, return common timezones
  // In a more advanced implementation, this could be configurable
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];
}

module.exports = {
  convertToTimezone,
  formatInTimezone,
  getCurrentTimeInTimezone,
  isValidTimezone,
  getSupportedTimezones
};