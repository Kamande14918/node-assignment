const express = require("express");
const router = express.Router();
const {analytics, users, search} = require("../controllers/analyticsController");

router.route("/users/:id").get(analytics)
router.route("/users").get(users);
router.route("/search").get(search)

module.exports = router;