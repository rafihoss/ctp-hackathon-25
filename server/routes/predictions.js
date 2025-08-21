const express = require('express');
const router = express.Router();
const PredictionService = require('../services/predictionService');

const predictionService = new PredictionService();

// Predict grade for a specific professor and course
router.post('/grade', async (req, res) => {
  try {
    const { professorName, courseSubject, courseNumber, studentGPA } = req.body;
    
    if (!professorName || !courseSubject || !courseNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: professorName, courseSubject, courseNumber' 
      });
    }

    const prediction = await predictionService.predictGrade(
      professorName, 
      courseSubject, 
      courseNumber, 
      studentGPA || null
    );

    res.json(prediction);
  } catch (error) {
    console.error('Grade prediction error:', error);
    res.status(500).json({ error: 'Failed to generate grade prediction' });
  }
});

// Get course recommendations
router.post('/courses', async (req, res) => {
  try {
    const { studentGPA, preferredSubjects, maxDifficulty } = req.body;
    
    if (!studentGPA) {
      return res.status(400).json({ 
        error: 'Missing required field: studentGPA' 
      });
    }

    const recommendations = await predictionService.recommendCourses(
      parseFloat(studentGPA),
      preferredSubjects || [],
      parseFloat(maxDifficulty) || 4.0
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Course recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate course recommendations' });
  }
});

// Match professors based on learning style
router.post('/professors', async (req, res) => {
  try {
    const { studentGPA, courseSubject, courseNumber, learningStyle } = req.body;
    
    if (!studentGPA || !courseSubject || !courseNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentGPA, courseSubject, courseNumber' 
      });
    }

    const matches = await predictionService.matchProfessor(
      parseFloat(studentGPA),
      courseSubject,
      courseNumber,
      learningStyle || 'balanced'
    );

    res.json(matches);
  } catch (error) {
    console.error('Professor matching error:', error);
    res.status(500).json({ error: 'Failed to match professors' });
  }
});

// Get learning style recommendations
router.get('/learning-styles', (req, res) => {
  const learningStyles = [
    {
      id: 'high_achiever',
      name: 'High Achiever',
      description: 'Prefers challenging courses with high A grade potential',
      characteristics: ['High GPA', 'Strong academic record', 'Seeks challenging coursework']
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Prefers courses with good grade distribution and moderate difficulty',
      characteristics: ['Average to above-average GPA', 'Balanced approach to academics']
    },
    {
      id: 'supportive',
      name: 'Supportive',
      description: 'Prefers courses with supportive teaching and higher pass rates',
      characteristics: ['May need academic support', 'Prefers clear teaching methods']
    }
  ];

  res.json({ learningStyles });
});

// Get difficulty levels
router.get('/difficulty-levels', (req, res) => {
  const difficultyLevels = [
    {
      level: 'Easy',
      gpaRange: '3.5-4.0',
      description: 'Courses with high average GPAs and good grade distributions'
    },
    {
      level: 'Moderate',
      gpaRange: '3.0-3.5',
      description: 'Courses with average difficulty and balanced grade distributions'
    },
    {
      level: 'Challenging',
      gpaRange: '2.5-3.0',
      description: 'Courses that require significant effort but are manageable'
    },
    {
      level: 'Difficult',
      gpaRange: 'Below 2.5',
      description: 'Courses with low average GPAs that require extensive preparation'
    }
  ];

  res.json({ difficultyLevels });
});

module.exports = router;
