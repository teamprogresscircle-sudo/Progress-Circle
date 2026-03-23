const { body } = require('express-validator');

// Auth Validations
exports.registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidation = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

// Profile Validations
exports.updateProfileValidation = [
    body('name').optional().trim().isLength({ max: 50 }),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
    body('savingsEnabled').optional().isBoolean(),
    body('fitnessEnabled').optional().isBoolean(),
    body('nutritionEnabled').optional().isBoolean(),
    body('habitsEnabled').optional().isBoolean(),
    body('synergyEnabled').optional().isBoolean(),
];

// Task Validations
exports.taskValidation = [
    body('title').optional().trim().notEmpty().withMessage('Task title is required').isLength({ max: 100 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['pending', 'in_progress', 'active', 'completed', 'cancelled']),
    body('deadline').optional().isISO8601().toDate(),
];

// Nutrition Validations
exports.nutritionValidation = [
    body('date').optional().isISO8601().toDate(),
    body('waterIntake').optional().isInt({ min: 0 }),
];

exports.mealValidation = [
    body('name').trim().notEmpty().withMessage('Meal name is required'),
    body('calories').isInt({ min: 0 }),
    body('protein').optional().isInt({ min: 0 }),
    body('carbs').optional().isInt({ min: 0 }),
    body('fats').optional().isInt({ min: 0 }),
];
