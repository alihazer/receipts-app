const router = require('express').Router();

// Render the main dashboard
router.get('/', (req, res) => {
  res.render('dashboard');
});

module.exports = router;
