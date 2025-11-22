// i18n configuration
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

const i18n = i18next.createInstance({
  lng: 'en', // Default language
  fallbackLng: 'en', // Fallback language
  preload: ['en', 'es', 'fr', 'de', 'zh'], // Preload languages
  ns: ['translation'], // Namespaces
  defaultNS: 'translation', // Default namespace
  backend: {
    loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'), // Path to translation files
  },
  detection: {
    // Order and from where user language should be detected
    order: ['querystring', 'cookie', 'header'],
    
    // Keys or params to lookup language from
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupHeader: 'accept-language',
    
    // Cache user language
    caches: ['cookie'],
    cookieMinutes: 10,
    cookieDomain: 'localhost',
  },
});

// Initialize i18next with backend
i18n
  .use(Backend)
  .init()
  .catch((err) => {
    console.error('Error initializing i18next:', err);
  });

module.exports = i18n;