// ---------- USER Routing ----------
// Import packages (express, express-fileupload)
const express = require(`express`);
const router = express.Router();
const fileUpload = require(`express-fileupload`);

// Import user controllers
const userCtrl = require(`../controllers/user`);

// Import middleware
const authentication = require(`../middleware/authentication`);

// ---------- Routes POST ----------
// SignUp
router.post(`/user/signup`, fileUpload(), userCtrl.userSignup);
// Login
router.post(`/user/login`, userCtrl.userLogin);

// Export route
module.exports = router;
