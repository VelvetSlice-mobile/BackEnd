const express = require('express');
const router = express.Router();
const cupomController = require('../controllers/cupomController');

router.post('/validate', cupomController.validateCupom);

module.exports = router;
