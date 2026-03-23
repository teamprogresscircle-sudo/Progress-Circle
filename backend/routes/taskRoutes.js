const express = require('express');
const { taskValidation } = require('../middleware/validation');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All task routes require auth

router.route('/')
    .get(getTasks)
    .post(taskValidation, createTask);

router.route('/:id')
    .put(taskValidation, updateTask)
    .delete(deleteTask);

module.exports = router;
