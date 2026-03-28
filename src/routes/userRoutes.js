const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getAllUsers,
    getMe,
    refreshAccessToken,
    logoutUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);

// Protected routes (require authentication)
router.use(protect);
router.get('/me', getMe);
router.post('/logout', logoutUser);
router.get('/', authorize('admin'), getAllUsers);

module.exports = router;