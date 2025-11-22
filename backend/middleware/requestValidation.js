// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check for unexpected fields in request body
  if (req.body && typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body format' });
  }
  
  // Check for unexpected fields in query parameters
  if (req.query && typeof req.query !== 'object') {
    return res.status(400).json({ error: 'Invalid query parameters format' });
  }
  
  // Check for unexpected fields in route parameters
  if (req.params && typeof req.params !== 'object') {
    return res.status(400).json({ error: 'Invalid route parameters format' });
  }
  
  next();
};

module.exports = { validateRequest };