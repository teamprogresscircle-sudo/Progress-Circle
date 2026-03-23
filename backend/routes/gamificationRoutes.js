const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getGamificationData,
    saveAvatarConfig,
    buyItem,
    getCommunityStats,
    getShop,
    testGrantTree,
} = require('../controllers/gamificationController');

router.get('/', protect, getGamificationData);
router.put('/avatar', protect, saveAvatarConfig);
router.post('/buy', protect, buyItem);
router.get('/community', protect, getCommunityStats);
router.get('/shop', protect, getShop);

// TEST ROUTE: strictly for testing UI
router.post('/test-tree', protect, testGrantTree);

module.exports = router;
