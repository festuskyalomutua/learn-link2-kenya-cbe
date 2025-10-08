Frontend development
server/routes/assessments.js:

const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const auth = require('../middleware/auth');

// Get all assessments
router.get('/', auth, async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new assessment
router.post('/', auth, async (req, res) => {
  try {
    const assessment = new Assessment({
      ...req.body,
      createdBy: req.user.id
    });
    await assessment.save();
    res.status(201).json(assessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Submit assessment
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const { answers } = req.body;
    
    // Calculate scores and competency levels
    let totalScore = 0;
    const competencyScores = {};
    
    answers.forEach(answer => {
      const question = assessment.questions.id(answer.questionId);
      if (question) {
        const score = calculateQuestionScore(question, answer.answer);
        totalScore += score;
        
        // Map to competency
        if (question.competencyMapping) {
          if (!competencyScores[question.competencyMapping]) {
            competencyScores[question.competencyMapping] = { total: 0, count: 0 };
          }
          competencyScores[question.competencyMapping].total += score;
          competencyScores[question.competencyMapping].count += 1;
        }
      }
    });

    // Convert competency scores to levels
    const competencyLevels = Object.keys(competencyScores).map(comp => ({
      competency: comp,
      score: competencyScores[comp].total / competencyScores[comp].count,
      level: Math.ceil((competencyScores[comp].total / competencyScores[comp].count) / 25) // Convert to 1-4 scale
    }));

    const submission = {
      student: req.user.id,
      answers,
      competencyScores: competencyLevels,
      totalScore,
      submittedAt: new Date()
    };

    assessment.submissions.push(submission);
    await assessment.save();

    res.json({ message: 'Assessment submitted successfully', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function calculateQuestionScore(question, answer) {
  // Simple scoring logic - can be enhanced
  if (question.type === 'multiple-choice') {
    return answer === question.correctAnswer ? question.points : 0;
  }
  // For other types, implement more sophisticated scoring
  return question.points * 0.8; // Placeholder
}

module.exports = router;

