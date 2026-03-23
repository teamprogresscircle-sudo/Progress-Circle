const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');


router.use(protect);

router.post('/start', sessionController.startSession);
router.post('/manual', sessionController.createManualSession);
router.patch('/end/:id', sessionController.endSession);
router.get('/active', sessionController.getActiveSession);
router.get('/', sessionController.getAllSessions);

module.exports = router;
