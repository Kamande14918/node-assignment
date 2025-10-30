const express = require('express');
const router = express.Router();
const {register, login, logoff  } = require('../controllers/userController');

router.post('/register', register);
router.get('/logon', login);
router.get('/logoff',logoff);

module.exports = router;