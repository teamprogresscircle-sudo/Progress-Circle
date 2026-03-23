const express = require('express');
const router = express.Router();
const { getCalendarEvents, createScheduleBlock, deleteScheduleBlock } = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCalendarEvents);
router.post('/blocks', createScheduleBlock);
router.delete('/blocks/:id', deleteScheduleBlock);

module.exports = router;
