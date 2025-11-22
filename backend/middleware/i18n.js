// i18n middleware
const i18n = require('../config/i18n');

const i18nMiddleware = (req, res, next) => {
  // Get language from query param, cookie, or header
  const lng = req.query.lng || req.cookies.i18next || req.headers['accept-language'] || 'en';
  
  // Change language
  i18n.changeLanguage(lng, (err, t) => {
    if (err) {
      console.error('Error changing language:', err);
    }
    
    // Attach i18n instance and translator function to request
    req.i18n = i18n;
    req.t = t;
    
    next();
  });
};

module.exports = i18nMiddleware;