const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented next
router.get('/:location', (req, res) => {
  res.json({ message: 'Weather endpoint - Coming soon' });
});

module.exports = router;