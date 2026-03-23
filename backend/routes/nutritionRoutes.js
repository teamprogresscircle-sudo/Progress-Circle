const express = require('express');
const router = express.Router();
const { nutritionValidation, mealValidation } = require('../middleware/validation');
const { 
    getDailyNutrition, 
    addMeal, 
    updateWater, 
    deleteMeal 
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/:date', getDailyNutrition);
router.post('/:date/meal', mealValidation, addMeal);
router.put('/:date/water', updateWater);
router.delete('/:date/meal/:mealId', deleteMeal);

module.exports = router;
