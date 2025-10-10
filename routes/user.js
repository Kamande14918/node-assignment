const express = require ("express");
const router = express.Router();

const {register, logon, logoff} = require("../controllers/userController");

router.route("/").post(register);
router.route("/").get(logon);
router.route("/").post(logoff);
module.exports = router;