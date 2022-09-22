const authController = require('../controller/authController');
const middlewareController = require("../controller/middlewareController");

const router = require('express').Router();

// Register
router.post("/register", authController.registerUser);

// Login
router.post("/login", authController.loginUser);

// Refresh
router.post("/refresh", authController.requestRefreshTonken)

// Log out
router.post("/logout", middlewareController.verifyToken, authController.userLogout)

module.exports = router;