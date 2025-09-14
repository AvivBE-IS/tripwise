const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented next
router.get('/:flightNumber', (req, res) => {
  res.json({ message: 'Flight status endpoint - Coming soon' });
});

module.exports = router;