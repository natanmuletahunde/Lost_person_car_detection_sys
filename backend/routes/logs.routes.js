const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  console.log('Signup log:', req.body);
  res.status(201).json({ success: true });
});

module.exports = router;